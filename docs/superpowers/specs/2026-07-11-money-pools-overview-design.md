# Money Pools Overview — Design

Date: 2026-07-11
Status: Approved for planning

## Problem

Admin needs to see the three money pools — **vendor money**, **platform money**,
and **rider money** — in one place, but visually **separated**, so it's obvious how
much belongs to each party for a period.

Today this is scattered: settlements list mixes vendor + rider rows, the dashboard
shows a single combined `settlements.payableKobo`, and platform's own cut is not
surfaced anywhere.

## Money model (as it exists in the app)

- **Rider money** — settlements where `riderId` is set. Rider nets a fixed
  `RIDER_SHARE_KOBO` (₦75) per delivery (`lib/types.ts:57-58`). Pool = Σ `payableKobo`.
- **Vendor money** — settlements where `vendorId` is set. Vendor nets food revenue
  (+ service/takeaway fee) minus refunds/adjustments. Pool = Σ `payableKobo`.
- **Platform money** — the remainder the platform keeps: primarily the delivery-fee
  margin (`deliveryFeeKobo − RIDER_SHARE_KOBO`, e.g. ₦200 fee − ₦75 = ₦125), less
  Paystack processing charges. **No backend field stores this**, and Paystack fees
  are not present anywhere in the admin API.

### Consequence

Vendor and rider pools are **exact** (read straight from settlements). The platform
pool is a **derived estimate, gross of Paystack fees**, and must be labelled as such.

## Approach (chosen)

A dedicated page that shows three separated pool cards for a selected period.
Vendor + rider are exact; platform is derived and badged.

### Platform derivation

```
platform_gross ≈ total_collected − vendor_payables − rider_payables
```

- `vendor_payables`, `rider_payables` — Σ settlement `payableKobo`, split by beneficiary.
- `total_collected` — total customers paid for the period (food + delivery + service fee).
- Paystack fees are **not** subtracted (no data). The card carries an
  **"estimate · gross of Paystack"** badge and shows the formula on hover/expand.

This derivation naturally rolls up the delivery margin *and* any service-fee retained
by the platform, and matches the user's "the remaining ₦125 minus Paystack" mental model.

## UI

New route: `app/(admin)/finance/page.tsx`, sidebar entry **"Money"** in the
*Finance & Quality* group, restricted to `FINANCE_ROLES` (same as Settlements),
icon `Wallet` (add to `Sidebar.tsx` + `BottomNav.tsx` icon maps).

Layout:

- `PageHeader` — title "Money", subtitle "Vendor, platform & rider funds for the period."
- **Controls:** period filter (Today / This week / This month / All — default **This month**)
  + reuse the existing campus scope (`useSession().scopeCampusId`).
- **Three pool cards** (responsive grid, one per pool, clearly separated):

  | Card | Icon | Amount | Sub-lines | Trust |
  |------|------|--------|-----------|-------|
  | Vendor | Store | Σ vendor `payableKobo` | draft / approved / paid split, settlement count | exact |
  | Platform | Wallet | derived `platform_gross` | collected − vendor − rider breakdown | **estimate badge** |
  | Rider | Bike | Σ rider `payableKobo` | draft / approved / paid split, settlement count | exact |

- A small footnote under the platform card: "Platform figure is derived and does not
  deduct Paystack processing fees. For a Paystack-net figure a backend `/admin/finance`
  endpoint is needed."

All money formatted via `formatKobo`. Follow existing card/`glass-panel` styling.

## Data sourcing

Reuse existing endpoints; no backend change required for MVP.

- Vendor / rider pools: `api.getSettlements({ campusId, beneficiaryType, <period> })`,
  summed client-side by `status`.
- Total collected: `api.getAnalytics({ campusId, <period> })` → `grossSalesKobo`,
  **if** analytics accepts a period range and `grossSalesKobo` reflects total collected.

### Primary implementation risk (resolve first in the plan)

1. **Period filtering + pagination.** List endpoints cap page size at 100
   (`lib/api.ts:80-81`). Summing a month of settlements may need paginated fetches, and
   `getSettlements` currently is called with a single `date`, not a range — the plan's
   first task is a spike to confirm the settlements date-range query param and the
   analytics period params, then choose: (a) paginated client sum, or (b) request a
   lightweight aggregate endpoint if volume is too high.
2. **`grossSalesKobo` semantics.** Confirm it includes delivery + service fees (i.e. is
   "total collected"), not food-only. If food-only, `total_collected` must come from
   summing paid payments (`amountPaidKobo`) instead.

If neither total-collected source is trustworthy, the platform card shows
"unavailable — backend needed" rather than a wrong number. Vendor and rider cards
still render (they are exact and independent of `total_collected`). Truthfulness over
completeness.

## Testing

- Unit-test the pool aggregation/derivation helper (pure function: given settlement
  arrays + collected total → three pool figures) covering: vendor-only, rider-only,
  mixed, empty, and the platform-goes-negative guard (clamp/annotate, never show a
  misleading negative silently).
- Follow existing page test patterns under `test/` for the page render + period switch.

## Out of scope

- Any backend/API change (noted as the follow-up for a Paystack-net platform figure).
- Per-vendor / per-rider drilldown (Settlements page already covers that).
- Payout execution (already on Settlements).
