"""
Pydantic models used across the /webapp backend.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class ParsedExcel(BaseModel):
    """Structured JSON output of the excel_parser service."""
    columns: List[str]
    rows: List[Dict[str, Any]]


# ---------------------------------------------------------------------
# LEGACY (kept for backward compatibility with the original API
# contract / calculator.calculate_fields stub). Not used by the new
# multi-record endpoints below.
# ---------------------------------------------------------------------

class ApprovedFields(BaseModel):
    boys: int
    sc: int
    st: int
    obc: int
    general: int


class ApprovedResponse(BaseModel):
    """Legacy response shape for the original GET /api/approved/{sessionId}.

    Superseded by ApprovedRecordsResponse for the multi-record pipeline
    - kept here only so old code/tests referencing it still import.
    """
    sessionId: str
    class_: str = Field(alias="class")  # "class" is a reserved word in Python
    section: str
    approved: bool
    fields: ApprovedFields

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------
# NEW: multi-record schema, matches mock-data.json exactly.
# ---------------------------------------------------------------------

class RecordFields(BaseModel):
    numberOfSections: int
    authorisedCapacity: Optional[int] = None
    totalEnrolledStudents: int
    boys: int
    girls: int
    scheduledCaste: int
    scheduledTribes: int
    otherBackwardClasses: int
    ph: int
    general: int
    generalMinorities: int
    lastUpdated: Optional[str] = None


class ApprovedRecord(BaseModel):
    id: str
    displayName: str
    sourceClass: str
    section: Optional[str] = None
    finalDisplayGroup: str
    approved: bool = True
    fields: RecordFields


class ApprovedRecordsResponse(BaseModel):
    """Response shape for GET /api/approved/{session_id} (new contract)."""
    sessionId: str
    records: List[ApprovedRecord]


class MappingEntry(BaseModel):
    column: Optional[str] = None
    confidence: float = 0.0
    ambiguous: bool = True


class ValidationWarning(BaseModel):
    field: str
    message: str
    severity: str = "warning"  # "warning" | "error"


class ComputeRecordResponse(BaseModel):
    status: str
    record: Optional[ApprovedRecord] = None
    needs_review: List[str] = []
    warnings: List[ValidationWarning] = []
