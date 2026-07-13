/**
 * Money-pools math for the Finance overview page.
 *
 * Vendor + rider pools are EXACT — summed straight from settlement `payableKobo`.
 * The platform pool is a DERIVED ESTIMATE, gross of Paystack fees:
 *   platform_gross ≈ total_collected − vendor_payables − rider_payables
 * Paystack processing charges are not present anywhere in the admin API, so the
 * platform figure must always be shown as an estimate. See
 * docs/superpowers/specs/2026-07-11-money-pools-overview-design.md.
 */

import { startOfWeek, startOfMonth, format } from 'date-fns';
import { api, type Query } from './api';
import type {
  SettlementListItem,
  BeneficiaryType,
  PaymentListItem,
  RefundListItem,
} from './types';

export type FinancePeriod = 'today' | 'week' | 'month' | 'all';

export interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

/** Inclusive YYYY-MM-DD range for a period, anchored on `now` (local time). */
export function periodRange(period: FinancePeriod, now: Date = new Date()): DateRange {
  const iso = (d: Date) => format(d, 'yyyy-MM-dd');
  const today = iso(now);
  switch (period) {
    case 'today':
      return { dateFrom: today, dateTo: today };
    case 'week':
      // Week starts Monday to match the ops calendar.
      return { dateFrom: iso(startOfWeek(now, { weekStartsOn: 1 })), dateTo: today };
    case 'month':
      return { dateFrom: iso(startOfMonth(now)), dateTo: today };
    case 'all':
      return {};
  }
}

/** True when a settlement's date falls inside the range (inclusive). Empty range = always. */
export function inRange(date: string, range: DateRange): boolean {
  // Settlement dates are ISO 'YYYY-MM-DD', so lexical compare is chronological.
  const day = date.slice(0, 10);
  if (range.dateFrom && day < range.dateFrom) return false;
  if (range.dateTo && day > range.dateTo) return false;
  return true;
}

export interface PoolBreakdown {
  totalKobo: number;
  draftKobo: number;
  approvedKobo: number;
  paidKobo: number;
  count: number;
}

export interface PlatformPool {
  /** Derived estimate, gross of Paystack fees. null when total_collected is unknown. */
  grossKobo: number | null;
  collectedKobo: number | null;
  /** Processed refunds subtracted from collected. */
  refundsKobo: number;
  /** Estimated Paystack processing fee on the collected amount. null when unavailable. */
  estFeeKobo: number | null;
  /** grossKobo − estFeeKobo — an estimate on top of the derived gross. null when unavailable. */
  netEstKobo: number | null;
  available: boolean;
  /** collected − refunds − payables came out below zero (data/timing mismatch) — show with caution. */
  negative: boolean;
}

export interface MoneyPools {
  vendor: PoolBreakdown;
  rider: PoolBreakdown;
  platform: PlatformPool;
}

const emptyBreakdown = (): PoolBreakdown => ({
  totalKobo: 0,
  draftKobo: 0,
  approvedKobo: 0,
  paidKobo: 0,
  count: 0,
});

/** Sum a settlement list by status. Cancelled settlements are excluded (no real money). */
export function summarizeSettlements(settlements: SettlementListItem[]): PoolBreakdown {
  const b = emptyBreakdown();
  for (const s of settlements) {
    if (s.status === 'cancelled') continue;
    b.totalKobo += s.payableKobo;
    b.count += 1;
    if (s.status === 'draft') b.draftKobo += s.payableKobo;
    else if (s.status === 'approved') b.approvedKobo += s.payableKobo;
    else if (s.status === 'paid') b.paidKobo += s.payableKobo;
  }
  return b;
}

/**
 * Estimated Paystack (Nigeria) processing fee for a collected amount, in kobo.
 * Local-card pricing: 1.5% + ₦100, the flat ₦100 waived under ₦2,500, fee capped
 * at ₦2,000. This is an ESTIMATE applied to an aggregate — Paystack charges per
 * transaction, and the admin API does not expose real fees. Never a settled figure.
 */
export function estimatePaystackFeeKobo(collectedKobo: number): number {
  if (!(collectedKobo > 0)) return 0;
  const FLAT = 10000; // ₦100 in kobo
  const WAIVER_THRESHOLD = 250000; // ₦2,500 in kobo
  const CAP = 200000; // ₦2,000 in kobo
  const percent = collectedKobo * 0.015;
  const flat = collectedKobo < WAIVER_THRESHOLD ? 0 : FLAT;
  return Math.min(Math.round(percent + flat), CAP);
}

/** Sum real money collected: paid + partially-refunded payments (gross of refunds). */
export function sumPaidCollected(payments: PaymentListItem[]): number {
  let total = 0;
  for (const p of payments) {
    if (p.paymentStatus === 'paid' || p.paymentStatus === 'partially_refunded') {
      total += p.amountPaidKobo;
    }
  }
  return total;
}

/**
 * Sum refunds that actually left — the backend's terminal-success status is
 * 'succeeded' (NOT 'processed'; the RefundStatus type in lib/types.ts is stale) —
 * with processedAt inside the range.
 */
export function sumSucceededRefunds(refunds: RefundListItem[], range: DateRange): number {
  let total = 0;
  for (const r of refunds) {
    if (r.status !== 'succeeded' || !r.processedAt) continue;
    if (!inRange(r.processedAt, range)) continue;
    total += r.amountKobo;
  }
  return total;
}

export interface BeneficiaryEarning {
  id: string;
  totalKobo: number;
}

/**
 * Group settlements by their beneficiary (vendor or rider), summing payable.
 * Cancelled settlements are excluded; result is sorted highest-earning first.
 */
export function groupByBeneficiary(
  settlements: SettlementListItem[],
  kind: BeneficiaryType,
): BeneficiaryEarning[] {
  const totals = new Map<string, number>();
  for (const s of settlements) {
    if (s.status === 'cancelled') continue;
    const id = kind === 'vendor' ? s.vendorId : s.riderId;
    if (!id) continue;
    totals.set(id, (totals.get(id) ?? 0) + s.payableKobo);
  }
  return [...totals.entries()]
    .map(([id, totalKobo]) => ({ id, totalKobo }))
    .sort((a, b) => b.totalKobo - a.totalKobo);
}

/** Combine exact vendor/rider pools with the derived platform pool. */
export function computePools(
  vendorSettlements: SettlementListItem[],
  riderSettlements: SettlementListItem[],
  collectedKobo: number | null,
  refundsOutKobo = 0,
): MoneyPools {
  const vendor = summarizeSettlements(vendorSettlements);
  const rider = summarizeSettlements(riderSettlements);

  const available = typeof collectedKobo === 'number' && !Number.isNaN(collectedKobo);
  const gross = available
    ? collectedKobo! - refundsOutKobo - vendor.totalKobo - rider.totalKobo
    : null;
  const estFee = available ? estimatePaystackFeeKobo(collectedKobo!) : null;
  const netEst = gross !== null && estFee !== null ? gross - estFee : null;

  return {
    vendor,
    rider,
    platform: {
      grossKobo: gross,
      collectedKobo: available ? collectedKobo! : null,
      refundsKobo: refundsOutKobo,
      estFeeKobo: estFee,
      netEstKobo: netEst,
      available,
      negative: gross !== null && gross < 0,
    },
  };
}

/**
 * Cursor-walk bound. List pages cap at 100 (lib/api.ts); MAX_PAGES bounds the work.
 *
 * The settlements endpoint does NOT accept dateFrom/dateTo (it rejects unknown
 * props), so settlement callers filter by settlementDate client-side with
 * `inRange`. The payments endpoint DOES accept status/from/to server-side; the
 * refunds endpoint accepts status but not a date range, so refund callers filter
 * processedAt client-side.
 */
const MAX_PAGES = 50;

export async function fetchAllSettlements(
  params: { campusId?: string; beneficiaryType: BeneficiaryType },
): Promise<SettlementListItem[]> {
  return walkAll((q) => api.getSettlements(q), params);
}

/** Fetch every payment matching the filters (status/date filtered server-side). */
export async function fetchAllPayments(
  params: { campusId?: string; status?: string; from?: string; to?: string },
): Promise<PaymentListItem[]> {
  return walkAll((q) => api.getPayments(q), params);
}

/** Fetch every refund matching the filters. */
export async function fetchAllRefunds(
  params: { campusId?: string; status?: string },
): Promise<RefundListItem[]> {
  return walkAll((q) => api.getRefunds(q), params);
}

/** Walk a cursor-paginated list endpoint to exhaustion, bounded by MAX_PAGES. */
async function walkAll<T>(
  fetchPage: (q: Query) => Promise<{ data: T[]; pagination: { hasMore: boolean; nextCursor?: string } }>,
  params: Query,
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const env = await fetchPage({ ...params, limit: 100, cursor });
    out.push(...env.data);
    if (!env.pagination.hasMore || !env.pagination.nextCursor) break;
    cursor = env.pagination.nextCursor;
  }
  return out;
}
