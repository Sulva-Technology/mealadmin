import { describe, expect, it } from 'vitest';
import {
  computePools,
  summarizeSettlements,
  periodRange,
  inRange,
} from '@/lib/finance';
import type { SettlementListItem } from '@/lib/types';

function settlement(over: Partial<SettlementListItem>): SettlementListItem {
  return {
    id: 'id',
    campusId: 'c1',
    vendorId: null,
    riderId: null,
    settlementDate: '2026-07-05',
    status: 'approved',
    payableKobo: 0,
    paidAt: null,
    externalReference: null,
    createdAt: '2026-07-05T00:00:00Z',
    ...over,
  };
}

describe('summarizeSettlements', () => {
  it('sums by status and excludes cancelled', () => {
    const b = summarizeSettlements([
      settlement({ status: 'draft', payableKobo: 1000 }),
      settlement({ status: 'approved', payableKobo: 2000 }),
      settlement({ status: 'paid', payableKobo: 3000 }),
      settlement({ status: 'cancelled', payableKobo: 9999 }),
    ]);
    expect(b).toEqual({
      totalKobo: 6000,
      draftKobo: 1000,
      approvedKobo: 2000,
      paidKobo: 3000,
      count: 3,
    });
  });

  it('is empty for no settlements', () => {
    expect(summarizeSettlements([])).toEqual({
      totalKobo: 0,
      draftKobo: 0,
      approvedKobo: 0,
      paidKobo: 0,
      count: 0,
    });
  });
});

describe('computePools', () => {
  const vendor = [settlement({ vendorId: 'v1', payableKobo: 50000 })];
  const rider = [settlement({ riderId: 'r1', payableKobo: 7500 })];

  it('derives platform gross = collected − vendor − rider', () => {
    const pools = computePools(vendor, rider, 70000);
    expect(pools.vendor.totalKobo).toBe(50000);
    expect(pools.rider.totalKobo).toBe(7500);
    expect(pools.platform.grossKobo).toBe(12500); // the "remaining 125"
    expect(pools.platform.available).toBe(true);
    expect(pools.platform.negative).toBe(false);
  });

  it('marks platform unavailable when collected is unknown', () => {
    const pools = computePools(vendor, rider, null);
    expect(pools.platform.grossKobo).toBeNull();
    expect(pools.platform.available).toBe(false);
    // vendor + rider stay exact regardless
    expect(pools.vendor.totalKobo).toBe(50000);
    expect(pools.rider.totalKobo).toBe(7500);
  });

  it('flags a negative platform figure instead of hiding it', () => {
    const pools = computePools(vendor, rider, 40000);
    expect(pools.platform.grossKobo).toBe(-17500);
    expect(pools.platform.negative).toBe(true);
  });

  it('handles NaN collected as unavailable', () => {
    const pools = computePools(vendor, rider, Number.NaN);
    expect(pools.platform.available).toBe(false);
  });
});

describe('periodRange', () => {
  const now = new Date('2026-07-11T09:00:00'); // a Saturday

  it('today is a single day', () => {
    expect(periodRange('today', now)).toEqual({ dateFrom: '2026-07-11', dateTo: '2026-07-11' });
  });

  it('week starts Monday', () => {
    expect(periodRange('week', now)).toEqual({ dateFrom: '2026-07-06', dateTo: '2026-07-11' });
  });

  it('month starts on the 1st', () => {
    expect(periodRange('month', now)).toEqual({ dateFrom: '2026-07-01', dateTo: '2026-07-11' });
  });

  it('all has no bounds', () => {
    expect(periodRange('all', now)).toEqual({});
  });
});

describe('inRange', () => {
  const range = { dateFrom: '2026-07-01', dateTo: '2026-07-11' };
  it('includes boundaries', () => {
    expect(inRange('2026-07-01', range)).toBe(true);
    expect(inRange('2026-07-11', range)).toBe(true);
  });
  it('excludes outside', () => {
    expect(inRange('2026-06-30', range)).toBe(false);
    expect(inRange('2026-07-12', range)).toBe(false);
  });
  it('empty range always true', () => {
    expect(inRange('1999-01-01', {})).toBe(true);
  });
});
