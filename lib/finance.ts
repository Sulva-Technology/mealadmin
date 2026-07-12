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
import type { SettlementListItem, BeneficiaryType } from './types';

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
  available: boolean;
  /** collected − payables came out below zero (data/timing mismatch) — show with caution. */
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

/** Combine exact vendor/rider pools with the derived platform pool. */
export function computePools(
  vendorSettlements: SettlementListItem[],
  riderSettlements: SettlementListItem[],
  collectedKobo: number | null,
): MoneyPools {
  const vendor = summarizeSettlements(vendorSettlements);
  const rider = summarizeSettlements(riderSettlements);

  const available = typeof collectedKobo === 'number' && !Number.isNaN(collectedKobo);
  const gross = available ? collectedKobo! - vendor.totalKobo - rider.totalKobo : null;

  return {
    vendor,
    rider,
    platform: {
      grossKobo: gross,
      collectedKobo: available ? collectedKobo! : null,
      available,
      negative: gross !== null && gross < 0,
    },
  };
}

/**
 * Fetch every settlement for a beneficiary type by walking the cursor. The
 * settlements endpoint does NOT accept dateFrom/dateTo (it rejects unknown
 * props), so we cannot filter by range server-side — callers filter by
 * settlementDate client-side with `inRange`. List pages cap at 100
 * (lib/api.ts), capped at MAX_PAGES to bound the work.
 */
const MAX_PAGES = 50;

export async function fetchAllSettlements(
  params: { campusId?: string; beneficiaryType: BeneficiaryType },
): Promise<SettlementListItem[]> {
  const out: SettlementListItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const q: Query = { ...params, limit: 100, cursor };
    const env = await api.getSettlements(q);
    out.push(...env.data);
    if (!env.pagination.hasMore || !env.pagination.nextCursor) break;
    cursor = env.pagination.nextCursor;
  }
  return out;
}
