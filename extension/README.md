# KVS Copilot Extension

A Chrome Extension (Manifest V3) that pushes approved enrollment data from the FastAPI backend into the **Vision portal** (localhost:5173) using the portal's native `?preview=<encoded JSON>` URL mechanism.

The Vision portal does **not** use DOM inputs — it renders a static table from a URL param. So this extension has **no DOM autofill**. Instead it:

1. Fetches approved records from the backend: `GET /api/approved/default`
2. Maps + aggregates them into the exact shape the Vision table expects
3. Opens a new tab at `http://localhost:5173/?preview=<encoded JSON>`

---

## Flow

```
Teacher dashboard          FastAPI backend            Vision portal (5173)
   uploads & approves  →   /api/approved/default  →   ?preview=<JSON>
                                             │
                                     ┌───────┴───────┐
                                     │  EXTENSION     │
                                     │  fetch + map   │
                                     │  + redirect    │
                                     └───────────────┘
```

Clicking **Open Portal** (in the popup, or the floating button injected on the Vision site) triggers the background worker:

```js
fetch("https://kvs-copilot-production-010b.up.railway.app/api/approved/default")
  → mapRecordForVision(record)     // rename fields
  → aggregateRecords(records)      // group sections → class totals
  → { records: [...] }
  → encodeURIComponent(JSON.stringify(...))
  → http://localhost:5173/?preview=<encoded>
```

---

## File Structure

```
extension/
├── manifest.json     # Manifest V3 configuration
├── background.js     # Service worker: fetch + map + aggregate + redirect
├── content.js        # Injects a floating "Open Portal" button on the Vision site
├── popup.html        # Extension popup UI
├── popup.js          # Popup "Open Portal" handler
└── styles.css        # Styling (kept for popup)
```

---

## Field mapping (`mapRecordForVision`)

Backend `fields` → Vision `PreviewRecord` keys (see `apps/vision/src/routes/index.tsx`):

| Backend field | Vision field |
|---------------|--------------|
| `numberOfSections` | `numberOfSections` |
| `authorisedCapacity` | `authorisedCapacity` |
| `totalEnrolledStudents` | `totalStudentsEnrolled` |
| `boys` | `boys` |
| `girls` | `girls` |
| `scheduledCaste` | `sc` |
| `scheduledTribes` | `st` |
| `otherBackwardClasses` | `obc` |
| `ph` | `ph` |
| `general` | `gen` |
| `generalMinorities` | `genMinority` |
| `lastUpdated` | `lastUpdated` |

`record.id` becomes `className`, with `-` converted to spaces (e.g. `"XI-Science"` → `"XI Science"`).

---

## Class aggregation (`normalizeClass` + `aggregateRecords`)

The backend stores **section-level** records (`"1-A"`, `"1-B"`, `"2-A"`, ...), but the Vision portal only renders **class-level** rows (`"I"`, `"II"`, ..., `"X"`, `"XI Science"`, `"XII Commerce"`, ...). Records are grouped before sending:

| Record ids | Aggregated class |
|------------|------------------|
| `1-A`, `1-B` | `I` |
| `2-A`, `2-B` | `II` |
| `10-A` | `X` |
| `9-A` | `IX` |
| `XI-Science` | `XI Science` |
| `XII-Commerce` | `XII Commerce` |

All numeric fields are summed: `numberOfSections` (each section = 1), `authorisedCapacity`, `totalStudentsEnrolled`, `boys`, `girls`, `sc`, `st`, `obc`, `ph`, `gen`, `genMinority`. `lastUpdated` keeps the most recent non-empty value.

---

## Installation

1. Open **Chrome** → `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder

Reload the extension (⟳ icon) after editing any `.js` file.

---

## Running the demo end-to-end

1. Start the backend: `cd C:\Webapp && python -m uvicorn backend.main:app --reload --port 8000`
2. Start the Vision portal: `cd website-demo\apps\vision && npm install && npm run dev` (port 5173)
3. Open the teacher dashboard, upload the Excel, and **approve** the classes you want shown.
4. Click the extension icon → **Open Portal**.

If no records are approved, the extension shows: *"No approved data found. Please approve records first."*

---

## Troubleshooting

### "Failed to open portal. Make sure the backend is running"
- Confirm the backend is up at `https://kvs-copilot-production-010b.up.railway.app/api/approved/default`.
- Check the extension's service worker logs (`chrome://extensions` → "service worker" link).

### Table is empty / rows missing
- No records approved → approve them in the teacher dashboard.
- Section-level ids only fill the class row if the portal has a matching row label. The portal lists `I`–`X`, `XI/XII + stream`; there are no separate `1 A` / `2 B` rows.

---

## License

Internal tool for KVS enrollment statistics testing and development.
