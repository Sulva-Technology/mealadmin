# Meal Direct Admin UX Audit

Captured: 2026-11-04

## Scope

Observed live: login, password reset, mobile reset, and failed-sign-in feedback.

Reviewed from implementation only: authenticated navigation, order/payment list patterns, and shared controls. No admin session was available, so those workflows were not presented as live-test findings.

## Outcome

The entry flow is easy: one focused card, familiar fields, a visible recovery path, and clear error feedback. Day-to-day admin work is likely harder for new or infrequent users: the main navigation exposes 25 destinations, and high-volume pages combine dense filters, wide tables, and row-click navigation. The product has useful role-based navigation and task-oriented payment queues, but needs stronger task prioritisation, search, and keyboard support.

## Observed flow

1. `01-login.png` — Sign in. **Healthy.** The page makes its primary action clear and the recovery path is easy to find.
2. `02-password-reset.png` — Password reset. **Healthy.** One-field recovery is concise and users can return to sign-in without losing their place.
3. `03-mobile-password-reset.png` — Mobile reset. **Healthy.** Controls are large, readable, and fit the viewport without horizontal scrolling.
4. `04-login-error-mobile.png` — Invalid sign-in feedback. **Mostly healthy.** The error is prominent and remains close to the form; it does not, however, point to the field to correct or offer a next best action.

## Highest-impact findings

1. **P1 — Make data-table rows keyboard-operable.** Shared tables use clickable `<tr>` elements for detail navigation, with no link, button role, focus target, or keyboard handler. Mouse users can open a record; keyboard and assistive-technology users cannot reliably do the same. Make the primary cell a real link, or provide a visible “Open” link/button in every row. Evidence: `components/ui/DataTable.tsx`.
2. **P1 — Give every form control a programmatic label.** The login labels are visually adjacent to, but not associated with, their inputs. The captured accessibility tree names the fields from placeholders rather than “Email Address” and “Password”. Nest inputs in their labels or use matching `htmlFor`/`id`; do the same for icon-only top-bar buttons with `aria-label`s. Evidence: live snapshots and `components/Login.tsx`, `components/admin/Topbar.tsx`.
3. **P1 — Reduce task-finding time in the admin workspace.** A super-admin can face 25 destinations over six sidebar groups. Add global search/command palette, “most-used” shortcuts, and role-specific task queues at the dashboard top. Preserve the role filters already in place.
4. **P2 — Make high-volume lists easier to operate.** Payments can expose a dozen filters plus a horizontally scrollable table; individual rows also have four actions. Put common filters first, hide advanced filters behind a clear control, show active filter chips plus “Clear all,” and use a dedicated row-details action rather than row click. Evidence: `app/(admin)/payments/page.tsx` and `components/ui/DataTable.tsx`.
5. **P2 — Improve sign-in recovery.** Keep the generic security-safe error, but add “Forgot password?” beside it and move focus to the alert. Add a password visibility toggle and `autocomplete="username"` / `autocomplete="current-password"` to reduce typing errors. Evidence: `04-login-error-mobile.png` and `components/Login.tsx`.
6. **P2 — Give empty states a next step.** Shared list empty states only say that no records match. Add a context-aware action such as “Clear filters,” “Change service date,” or “Create vendor” where appropriate. Evidence: `components/ui/Page.tsx`.

## Strengths

- Consistent hierarchy and a clear primary action at entry.
- Password reset is discoverable and deliberately avoids revealing whether an email exists.
- Mobile controls appear comfortably sized and the error is announced with `role="alert"`.
- Role-based navigation and guarded actions reduce irrelevant or unsafe options.
- Orders are grouped by vendor and delivery slot; payment issue queues surface work that needs attention.

## Evidence limits

No valid admin credentials or seeded local data were available, so I could not live-test dashboard, orders, payment triage, mutations, loading/error states, or screen-reader/keyboard paths beyond the entry flow. This is a UX audit, not a WCAG conformance review; contrast, focus order, and assistive-technology behaviour need hands-on testing.
