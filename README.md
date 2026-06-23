# Meal Direct — Admin Control Center

Operational dashboard for Meal Direct. Manages orders, vendors, riders, students,
campuses, payments, settlements, escalations and dispatch across campuses.

Stack: Next.js 15 (App Router) · React 19 · Zustand · Tailwind 4 · Supabase Auth.

## Prerequisites

- Node.js 20+
- A Meal Direct API endpoint (default `https://api.mealdirectly.com/v1`)
- Supabase project (for admin auth/session)

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy env and fill values:
   ```
   cp .env.example .env.local
   ```
   - `NEXT_PUBLIC_API_URL` — Meal Direct API base URL
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Auth
3. Run dev server:
   ```
   npm run dev
   ```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — eslint

## API

The backend contract is documented at `https://api.mealdirectly.com/docs`
(OpenAPI JSON at `/docs/openapi.json`). Known frontend/backend gaps are tracked
in [CONTRACT_GAPS.md](CONTRACT_GAPS.md).
