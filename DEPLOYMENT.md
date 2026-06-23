# Deployment

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | build + runtime | Meal Direct API base, e.g. `https://api.mealdirectly.com/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | build + runtime | Backend's Supabase project URL (tokens are issued from it) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime | Supabase anon/publishable key (safe in browser) |

`NEXT_PUBLIC_*` vars are inlined into the client bundle at **build** time — they
must be set when running `npm run build` / `docker build`, not only at runtime.

## Build & run (Docker)

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.mealdirectly.com/v1 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  -t mealadmin .

docker run -p 3000:3000 mealadmin
```

Uses Next.js `output: 'standalone'`, so the runtime image ships only the server
bundle + static assets.

## Health checks

The backend exposes `GET /v1/health/ready` and `/v1/health/live`. Point your
load balancer / orchestrator liveness+readiness probes at the backend; the admin
app itself is stateless and ready as soon as the Node server is up.

## Observability (next step — not yet wired)

Error tracking is **not** installed. Recommended: add `@sentry/nextjs`, set
`SENTRY_DSN`, and replace the `console.warn` calls in the store and the proxy
route handler (`app/api/proxy/[...path]/route.ts`) with captured exceptions.
Until then, server errors surface only in stdout logs.

## CI

`.github/workflows/ci.yml` runs lint → typecheck → test → build on every PR.
