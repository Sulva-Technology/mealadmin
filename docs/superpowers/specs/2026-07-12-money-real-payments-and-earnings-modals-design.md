# Money page — real-payments collected figure & per-beneficiary earnings modals

Date: 2026-07-12
Status: Approved

## Problem

The Money overview ([app/(admin)/finance/page.tsx](../../../app/(admin)/finance/page.tsx),
[lib/finance.ts](../../../lib/finance.ts)) has three gaps:

1. **Platform "collected" is an opaque backend number.** It comes from
   `analytics.grossSalesKobo`, which the frontend cannot prove excludes expired /
   pending / failed orders. Money shown must be *real* money — only successfully
   paid orders. Expired orders (order status `expired`, payment never reaches
   `paid`) must never count.
2. **No Paystack-fee view.** The platform card shows only gross. Fees are not
   exposed by the admin API, but an estimated net is still useful.
3. **Vendor / Rider cards are dead.** They show pool totals but you cannot see
   which vendor or rider the money belongs to.

## Design

### Data sources — all client-computed and auditable

| Figure | Source | Real-money guarantee |
|---|---|---|
| Vendor / Rider pools | `getSettlements` per beneficiary type, cancelled excluded | Settlements exist only for completed orders |
| Collected | `Σ amountPaidKobo` from `getPayments`, status in (`paid`, `partially_refunded`), `createdAt` in period | Expired / pending / failed never reach `paid` |
| Refunds out | `Σ amountKobo` from `getRefunds`, status `succeeded`, `processedAt` in period | Only money that actually left |
| Platform gross | `collected − refundsOut − vendor − rider` | — |
| Platform net (est.) | `gross − estPaystackFee(collected)` | estimate on an estimate |

`analytics.grossSalesKobo` is dropped entirely from this page.

Rationale for **net refunds** (chosen over gross / strict-paid): `partially_refunded`
payments still represent real money collected, so they are included at full
`amountPaidKobo`; the money returned to customers is then subtracted via processed
refunds. This is the truest picture of money actually kept.

### `lib/finance.ts` — pure helpers (unit-tested)

- `estimatePaystackFeeKobo(kobo)` — Paystack NG: `1.5% + ₦100`, the `₦100` flat
  waived when amount `< ₦2,500`, total fee capped at `₦2,000`. Returns `0` for
  `0`/negative input.
- `sumPaidCollected(payments, range)` — sum `amountPaidKobo` for status in
  (`paid`, `partially_refunded`) with `createdAt` day inside `range`.
- `sumSucceededRefunds(refunds, range)` — sum `amountKobo` for status `succeeded`
  (backend terminal-success value; the RefundStatus type is stale) with
  `processedAt` day inside `range` (reuse `inRange`).
- `groupByBeneficiary(settlements, 'vendor' | 'rider')` → `{ id, totalKobo }[]`,
  cancelled excluded, sorted `totalKobo` desc.
- `computePools(vendor, rider, collectedKobo, refundsOutKobo = 0)` — extended.
  `refundsOutKobo` defaults to `0` for back-compat. `PlatformPool` gains
  `refundsKobo`, `estFeeKobo`, `netEstKobo`. `grossKobo = collected − refunds −
  vendor − rider`; `netEstKobo = grossKobo − estFee(collected)` (null when
  unavailable).
- `fetchAllPayments({ campusId })` (endpoint rejects date/no need for status) and
  `fetchAllRefunds({ campusId, status })` — cursor walkers mirroring
  `fetchAllSettlements`, same `MAX_PAGES` cap.

### `app/(admin)/finance/page.tsx`

- Query fetches, in parallel: vendor settlements, rider settlements,
  `fetchAllPayments({ campusId })` — the payments endpoint rejects date params
  (`from`/`to`) and a `status` filter would drop `partially_refunded`, so we fetch
  all and filter client-side to (`paid`, `partially_refunded`) with `createdAt` in
  period — plus `fetchAllRefunds({ status: 'succeeded' })`, and vendor/rider name
  lists (`getVendors`, `getRiders`) for the modals.
  - Collected is filtered client-side to `createdAt` in period via
    `sumPaidCollected`; refunds to `processedAt` in period via `sumSucceededRefunds`.
- Platform card rows: `Collected`, `− Refunds`, `− Vendor + rider`,
  `Est. Paystack fee`, **`Net (est.)`** (bold). Keep the `estimate` badge and the
  "gross of Paystack fees — not a settled figure" footnote, amended to mention the
  net line is also an estimate.
- Vendor & Rider cards become focusable `<button>`s (hover state, `cursor-pointer`),
  opening the shared [Modal](../../../components/ui/Modal.tsx). No-op when
  `count === 0`.
  - Modal title: `"Vendor earnings — <period label>"` / `"Rider earnings — …"`.
  - Rows: **name + total**, sorted desc. Name from the id→`displayName` map;
    unknown id → `"Unknown (<id slice>)"`.

### Tests — `test/finance.test.ts`

- `estimatePaystackFeeKobo`: below-waiver threshold (no `₦100`), above threshold
  (with `₦100`), cap at `₦2,000`, zero input.
- `sumPaidCollected`: includes `paid` + `partially_refunded`, excludes
  `pending`/`failed`/`abandoned`/`refunded`.
- `sumSucceededRefunds`: only `succeeded`, only in-range `processedAt`.
- `groupByBeneficiary`: sums per id, excludes cancelled, sorts desc.
- `computePools`: net math with refunds; existing tests keep passing via the
  defaulted `refundsOutKobo`.

## Known caveat

Refund/payment period-timing mismatches (money collected one period, refunded or
settled in another) can still drive the platform figure negative. The existing red
"payables exceed collected" warning is retained.

## Out of scope

- Backend endpoint for actual Paystack fees (would replace the estimate).
- Per-beneficiary status breakdown inside the modal (name + total only for now).
- Platform card modal (platform money is not per-beneficiary).
