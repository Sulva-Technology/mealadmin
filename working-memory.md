# Working Memory

## Problem Summary
- Address the UX and accessibility issues identified in the 2026-11-04 admin-app audit.

## Product Goal
- Let admin users find pages and records quickly, complete data-table tasks with a keyboard, and recover from sign-in mistakes without ambiguity.

## Stack and Runtime
- framework: next.js app router
- language: typescript
- ui styling: tailwind css
- backend/runtime: node.js
- database: supabase postgres
- deployment assumptions: vercel preview and production

## Confirmed Facts
- The app is a Next.js 15 App Router admin portal with role-based navigation.
- Live audit evidence covered sign-in and password recovery; authenticated flows were reviewed from implementation because no admin test session was available.
- Shared tables previously navigated through clickable table rows, which are not keyboard-operable.

## Unknowns / Needs Confirmation
- none yet

## Active Files / Surfaces
- components/Login.tsx
- components/ui/DataTable.tsx
- components/admin/Topbar.tsx
- components/admin/QuickNav.tsx
- components/ui/Modal.tsx
- components/ui/Page.tsx
- components/admin/ListView.tsx
- app/(admin)/orders/page.tsx
- app/(admin)/payments/page.tsx

## Decisions
- Keep the existing Tailwind visual system and add reusable accessibility/task-discovery primitives instead of redesigning pages.

## API Contracts
- none yet

## Data Model
- none yet

## Auth and Security
- none yet

## UI System Notes
- Use visible first-cell links in data tables for record navigation; do not make table rows click-only.
- Use an authenticated quick navigator (Ctrl/Cmd+K) sourced from role-visible navigation items.

## Bugs Fixed
- Login fields now expose programmatic labels, password-manager hints, an accessible password reveal control, focused error feedback, and a direct reset action.
- Record navigation is exposed through keyboard-operable first-cell links rather than click-only table rows.
- Icon-only top-bar and dialog controls have accessible names; dialogs expose dialog semantics, Escape, and backdrop close.
- Role-aware quick navigation is available through a header control and Ctrl/Cmd+K.
- Payment filters now prioritize common controls, reveal advanced controls on demand, report active filters, and clear them in one action.
- Shared empty states can present a recovery action; orders and payments now use one.

## Risks / Watchouts
- Authenticated workflows still require a valid admin session and seeded API data for live end-to-end verification.

## Next Actions
- Completed: lint and typecheck pass. Targeted Vitest runs passed (55 reported tests across all 12 test files); the aggregate runner did not return a final summary within the terminal time limit. The local sign-in smoke test confirmed programmatic Email Address/Password labels and the password reveal toggle.
- Remaining: live-test authenticated pages with a real admin session and seeded API data.
