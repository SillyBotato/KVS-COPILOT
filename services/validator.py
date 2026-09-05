"""
validator.py

Responsibility: ONLY validation (consistency checks). Never silently
modifies a value - only reports warnings/errors for the teacher to
review, per the approval-flow requirement.
"""

from typing import Dict, Any, List


def validate_record_fields(fields: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Returns a list of {"field": ..., "message": ..., "severity": ...}
    dicts. severity is "error" (should block approval) or "warning"
    (should be shown but doesn't have to block approval) - the caller
    decides what to do with each.
    """
    warnings: List[Dict[str, str]] = []

    boys = fields.get("boys", 0)
    girls = fields.get("girls", 0)
    total = fields.get("totalEnrolledStudents", 0)

    if boys + girls != total:
        warnings.append({
            "field": "totalEnrolledStudents",
            "message": (
                f"boys ({boys}) + girls ({girls}) = {boys + girls}, "
                f"which does not match totalEnrolledStudents ({total})."
            ),
            "severity": "error",
        })

    category_sum = (
        fields.get("scheduledCaste", 0)
        + fields.get("scheduledTribes", 0)
        + fields.get("otherBackwardClasses", 0)
        + fields.get("general", 0)
        + fields.get("generalMinorities", 0)
    )
    if category_sum != total:
        warnings.append({
            "field": (
                "scheduledCaste+scheduledTribes+otherBackwardClasses"
                "+general+generalMinorities"
            ),
            "message": (
                f"Social-category fields sum to {category_sum}, which does "
                f"not match totalEnrolledStudents ({total}). This can "
                f"happen with source-data rounding/overlaps - please "
                f"review rather than auto-correcting."
            ),
            "severity": "warning",
        })

    return warnings
