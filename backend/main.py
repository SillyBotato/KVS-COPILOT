import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware


# ---------------------------------------------------------------------
# PROJECT PATH SETUP
# ---------------------------------------------------------------------

WEBAPP_ROOT = Path(__file__).resolve().parent.parent

if str(WEBAPP_ROOT) not in sys.path:
    sys.path.insert(0, str(WEBAPP_ROOT))


# ---------------------------------------------------------------------
# SERVICE IMPORTS
# ---------------------------------------------------------------------

from services.excel_parser import parse_excel
from services.ai_mapper import map_fields
from services.validator import validate_record_fields

from services.calculator import (
    compute_selected_fields,
    calculate_fields,
    record_field_source_keys,
    parse_class_identity,
    find_record_row,
    build_record_fields,
)


# ---------------------------------------------------------------------
# FASTAPI APPLICATION
# ---------------------------------------------------------------------

app = FastAPI(
    title="KVS Enrollment Copilot - Backend MVP"
)


# ---------------------------------------------------------------------
# CORS
#
# Allows the local KVS frontend / Chrome extension backend integration.
# ---------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# GLOBAL STATE
# ---------------------------------------------------------------------

LAST_PARSED_COLUMNS: List[str] = []
LAST_PARSED_ROWS: List[Dict[str, Any]] = []

LAST_SOURCE_FILE: Optional[str] = None
LAST_SOURCE_DATE: Optional[str] = None

LAST_RESULT: Dict[str, Any] = {}


# ---------------------------------------------------------------------
# APPROVED RECORD STORAGE
#
# Structure:
#
# SESSIONS = {
#     "default": {
#         "1-A": {...},
#         "1-B": {...},
#         "2-A": {...}
#     }
# }
# ---------------------------------------------------------------------

SESSIONS: Dict[
    str,
    Dict[str, Dict[str, Any]]
] = {}


# =====================================================================
# HELPER FUNCTIONS
# =====================================================================

def is_valid_class_row(
    row: Dict[str, Any]
) -> bool:
    """
    Ignore empty rows and summary rows such as:

    TOTAL
    G TOTAL
    GRAND TOTAL

    Keep actual class/section rows.
    """

    raw_value = str(
        row.get("class_raw")
        or row.get("class")
        or ""
    ).strip()

    if not raw_value:
        return False

    normalized = (
        raw_value
        .upper()
        .replace("_", " ")
        .strip()
    )

    summary_values = {
        "TOTAL",
        "G TOTAL",
        "GRAND TOTAL",
        "SUB TOTAL",
        "SUBTOTAL",
    }

    if normalized in summary_values:
        return False

    return True


def create_approved_record(
    row: Dict[str, Any],
    mapping: Dict[str, str],
    unresolved: Optional[List[str]] = None,
) -> Tuple[Optional[Dict[str, Any]], List[str], List[str]]:
    """
    Convert one parsed Excel row into one approved JSON record.

    Returns:

    record
    needs_review
    warnings
    """

    if unresolved is None:
        unresolved = []

    if not is_valid_class_row(row):
        return None, [], []

    try:

        # -------------------------------------------------------------
        # PARSE CLASS IDENTITY
        # -------------------------------------------------------------

        identity = parse_class_identity(
            row.get("class", ""),
            row.get("class_raw")
        )

        record_id = str(
            identity.get("id", "")
        ).strip()

        if not record_id:
            return None, [], []

        # -------------------------------------------------------------
        # BUILD FINAL RECORD FIELDS
        # -------------------------------------------------------------

        fields, needs_review = build_record_fields(
            row,
            mapping,
            last_updated=LAST_SOURCE_DATE
        )

        # -------------------------------------------------------------
        # VALIDATE RECORD
        # -------------------------------------------------------------

        warnings = validate_record_fields(
            fields
        )

        # -------------------------------------------------------------
        # BUILD APPROVED RECORD
        # -------------------------------------------------------------

        record = {
            "id": record_id,
            "displayName": record_id,
            "sourceClass": identity.get(
                "sourceClass",
                ""
            ),
            "section": identity.get(
                "section",
                ""
            ),
            "finalDisplayGroup": identity.get(
                "finalDisplayGroup",
                ""
            ),
            "approved": False,
            "fields": fields
        }

        combined_review = sorted(
            set(
                needs_review
                + unresolved
            )
        )

        return (
            record,
            combined_review,
            warnings
        )

    except Exception:
        # Skip malformed or non-class rows instead of failing
        # the entire Excel upload.
        return None, [], []


def prepare_all_records(
    session_id: str = "default"
) -> Dict[str, Any]:
    """
    Process every valid class/section row in the uploaded Excel
    and store the resulting records in the selected session.
    """

    if not LAST_PARSED_ROWS:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    if not LAST_PARSED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    # -------------------------------------------------------------
    # GET REQUIRED SOURCE KEYS
    # -------------------------------------------------------------

    source_keys = record_field_source_keys()

    # -------------------------------------------------------------
    # MAP EXCEL COLUMNS ONCE
    # -------------------------------------------------------------

    mapping, unresolved = map_fields(
        LAST_PARSED_COLUMNS,
        source_keys
    )

    # -------------------------------------------------------------
    # RESET THIS SESSION
    #
    # A new upload should replace old records rather than mixing
    # records from different Excel files.
    # -------------------------------------------------------------

    SESSIONS[session_id] = {}

    prepared_records = []
    review_items = {}
    warning_items = {}

    # -------------------------------------------------------------
    # PROCESS EVERY VALID ROW
    # -------------------------------------------------------------

    for row in LAST_PARSED_ROWS:

        record, needs_review, warnings = (
            create_approved_record(
                row=row,
                mapping=mapping,
                unresolved=unresolved
            )
        )

        if record is None:
            continue

        record_id = record["id"]

        # Avoid duplicate IDs.
        # If the Excel contains the same class/section twice,
        # the latest valid row replaces the earlier one.

        SESSIONS[
            session_id
        ][record_id] = record

        prepared_records.append(
            record
        )

        if needs_review:
            review_items[
                record_id
            ] = needs_review

        if warnings:
            warning_items[
                record_id
            ] = warnings

    # -------------------------------------------------------------
    # SORT RECORDS FOR CONSISTENT API OUTPUT
    # -------------------------------------------------------------

    prepared_records.sort(
        key=lambda record: record["id"]
    )

    return {
        "sessionId": session_id,
        "status": "success",
        "section": "class_social_category",
        "approved": False,
        "recordCount": len(
            prepared_records
        ),
        "records": prepared_records,
        "unresolved_fields": unresolved,
        "needs_review": review_items,
        "warnings": warning_items
    }


# =====================================================================
# UPLOAD
# =====================================================================

@app.post("/upload")
async def upload(
    file: UploadFile = File(...)
):
    """
    Upload and parse an Excel/CSV file.

    After parsing, automatically prepare records for every valid
    class/section and store them in SESSIONS["default"].

    The Chrome extension can then fetch:

        GET /api/approved/default
    """

    global LAST_PARSED_COLUMNS
    global LAST_PARSED_ROWS
    global LAST_SOURCE_FILE
    global LAST_SOURCE_DATE

    content = await file.read()

    parsed = parse_excel(
        content,
        file.filename
    )

    LAST_PARSED_COLUMNS = parsed["columns"]
    LAST_PARSED_ROWS = parsed["rows"]

    LAST_SOURCE_FILE = parsed.get(
        "source_file"
    )

    LAST_SOURCE_DATE = parsed.get(
        "source_date"
    )

    # -------------------------------------------------------------
    # RESET SESSION — new upload = fresh state
    # -------------------------------------------------------------

    SESSIONS["default"] = {}

    # -------------------------------------------------------------
    # AUTOMATICALLY PREPARE ALL CLASS RECORDS
    # -------------------------------------------------------------

    prepared = prepare_all_records(
        session_id="default"
    )

    # -------------------------------------------------------------
    # RETURN UPLOAD + PREPARATION RESULT
    # -------------------------------------------------------------

    return {
        "status": "success",
        "upload": parsed,
        "prepared": prepared
    }


# =====================================================================
# AVAILABLE FIELDS
# =====================================================================

@app.get("/fields")
def get_fields():
    """
    Return the column names detected in the uploaded file.
    """

    if not LAST_PARSED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded yet"
        )

    return {
        "available_columns":
            LAST_PARSED_COLUMNS
    }


# =====================================================================
# PREPARE ALL RECORDS
#
# Optional endpoint if the frontend wants to explicitly rebuild
# all records without uploading the Excel again.
# =====================================================================

@app.post("/prepare/{session_id}")
def prepare_records(
    session_id: str
):
    """
    Process all valid class/section rows from the currently uploaded
    Excel and rebuild the approved records for this session.
    """

    return prepare_all_records(
        session_id=session_id
    )


# =====================================================================
# COMPUTE
# =====================================================================

@app.post("/compute")
def compute(data: dict):
    """
    Supports two modes.

    ------------------------------------------------------------------
    LEGACY MODE
    ------------------------------------------------------------------

    Request:

    {
        "fields": [
            "cat_i_boys",
            "cat_ii_total"
        ],
        "class": "1"
    }

    ------------------------------------------------------------------
    NEW INDIVIDUAL RECORD MODE
    ------------------------------------------------------------------

    Request:

    {
        "class": "1",
        "section": "A"
    }

    OR:

    {
        "class": "XI-Science"
    }

    OR:

    {
        "id": "1-A"
    }

    Optional:

    {
        "session_id": "default"
    }

    This endpoint remains for compatibility with the existing
    web application. A normal Excel upload now automatically
    prepares all records.
    """

    global LAST_RESULT

    # -----------------------------------------------------------------
    # MAKE SURE DATA WAS UPLOADED
    # -----------------------------------------------------------------

    if not LAST_PARSED_ROWS:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    if not LAST_PARSED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded"
        )

    # -----------------------------------------------------------------
    # DETERMINE REQUEST TYPE
    # -----------------------------------------------------------------

    is_new_style = (
        "id" in data
        or "section" in data
    )

    # =================================================================
    # LEGACY COMPUTE FLOW
    # =================================================================

    if not is_new_style:

        fields = data.get(
            "fields",
            []
        )

        selected_class = data.get(
            "class"
        )

        if not selected_class:
            raise HTTPException(
                status_code=400,
                detail="class required"
            )

        # -------------------------------------------------------------
        # MAP REQUESTED FIELDS TO EXCEL COLUMNS
        # -------------------------------------------------------------

        mapping, unresolved = map_fields(
            LAST_PARSED_COLUMNS,
            fields
        )

        # -------------------------------------------------------------
        # MAPPING NEEDS USER CLARIFICATION
        # -------------------------------------------------------------

        if unresolved:

            return {
                "status":
                    "needs_clarification",

                "unresolved_fields":
                    unresolved,

                "available_columns":
                    LAST_PARSED_COLUMNS
            }

        # -------------------------------------------------------------
        # CALCULATE LEGACY RESULT
        # -------------------------------------------------------------

        result = compute_selected_fields(
            LAST_PARSED_ROWS,
            fields,
            mapping,
            selected_class
        )

        LAST_RESULT = result

        return {
            "status":
                "success",

            "data":
                result
        }

    # =================================================================
    # NEW INDIVIDUAL RECORD FLOW
    # =================================================================

    session_id = (
        data.get("session_id")
        or "default"
    )

    record_id = data.get(
        "id"
    )

    class_ = data.get(
        "class"
    )

    section = data.get(
        "section"
    )

    # -----------------------------------------------------------------
    # VALIDATE IDENTIFIER
    # -----------------------------------------------------------------

    if not record_id and not class_:

        raise HTTPException(
            status_code=400,
            detail="id or class required"
        )

    # -----------------------------------------------------------------
    # FIND THE CORRESPONDING EXCEL ROW
    # -----------------------------------------------------------------

    row = find_record_row(
        LAST_PARSED_ROWS,
        class_ or "",
        section,
        record_id
    )

    if row is None:

        raise HTTPException(
            status_code=404,
            detail="class/section not found in uploaded data"
        )

    # -----------------------------------------------------------------
    # MAP EXCEL COLUMNS
    # -----------------------------------------------------------------

    source_keys = record_field_source_keys()

    mapping, unresolved = map_fields(
        LAST_PARSED_COLUMNS,
        source_keys
    )

    # -----------------------------------------------------------------
    # BUILD THE RECORD
    # -----------------------------------------------------------------

    record, needs_review, warnings = (
        create_approved_record(
            row=row,
            mapping=mapping,
            unresolved=unresolved
        )
    )

    if record is None:

        raise HTTPException(
            status_code=400,
            detail="Unable to create record from this row"
        )

    # -----------------------------------------------------------------
    # SAVE / UPDATE RECORD
    # -----------------------------------------------------------------

    SESSIONS.setdefault(
        session_id,
        {}
    )[
        record["id"]
    ] = record

    # -----------------------------------------------------------------
    # RETURN RECORD
    # -----------------------------------------------------------------

    return {
        "status":
            "success",

        "record":
            record,

        "needs_review":
            needs_review,

        "warnings":
            warnings
    }


# =====================================================================
# APPROVED DATA ENDPOINT
# =====================================================================

@app.get(
    "/api/approved/{session_id}"
)
async def get_approved(
    session_id: str
):
    """
    Return all approved records for a session.

    The Chrome extension uses:

        GET /api/approved/default
    """

    # -----------------------------------------------------------------
    # NO RECORDS YET
    # -----------------------------------------------------------------

    if session_id not in SESSIONS:

        return {
            "sessionId": session_id,
            "section": "class_social_category",
            "approved": False,
            "recordCount": 0,
            "records": []
        }

    # -----------------------------------------------------------------
    # RETURN ONLY APPROVED RECORDS
    # -----------------------------------------------------------------

    all_records = list(
        SESSIONS[
            session_id
        ].values()
    )

    records = [
        r for r in all_records
        if r.get("approved") is True
    ]

    records.sort(
        key=lambda record: record["id"]
    )

    return {
        "sessionId": session_id,
        "section": "class_social_category",
        "approved": True,
        "recordCount": len(records),
        "records": records
    }


# =====================================================================
# ALL RECORDS ENDPOINT (for dashboard)
# =====================================================================

@app.get(
    "/api/records/{session_id}"
)
async def get_all_records(
    session_id: str
):
    """
    Return ALL records for a session (approved and unapproved).
    Used by the teacher dashboard to show the full class list.
    """

    if session_id not in SESSIONS:
        return {
            "sessionId": session_id,
            "section": "class_social_category",
            "approved": False,
            "recordCount": 0,
            "records": []
        }

    # -----------------------------------------------------------------
    # RETURN ALL RECORDS
    # -----------------------------------------------------------------

    records = list(
        SESSIONS[
            session_id
        ].values()
    )

    records.sort(
        key=lambda record: record["id"]
    )

    return {
        "sessionId": session_id,
        "recordCount": len(records),
        "records": records
    }


# =====================================================================
# APPROVE A SINGLE RECORD
# =====================================================================

@app.post(
    "/approve/{session_id}/{record_id}"
)
async def approve_record(
    session_id: str,
    record_id: str
):
    """
    Mark a single record as approved in the given session.

    POST /approve/default/1-A
    """

    if session_id not in SESSIONS:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{session_id}' not found"
        )

    session = SESSIONS[session_id]

    if record_id not in session:
        raise HTTPException(
            status_code=404,
            detail=f"Record '{record_id}' not found in session '{session_id}'"
        )

    session[record_id]["approved"] = True

    return {
        "status": "success",
        "recordId": record_id,
        "approved": True
    }


# =====================================================================
# ROOT / HEALTH CHECK
# =====================================================================

@app.get("/")
async def root():

    return {
        "status": "ok",
        "service": "KVS Enrollment Copilot backend MVP",
        "api": "/api/approved/default"
    }


# =====================================================================
# RESOLVE
# =====================================================================

@app.post("/resolve")
def resolve(
    payload: dict
):
    """
    Legacy manual-mapping override path.

    This is kept so the existing web application
    does not lose the old functionality.
    """

    fields = payload.get(
        "fields",
        []
    )

    selected_class = payload.get(
        "class"
    )

    user_mapping = payload.get(
        "user_mapping",
        {}
    )

    # -----------------------------------------------------------------
    # VALIDATE CLASS
    # -----------------------------------------------------------------

    if not selected_class:

        raise HTTPException(
            status_code=400,
            detail="class required"
        )

    # -----------------------------------------------------------------
    # BUILD MAPPING
    # -----------------------------------------------------------------

    mapping = {}

    for field in fields:

        key = field.lower()

        if key in user_mapping:

            mapping[key] = (
                user_mapping[key]
            )

    # -----------------------------------------------------------------
    # COMPUTE RESULT
    # -----------------------------------------------------------------

    result = compute_selected_fields(
        LAST_PARSED_ROWS,
        fields,
        mapping,
        selected_class
    )

    return {
        "status":
            "success",

        "data":
            result
    }