import difflib
import json
import os
import re
from typing import Dict, List, Tuple
from openai import OpenAI

_client = None


def _get_client() -> OpenAI | None:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            _client = OpenAI(api_key=api_key)
    return _client


# ---------------------------
# Rule-based normalization
# ---------------------------

_SUFFIX_MAP = {
    "boys": "b",
    "boy": "b",
    "girls": "g",
    "girl": "g",
    "total": "t",
}

# Known KVS portal column-name aliases.
#
# Some KVS portal exports (e.g. the class-summary table, as opposed to
# the multi-header enrollment sheet) use full descriptive column names
# instead of abbreviations - "scheduled caste" instead of "sc",
# "Scheduled Tribes" instead of "st", etc. These names are reportedly
# standardized across all KVS portals, so we hardcode them as exact
# aliases rather than relying on the AI fallback to guess correctly
# every time.
_FIELD_ALIASES: Dict[str, List[str]] = {
    "boys": ["boys", "boy"],
    "girls": ["girls", "girl"],
    "sc": ["sc", "scheduled caste", "scheduled castes"],
    "st": ["st", "scheduled tribe", "scheduled tribes"],
    "obc": ["obc", "other backward class", "other backward classes"],
    "ph": ["ph", "disabled", "physically handicapped", "divyang"],
    "general": ["general", "gen"],
    "muslim": [
        "muslim",
        "muslims",
        "general minorities",
        "general minorities [includes muslims]",
        "minorities",
    ],
    "total": ["total", "total enrolled students", "total enrolled"],
}

# Confidence threshold below which an AI-resolved match is flagged for
# teacher review rather than trusted outright.
_AMBIGUOUS_CONFIDENCE_THRESHOLD = 0.75


def _normalize_field(field: str) -> List[str]:
    """
    Given a field like 'cat_i_boys', return a list of candidate
    normalized forms to try against the dataset columns, e.g.
    ['cat_i_b']. Returns multiple candidates because word order /
    separators can vary.
    """
    key = field.lower().strip()
    candidates = set()

    for word, abbr in _SUFFIX_MAP.items():
        pattern = rf"(?<![a-z]){word}(?![a-z])"
        if re.search(pattern, key):
            swapped = re.sub(pattern, abbr, key)
            candidates.add(swapped)

    candidates.add(key)  # exact match fallback
    return list(candidates)


def _rule_based_match(field: str, columns_lower: Dict[str, str]) -> str | None:
    """
    Try to resolve a field to an exact column name using normalization
    rules only. columns_lower maps lowercased column name -> original
    column name. Returns the ORIGINAL column name, or None.
    """
    key = field.lower().strip()

    if key in _FIELD_ALIASES:
        for alias in _FIELD_ALIASES[key]:
            if alias in columns_lower:
                return columns_lower[alias]

    for candidate in _normalize_field(key):
        if candidate in columns_lower:
            return columns_lower[candidate]

    return None


def _similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, a, b).ratio()


# ---------------------------
# Prompt builder
# ---------------------------

def build_prompt(columns, fields):
    return f"""
Map user fields to dataset columns.

Columns:
{columns}

Fields:
{fields}

Return ONLY JSON:
{{
  "field_name": {{
    "column": "exact column name"
  }}
}}

Rules:
- Column MUST exist exactly as given
- Match based on meaning
- b = boys, g = girls, t = total
- Examples: "cat_i_boys" -> "cat_i_b", "cat_ii_total" -> "cat_ii_t"
- Skip a field entirely (omit it) if unsure
- No explanations, JSON only
"""


def extract_json(text: str) -> str:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    return match.group(0) if match else "{}"


# ---------------------------
# Main function
# ---------------------------

def map_fields(columns: List[str], selected_fields: List[str]) -> Tuple[Dict, List]:
    """
    Resolve each field to a real column, in two passes:

    1) Rule-based (fast, deterministic) - aliases + boys/girls/total
       suffix normalization. confidence=0.98, ambiguous=False.
    2) AI fallback (OpenAI, only for what pass 1 couldn't resolve).
       confidence is a heuristic based on string similarity between
       the field and the column the AI chose (NOT a calibrated
       probability) - low-similarity matches are flagged ambiguous
       so a human reviews them rather than silently trusting a guess.

    Each entry in the returned mapping looks like:
        {"column": "sc_t", "confidence": 0.98, "ambiguous": False}
    """
    valid: Dict[str, Dict[str, object]] = {}
    unresolved: List[str] = []

    columns_lower = {c.lower(): c for c in columns}

    # ---------------------------
    # 1) Rule-based pass
    # ---------------------------
    remaining_fields = []
    for field in selected_fields:
        key = field.lower()
        matched_col = _rule_based_match(key, columns_lower)
        if matched_col:
            valid[key] = {"column": matched_col, "confidence": 0.98, "ambiguous": False}
        else:
            remaining_fields.append(field)

    print("RULE-BASED MATCHES:", valid)

    if not remaining_fields:
        print("unresolved: []")
        return valid, []

    # ---------------------------
    # 2) AI fallback pass
    # ---------------------------
    print("AI START for:", remaining_fields)
    ai_client = _get_client()
    if ai_client is None:
        print("AI SKIPPED: OPENAI_API_KEY not set")
        unresolved.extend(remaining_fields)
        print("DONE:", valid)
        print("unresolved:", unresolved)
        return valid, unresolved

    try:
        response = ai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return ONLY JSON."},
                {"role": "user", "content": build_prompt(columns, remaining_fields)}
            ],
            temperature=0,
            max_tokens=300
        )
        content = (response.choices[0].message.content or "").strip()
        if not content:
            raise ValueError("Empty AI response")

        json_text = extract_json(content)
        ai_mapping = json.loads(json_text)
    except Exception as e:
        print("AI ERROR:", e)
        unresolved.extend(remaining_fields)
        print("DONE:", valid)
        print("unresolved:", unresolved)
        return valid, unresolved

    for field in remaining_fields:
        key = field.lower()
        entry = ai_mapping.get(key)
        if not entry:
            unresolved.append(field)
            continue

        col = entry.get("column")
        if col not in columns:
            unresolved.append(field)
            continue

        sim = _similarity(key, col.lower())
        confidence = round(0.5 + 0.5 * sim, 2)
        ambiguous = confidence < _AMBIGUOUS_CONFIDENCE_THRESHOLD

        valid[key] = {"column": col, "confidence": confidence, "ambiguous": ambiguous}

    print("DONE:", valid)
    print("unresolved:", unresolved)
    return valid, unresolved
