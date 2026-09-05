# KVS Demo Admin Statistics

A fictional PM SHRI Kendriya Vidyalaya administration prototype for demonstrating Class-Wise Enrolment Position management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kvs-demo-admin/src/App.tsx` — admin shell, Statistics workflow, class listing, editable form, and localStorage persistence.
- `artifacts/kvs-demo-admin/src/index.css` — traditional WordPress/S3WAAS-inspired admin styling.
- `attached_assets/Pasted-Build-a-frontend-interactive-prototype-of-a-government-_1788435788250.txt` — product requirements and browser-extension DOM contract.

## Architecture decisions

- The demo is frontend-only and intentionally uses localStorage instead of authentication, a server database, or live school data.
- Critical edit fields remain native HTML controls with stable IDs and data-field attributes for browser-extension interoperability.
- `KVS_DEMO_URL` is the single handoff point for redirecting Preview Changes to the separate public-facing demo.
- Class completion is tracked separately from enrolment values so ticks survive route changes and refreshes without clearing saved form data.

## Product

- Browse a fictional admin dashboard and traditional Statistics listing.
- Filter to Class-Wise Enrolment Position, open all English class records, and edit their empty enrolment fields.
- Save each class record locally and confirm updates before previewing the public-facing demo.

## User preferences

No additional preferences recorded.

## Gotchas

- Replace the placeholder value in `KVS_DEMO_URL` when Website 1 is ready; Preview Changes intentionally targets that single constant.
- Use the class listing's explicit Reset Progress action to clear completion ticks; normal navigation never resets them.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
