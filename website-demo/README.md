# KVS Demo – Admin to Public Preview

Two apps:
- `apps/admin/artifacts/kvs-demo-admin` – statistics admin/editor
- `apps/vision` – public KVS preview

## Connect the Apps

The admin sends previews to the Vision app via the `VITE_KVS_DEMO_URL` env var. Locally it defaults to `http://localhost:5173` (which matches where the Vision dev server runs).

The "Preview Changes" button sends the current form values as URL-encoded JSON. The Vision app reads the `preview` query parameter and fills the matching class row.

## Prerequisites

- Node.js 20+ and `pnpm` (`npm install -g pnpm` if needed)
- `bun` is optional; npm works for the Vision app

## Run Locally

Open two terminals.

### Terminal 1 – Admin (http://localhost:5174)

```bash
cd apps/admin
pnpm install
pnpm --filter kvs-demo-admin dev
```

No environment variables are required — `PORT` and `BASE_PATH` default to `5174` and `/`.

### Terminal 2 – Vision (http://localhost:5173)

```bash
cd apps/vision
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` to match the admin's default `VITE_KVS_DEMO_URL`.
