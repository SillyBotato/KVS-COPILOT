import io
import re
from typing import Dict, Any, List, Optional
import pandas as pd


# ---------------------------
# Helpers
# ---------------------------

def _clean_text(val):
    return str(val).strip().replace("\n", " ").replace("  ", " ")


def _ffill_header_levels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Excel merges header cells - e.g. "CAT-I" is one merged cell that
    visually spans its B / G / T trio of columns. When pandas reads a
    merged header with header=[0,1,2], it only keeps the label in the
    LEFT-MOST column of that merge; the other columns under the same
    merge come back as NaN -> "Unnamed: N_level_L".

    This forward-fills each header level across the columns it spans,
    so every column under "CAT-I" (not just the first) keeps "CAT-I".
    """
    if not isinstance(df.columns, pd.MultiIndex):
        return df

    levels = list(zip(*df.columns.tolist()))
    filled_levels = []

    for level_vals in levels:
        s = pd.Series(level_vals, dtype=object)
        is_blank = s.isna() | s.astype(str).str.match(r"^unnamed", case=False)
        s = s.mask(is_blank, None)
        s = s.ffill()
        filled_levels.append(s.tolist())

    df.columns = pd.MultiIndex.from_tuples(list(zip(*filled_levels)))
    return df


def _flatten_multi_header(df: pd.DataFrame) -> List[str]:
    cleaned = []

    for col in df.columns:
        if isinstance(col, tuple):
            parts = [str(c).strip().lower() for c in col if pd.notna(c)]
        else:
            parts = [str(col).strip().lower()]

        name = "_".join(parts)

        # remove junk
        name = re.sub(r"student enrollment.*?\d{4}", "", name)
        name = re.sub(r"level_\d+", "", name)
        name = re.sub(r"unnamed:?\s*\d*", "", name)
        name = re.sub(r"\.\d+", "", name)

        # normalize
        name = name.replace("-", "_")
        name = "_".join(name.split())

        while "__" in name:
            name = name.replace("__", "_")

        name = name.strip("_")

        cleaned.append(name)

    return cleaned


def _dedupe_columns(cols: List[str]) -> List[str]:
    """
    Make column names unique. Safety net only - with headers properly
    forward-filled, real collisions should be rare.
    """
    seen: Dict[str, int] = {}
    result = []
    for c in cols:
        c = c if c else "col"
        if c in seen:
            seen[c] += 1
            result.append(f"{c}_{seen[c]}")
        else:
            seen[c] = 0
            result.append(c)
    return result


def _is_total_row(val: str) -> bool:
    return "total" in str(val).lower()


def _cut_off_trailing_summary_block(df: pd.DataFrame) -> pd.DataFrame:
    """
    KVS enrollment-style sheets end with a duplicate SUMMARY block
    after the real per-class data, shaped like:

        ... 12-COMM. -> TOTAL -> G TOTAL
        -> Balvatika III -> 1 to 5 -> 6 to 8 -> 9 to 10 -> 11 to 12 -> G. TOTAL

    These rows ("1 to 5", "6 to 8", ...) are pre-aggregated ranges, not
    individual classes. Since the grand total ("G TOTAL" / "G. TOTAL")
    always marks the true end of per-class detail data (when present),
    we cut the dataframe there - everything from that row onward
    (inclusive) is dropped. Sheets without this marker are untouched.
    """
    df = df.reset_index(drop=True)
    grand_total_mask = df["class"].str.match(r"^g\.?\s*total$", na=False)

    if grand_total_mask.any():
        cutoff_idx = df.index[grand_total_mask][0]
        df = df.iloc[:cutoff_idx]

    return df


def _looks_like_leaked_data(columns: List[str]) -> bool:
    """
    Different KVS exports have different header shapes:
      - the enrollment sheet has 3 stacked header rows
        (title -> CAT-I/CAT-II/... -> B/G/T)
      - the class-summary portal table has just 1 header row

    We can't hardcode header=[0,1,2] for every .xlsx file - on a
    single-header sheet that would silently swallow the first 2 real
    DATA rows into the header, corrupting column names (e.g.
    "boys_30_17") and losing those rows entirely, with no error.

    This checks the flattened column names for signs that real data
    values (raw numbers, dates) leaked into them, which only happens
    when we over-read the header depth. If enough columns look
    contaminated, the caller should retry with a single header row.
    """
    numeric_token_re = re.compile(r"(?:^|_)\d+(?:_|$)")
    date_re = re.compile(r"\d{1,2}/\d{1,2}/\d{2,4}")

    hits = 0
    for c in columns:
        if numeric_token_re.search(c) or date_re.search(c):
            hits += 1

    return hits >= max(2, len(columns) // 4)


def _read_excel_with_header_detection(file_bytes: bytes) -> pd.DataFrame:
    """
    Try the multi-row (3-level) header first, since that's the more
    complex/specific shape. Fall back to a single header row if the
    result shows signs of having eaten real data rows.
    """
    df = pd.read_excel(io.BytesIO(file_bytes), header=[0, 1, 2])
    df = _ffill_header_levels(df)
    trial_columns = _flatten_multi_header(df)

    if not _looks_like_leaked_data(trial_columns):
        df.columns = trial_columns
        return df

    # fall back: single header row
    df = pd.read_excel(io.BytesIO(file_bytes), header=0)
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def extract_source_date(filename: str) -> Optional[str]:
    """
    Best-effort extraction of a DD/MM/YYYY date from the filename
    (e.g. "30_06_2026_ENROLLMENT.xlsx" -> "30/06/2026"), used as the
    "lastUpdated" value for every record parsed from this file since
    the sheet itself doesn't carry a per-row date column.
    """
    m = re.search(r"(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{4})", filename)
    if not m:
        return None
    dd, mm, yyyy = m.groups()
    try:
        return f"{int(dd):02d}/{int(mm):02d}/{yyyy}"
    except ValueError:
        return None


# ---------------------------
# Main Parser
# ---------------------------

def parse_excel(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Handles KVS-style sheets - both the multi-header enrollment export
    and single-header-row portal exports.

    Output:
    {
      "columns": [...],
      "rows": [...],
      "source_file": "...",
      "source_date": "DD/MM/YYYY" or None
    }
    """

    lower_name = filename.lower()

    try:
        if lower_name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
            df.columns = [str(c).strip().lower() for c in df.columns]
            df = df.loc[:, df.columns != ""]

        else:
            df = _read_excel_with_header_detection(file_bytes)
    except Exception as e:
        raise ValueError(f"Failed to read file: {e}")

    # ---------------------------
    # Dedupe (safety net; also needed for the flat-header CSV path)
    # ---------------------------
    df.columns = _dedupe_columns(list(df.columns))

    # drop columns that ended up with no real name at all
    df = df.loc[:, [c for c in df.columns if c and c != "col"]]

    # safety net: in case any dupes still slipped through
    df = df.loc[:, ~pd.Index(df.columns).duplicated()]

    # ---------------------------
    # Normalize "class" column
    # ---------------------------
    class_col = None
    for c in df.columns:
        if "class" in c.lower() and "teacher" not in c.lower():
            class_col = c
            break

    if not class_col:
        # fallback: assume first column is class
        class_col = df.columns[0]

    df = df.rename(columns={class_col: "class"})

    # 🔥 NEW: preserve the ORIGINAL casing/text of the class label
    # before lowercasing "class" for matching. "class" stays lowercase
    # (used everywhere for exact/prefix matching); "class_raw" carries
    # the true source text (e.g. "1-A", "XI-Science", "Balvatika-III")
    # so identity/display logic downstream doesn't have to guess casing.
    df["class"] = df["class"].astype(str).str.strip()
    df["class_raw"] = df["class"]
    df["class"] = df["class"].str.lower()

    df = df[~df["class"].str.contains("class", na=False)]

    # ---------------------------
    # Cut off the trailing "1 to 5" / "6 to 8" / "G. TOTAL" summary
    # block, if this sheet has one
    # ---------------------------
    df = _cut_off_trailing_summary_block(df)

    # ---------------------------
    # Drop per-section TOTAL rows (e.g. the "TOTAL" between 1-B and 2-A)
    # ---------------------------
    df = df[~df["class"].apply(_is_total_row)]

    # ---------------------------
    # cleaning values
    # ---------------------------
    df = df.fillna(0)

    # convert numeric safely (skip both class columns - class_raw is text)
    for col in df.columns:
        if col in ("class", "class_raw"):
            continue
        df[col] = pd.to_numeric(df.loc[:, col], errors="coerce").fillna(0).astype(int)

    # ---------------------------
    # Final output
    # ---------------------------
    rows = df.to_dict(orient="records")

    return {
        "columns": list(df.columns),
        "rows": rows,
        "source_file": filename,
        "source_date": extract_source_date(filename),
    }
