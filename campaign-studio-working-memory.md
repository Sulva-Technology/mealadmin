# Campaign Studio Working Memory

## Problem Summary

- Merge the standalone Meal Direct campaign generator into the authenticated admin, while raising its flyer quality to a distinct editorial system. The supplied Sulva document is a visual-principle reference only; Meal Direct retains its own identity.

## Product Goal

- An operations or campus admin selects a live campus, edits a campus-specific flyer, sees the exact QR destination, and downloads a high-resolution PNG from one native admin workspace.

## Stack and Runtime

- Next.js 15 App Router, React 19, TypeScript, and Tailwind utilities.
- Existing authenticated browser-to-backend proxy provides campus data.
- Drafts are browser-local until the backend exposes an authenticated campaign-storage API.
- `qrcode` and `html-to-image` generate QR imagery and exports.

## Confirmed Facts

- `C:\sulvatech\campaign` is a standalone non-git Next app with 28 flyer concepts, Meal Direct branding, local JSON persistence, QR generation, and export utilities.
- Admin already reads campuses from `GET /admin/campuses`; each campus has a public destination based on its slug.
- Meal Direct public campus links use `https://user.mealdirectly.com/{slug}`.
- The current admin client has no campaign CRUD endpoint.
- TypeScript and ESLint passed after the first integration. An unauthenticated visit to `/campaigns` correctly redirects to `/login`.

## Unknowns / Needs Confirmation

- Exact server-side campaign draft, asset, export-history, and authorization contract.
- No offer, testimonial, event, vendor, or recruitment detail should be invented in flyer copy.

## Active Files / Surfaces

- `app/(admin)/campaigns/page.tsx`
- `components/admin/campaign/CampaignStudio.tsx`
- `lib/campaign-studio.ts`
- `lib/rbac.ts`, `components/admin/Sidebar.tsx`
- `public/campaign/*`

## Decisions

- Use Meal Direct branding only: deep green, warm cream, fresh green, and existing logo.
- Adapt reference principles—oversized type, engineered asymmetry, real imagery, restraint, and varied compositions—without copying its identity or layouts.
- Keep 28 distinct campaign starting points rather than a repeated card template.
- Make Campaign Studio available to super, operations, and campus admins; do not invent backend mutation calls.

## API Contracts

- `GET /admin/campuses?limit=100` returns the selected `Campus` through the existing authenticated proxy.
- No campaign CRUD contract is used or assumed.

## Data Model

- A flyer draft is `{ headline, supporting, cta, stage }` at `mealdirect:campaign-draft:{campusId}:{templateId}` in local storage.
- The campus slug determines the QR/destination URL.

## Auth and Security

- Existing middleware gates `/campaigns` before it renders.
- Navigation visibility is role-scoped to super, operations, and campus admins. The backend remains authoritative for campus reads.

## UI System Notes

- Three-part working surface: format library, live portrait flyer, and focused copy/export inspector.
- QR always points to the selected campus’s public link. Neutral starting copy avoids fabricated promotions.
- The 28 formats vary image treatment and composition while sharing Meal Direct identity.

## Bugs Fixed

- Replaced the separate local dashboard with a native campus-linked admin studio.
- Stage switching regenerates defaults unless there is a matching-stage saved draft, preventing stale launch copy from being silently reused.

## Risks / Watchouts

- Local drafts are device-specific; a backend campaign-draft API is required for team-wide persistence and audit history.
- Browser PNG export depends on canvas support; imagery is bundled as same-origin assets to avoid canvas-tainting errors.

## Next Actions

- Run final typecheck/lint after the latest adjustment.
- Perform visual/export QA with a valid admin session and a real campus.
- Add backend persistence once the endpoint contract is available.
