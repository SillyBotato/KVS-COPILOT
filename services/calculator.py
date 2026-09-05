"""
calculator.py

Responsibility: ONLY computation (counts/sums) and record identity.
Does NOT import ai_mapper - callers (main.py) resolve the mapping and
pass it in, keeping parse / map / compute as separate concerns.
"""

import re
from typing import Dict, Any, List, Optional, Tuple


# =====================================================================
# LEGACY: arbitrary-field aggregate query across a grade (e.g. "class": "1"
# sums 1-A + 1-B). Kept unchanged for backward compatibility with the
# original /compute contract and /resolve.
# =====================================================================

def calculate_fields(parsed_excel: Dict[str, Any], mapping: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stub calculation. Kept for backward compatibility - superseded by
    build_record_fields() for the new per-record pipeline.
    """
    return {
        "boys": 23,
        "sc": 2,
        "st": 0,
        "obc": 11,
        "general": 10,
    }


def _class_matches(cls: str, selected_class: str) -> bool:
    """
    Exact class-number match. "1" matches "1" and "1-a"/"1-b" (real
    section labels use a hyphen), but NOT "10-a"/"11-a"/"12-a", and
    NOT "1 to 5" style aggregate range labels.
    """
    cls = cls.strip().lower()
    selected_class = selected_class.strip().lower()

    if cls == selected_class:
        return True

    return bool(re.match(rf"^{re.escape(selected_class)}-", cls))


def compute_selected_fields(rows, selected_fields, mapping, selected_class):
    result = {}
    selected_class = str(selected_class).strip().lower()

    matched_rows = []
    for r in rows:
        cls = str(r.get("class", "")).strip().lower()
        if _class_matches(cls, selected_class):
            matched_rows.append(r)

    print("MATCHED CLASSES:", [r.get("class") for r in matched_rows])

    if not matched_rows:
        return {"error": "class_not_found"}

    for field in selected_fields:
        key = field.lower()

        if key not in mapping:
            result[key] = "unsupported_field"
            continue

        column = mapping[key]["column"]

        per_row_values = [(r.get("class"), r.get(column, 0)) for r in matched_rows]
        print(f"FIELD '{key}' -> COLUMN '{column}' -> VALUES {per_row_values}")

        total = 0
        for r in matched_rows:
            total += int(r.get(column, 0))

        result[key] = total

    return result


# =====================================================================
# NEW: per-record (single class/section) pipeline, no aggregation.
# =====================================================================

# Internal lookup keys we ask ai_mapper.map_fields() to resolve. These
# are chosen specifically so the EXISTING boys/girls/total suffix-swap
# rules in ai_mapper resolve them directly against the enrollment
# sheet's real "_b"/"_g"/"_t" column naming (e.g. "sc_total" -> "sc_t"),
# without needing any new aliases. Verified against the real KVS
# enrollment sheet's column names.
_DIRECT_FIELD_SOURCE_KEYS: Dict[str, str] = {
    "totalEnrolledStudents": "total",   # -> "t"
    "boys": "boys",                     # -> "b"
    "girls": "girls",                   # -> "g"
    "scheduledCaste": "sc_total",       # -> "sc_t"
    "scheduledTribes": "st_total",      # -> "st_t"
    "ph": "ph_total",                   # -> "ph_t"
    "general": "gen_total",             # -> "gen_t"
}

# Fixed authorised capacity per section/record. Not present in the source
# Excel - this is a portal-wide constant, not a derived/computed value.
# Matches every record in mock-data.json (all use 40).
AUTHORISED_CAPACITY_PER_SECTION = 40

# Composite fields: sum of several mapped columns. Matches the
# derivation notes in mock-data.json exactly (verified against real
# 1-A / 1-B values from the enrollment sheet).
_DERIVED_FIELD_COMPONENT_KEYS: Dict[str, List[str]] = {
    "otherBackwardClasses": ["obc_nc_total", "obc_creamy_total"],
    "generalMinorities": ["muslim_total", "other_minor_total", "sikh_total"],
}


def record_field_source_keys() -> List[str]:
    """
    Every internal lookup key needed to build one full record. Callers
    (main.py) pass this list into ai_mapper.map_fields() alongside the
    parsed columns, then pass the resulting mapping into
    build_record_fields().
    """
    keys = list(_DIRECT_FIELD_SOURCE_KEYS.values())
    for components in _DERIVED_FIELD_COMPONENT_KEYS.values():
        keys.extend(components)
    return keys


# Grade 11/12 use Roman numerals with a named stream in the KVS
# enrollment sheet ("11-Sci", "12-COMM.", "12- Arts" - note the
# inconsistent spacing/abbreviation/punctuation in the real source).
_GRADE_ROMAN = {"11": "XI", "12": "XII"}
_STREAM_ALIASES = {
    "art": "Arts",
    "arts": "Arts",
    "sci": "Science",
    "sc": "Science",
    "science": "Science",
    "comm": "Commerce",
    "com": "Commerce",
    "commerce": "Commerce",
}
_GRADE_SECTION_RE = re.compile(r"^(\d+)\s*-\s*([a-zA-Z])$")
_GRADE_STREAM_RE = re.compile(r"^(11|12)\s*-\s*([A-Za-z.]+?)\.?$")


def parse_class_identity(class_lower: str, class_raw: Optional[str] = None) -> Dict[str, Optional[str]]:
    """
    Split a source class value into its identity pieces:
      id, sourceClass, section, finalDisplayGroup

    Uses class_raw (the ORIGINAL casing/text from the sheet) whenever
    available, since KVS sheets are inconsistent about casing/spacing
    and we don't want to guess. Three cases, checked in order:

    1) Grade 1-10 with a section letter: "1-A" -> id "1-A",
       sourceClass "1", section "A", finalDisplayGroup "1".
    2) Grade 11/12 with a stream: "11-Sci" -> id "XI-Science",
       sourceClass "XI-Science", section None,
       finalDisplayGroup "XI-Science" (streams are never aggregated
       together, per spec - each stays its own group).
    3) Anything else (e.g. "Balvatika-III"): used as-is.
    """
    raw = (class_raw if class_raw is not None else class_lower).strip()

    m = _GRADE_SECTION_RE.match(raw)
    if m:
        num, sec = m.groups()
        sec = sec.upper()
        rid = f"{num}-{sec}"
        return {"id": rid, "sourceClass": num, "section": sec, "finalDisplayGroup": num}

    m2 = _GRADE_STREAM_RE.match(raw)
    if m2:
        grade, stream_raw = m2.groups()
        stream_key = stream_raw.strip().lower().replace(".", "").strip()
        stream_name = _STREAM_ALIASES.get(stream_key, stream_raw.strip().replace(".", "").title())
        roman = _GRADE_ROMAN[grade]
        rid = f"{roman}-{stream_name}"
        return {"id": rid, "sourceClass": rid, "section": None, "finalDisplayGroup": rid}

    return {"id": raw, "sourceClass": raw, "section": None, "finalDisplayGroup": raw}


def find_record_row(
    rows: List[Dict[str, Any]],
    class_: str,
    section: Optional[str] = None,
    record_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Exact-match lookup for ONE individual class/section row - no
    aggregation, no prefix matching. This is deliberately exact so it
    can never sweep in sibling sections or aggregate ranges the way
    the legacy prefix-based matcher could.

    A caller may reasonably ask for either the RAW source label
    ("11-Sci") or the CANONICAL display id ("XI-Science") - a frontend
    has no reason to know the sheet's internal abbreviations. This
    matches against both: the lowercased raw "class" field written by
    excel_parser, and each row's derived canonical id.
    """
    if record_id:
        target = record_id.strip().lower()
    elif section:
        target = f"{class_.strip().lower()}-{section.strip().lower()}"
    else:
        target = class_.strip().lower()

    for r in rows:
        raw_class = str(r.get("class", "")).strip().lower()
        if raw_class == target:
            return r

        identity = parse_class_identity(raw_class, r.get("class_raw"))
        if identity["id"].strip().lower() == target:
            return r

    return None


def build_record_fields(
    row: Dict[str, Any],
    mapping: Dict[str, Dict[str, Any]],
    last_updated: Optional[str] = None,
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Build the full canonical fields dict (matching mock-data.json) for
    ONE already-located row, using the resolved column mapping.

    Returns (fields_dict, needs_review) - needs_review lists any
    internal source key that was unresolved or flagged ambiguous by
    ai_mapper, so the caller can surface it for teacher review instead
    of silently treating a guess as ground truth.
    """
    needs_review: List[str] = []

    def _value_for(source_key: str) -> int:
        entry = mapping.get(source_key)
        if not entry or not entry.get("column"):
            needs_review.append(source_key)
            return 0
        if entry.get("ambiguous"):
            needs_review.append(source_key)
        return int(row.get(entry["column"], 0) or 0)

    fields: Dict[str, Any] = {
        "numberOfSections": 1,  # each source row IS one section/record
        # Fixed portal capacity per section, not read from the source Excel
        # (the sheet has no authorised-capacity column). Confirmed against
        # mock-data.json, where every record uses 40 - hardcode it here
        # rather than leaving it null.
        "authorisedCapacity": AUTHORISED_CAPACITY_PER_SECTION,
        "lastUpdated": last_updated,
    }

    for target_field, source_key in _DIRECT_FIELD_SOURCE_KEYS.items():
        fields[target_field] = _value_for(source_key)

    for target_field, component_keys in _DERIVED_FIELD_COMPONENT_KEYS.items():
        fields[target_field] = sum(_value_for(k) for k in component_keys)

    return fields, needs_review
