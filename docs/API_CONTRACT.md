# API Contract

> ⚠️ **This replaces the previous version of this file**, which said
> "do not change response structure." The requirements doc for the
> Chrome extension integration explicitly asks for a different shape
> for `/compute` and `/api/approved/{session_id}` (multi-record
> support, camelCase fields matching `mock-data.json`). That doc is
> newer and more detailed than the original contract, so this file has
> been updated to match it. Please review and confirm.

---

## POST /upload
→ returns parsed Excel/CSV: `{ columns, rows, source_file, source_date }`
**Unchanged** except two additive keys (`source_file`, `source_date`) alongside the original `columns`/`rows`.

## POST /compute

Two supported request shapes:

**Legacy** (unchanged response shape) — arbitrary aggregate query across a whole grade:
```json
{ "fields": ["cat_i_boys", "cat_ii_total"], "class": "1" }
```
→ `{ "status": "success", "data": { "cat_i_boys": 11, "cat_ii_total": 8 } }`

**New** — compute + upsert ONE individual class/section record:
```json
{ "class": "1", "section": "A" }
```
or
```json
{ "class": "XI-Science" }
```
optionally with `"session_id": "..."` (defaults to `"default"`), or `"id": "1-A"` as shorthand for class+section.

→
```json
{
  "status": "success",
  "record": { "id": "1-A", "displayName": "1-A", "sourceClass": "1", "section": "A",
              "finalDisplayGroup": "1", "approved": true, "fields": { "...": "..." } },
  "needs_review": [],
  "warnings": []
}
```

This **upserts** the record into that session's store. It never overwrites other records and never aggregates sections.

## GET /api/approved/{session_id}
→ **Changed.** Returns every approved individual record for that session:
```json
{ "sessionId": "abc123", "records": [ { "id": "1-A", "...": "..." }, { "id": "1-B", "...": "..." } ] }
```
Returns `records: []` (not an error) if nothing has been approved yet for that session.

---

**IMPORTANT:** Do not aggregate individual sections in this API — that happens in the frontend preview workflow only.
