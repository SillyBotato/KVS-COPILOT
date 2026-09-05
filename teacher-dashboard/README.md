# Teacher Dashboard

A [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript + Tailwind CSS 4 app used by teachers to review and approve KVS enrollment records before they reach the public portal.

## What it does

1. **Upload** an Excel/CSV file → `POST /upload` on the FastAPI backend (which auto-prepares records for every valid class/section).
2. **Review** all prepared records (approved + needs-review) from `GET /api/records/default`.
3. **Approve** individual records via `POST /approve/default/{record_id}`.
4. **Open the portal** to view approved data as the public Vision portal renders it.

Only records a teacher explicitly approves are exposed through the backend's `GET /api/approved/default` (which the Chrome extension reads).

## Configuration

Environment variables (`.env.local`, see `.env.example`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI backend base URL | `https://kvs-copilot-production-010b.up.railway.app` |
| `NEXT_PUBLIC_PORTAL_URL` | Vision portal location (used by "Open Portal" buttons) | `https://kvs-copilot-demo-5q9e.vercel.app` |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Make sure the FastAPI backend is running on port 8000.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

## Key files

- `app/page.tsx` — upload/landing page
- `app/dashboard/page.tsx` — class list with approve buttons + status badges
- `app/review/[recordId]/page.tsx` — per-record review + approve
- `components/HeaderNav.tsx` — header nav with "Open Portal"
- `lib/api.ts` — API client (`uploadExcel`, `getAllRecords`, `getApprovedRecords`, `approveRecord`)
- `types/api.ts` — TypeScript types for the backend API contract
