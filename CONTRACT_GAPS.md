# CONTRACT GAPS

Tracks frontend ↔ backend gaps after wiring the admin UI to the documented
admin API (`mealdirectbackend/docs/admin-endpoints.md`, base `/v1/admin`).

## Wired (real endpoints, no demo data)

All 13 documented sections are implemented against live endpoints with cursor
pagination, campus scoping, and authoritative refetch on mutations:
session, dashboard, orders (+detail/transition/cancel), batches (+dispatch
actions), vendors (+onboard/edit/approve/suspend/activate/users/performance),
riders (+verify/suspend/activate/assignments/settlements), inventory
(+adjustments), escalations (+assign/evidence/resolve/refund), settlements
(+preview/generate/approve/mark-paid/adjustments), reviews (+moderate), users
(+suspend/activate), admin-memberships (super-admin), analytics, audit logs.

## Open gaps

### Authentication (needs live verification)
- Backend admin routes require a **Supabase JWT** (`admin-endpoints.md` §1.1).
  Login (`POST /v1/auth/admin/login`) → `supabase.auth.setSession(tokens)` →
  proxy/middleware gate on `getClaims()`. This is internally consistent but has
  **not** been verified end-to-end against a real admin account. Confirm a
  campus_admin and a super_admin can sign in and that `getClaims()` accepts the
  issued tokens.

### Pagination
- List endpoints accept `cursor`+`limit` and return `pagination.hasMore`, but
  **do not emit `nextCursor`** yet (offset-style `limit+1`). The UI exposes a
  page-size selector (20/50/100) and a "more exist" hint; the **Next** button
  stays disabled until the backend returns `nextCursor`.

### Not in the admin contract (deferred, no documented shapes)
- **Campus / Zone / Delivery-slot management** — only `GET /v1/admin/campuses`
  is consumed (scope selector + id→name lookup). Create/update of campuses,
  zones, locations and delivery slots exist in OpenAPI but are absent from
  `admin-endpoints.md`, so no write UI was built.
- **Payments operations** (`/v1/admin/payments*`) — present in OpenAPI, absent
  from the admin doc; no payments page built (response shapes undocumented).
- **Promotions** (`/v1/admin/promotions*`) — out of scope.

### User-scoped (outside admin contract)
- **Settings** shows the admin session read-only. Profile/notification editing
  (`/v1/me`, `/v1/notifications/preferences`) are user-scoped APIs and are not
  wired.

### Backend-acknowledged no-ops
- `escalations?assignee=` and `analytics?granularity=` are accepted/validated by
  the backend but not applied in the current queries (per the doc). The UI does
  not expose the `assignee` filter for that reason.
- No single-review GET endpoint exists; review moderation is inline on the list.
