import { describe, expect, it } from 'vitest';
import {
  computePools,
  summarizeSettlements,
  periodRange,
  inRange,
  estimatePaystackFeeKobo,
  sumPaidCollected,
  sumProcessedRefunds,
  groupByBeneficiary,
} from '@/lib/finance';
import type { SettlementListItem, PaymentListItem, RefundListItem } from '@/lib/types';

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

function payment(over: Partial<PaymentListItem>): PaymentListItem {
  return {
    id: 'p1',
    paymentReference: 'ref',
    paystackReference: null,
    orderId: 'o1',
    customerId: 'cust',
    customerName: null,
    customerEmail: null,
    customerPhone: null,
    vendorId: 'v1',
    vendorDisplayName: 'V',
    campusId: 'c1',
    amountExpectedKobo: 0,
    amountPaidKobo: 0,
    currency: 'NGN',
    paymentStatus: 'paid',
    ...over,
  } as PaymentListItem;
}

function refund(over: Partial<RefundListItem>): RefundListItem {
  return {
    id: 'r1',
    orderId: 'o1',
    paymentReference: 'ref',
    customerName: null,
    customerEmail: null,
    vendorDisplayName: 'V',
    amountKobo: 0,
    currency: 'NGN',
    reason: 'x',
    status: 'processed',
    requestedAt: '2026-07-05T00:00:00Z',
    processedAt: '2026-07-05T00:00:00Z',
    adminActionRequired: false,
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

  it('subtracts refunds and an estimated fee for the net figure', () => {
    // collected 300000 (₦3,000), refunds 10000, vendor 50000, rider 7500
    const pools = computePools(vendor, rider, 300000, 10000);
    expect(pools.platform.refundsKobo).toBe(10000);
    expect(pools.platform.grossKobo).toBe(232500); // 300000 − 10000 − 50000 − 7500
    // fee on 300000: 1.5% (4500) + ₦100 flat (10000) = 14500 (above waiver threshold)
    expect(pools.platform.estFeeKobo).toBe(14500);
    expect(pools.platform.netEstKobo).toBe(218000); // 232500 − 14500
  });
});

describe('estimatePaystackFeeKobo', () => {
  it('is zero for zero or negative input', () => {
    expect(estimatePaystackFeeKobo(0)).toBe(0);
    expect(estimatePaystackFeeKobo(-500)).toBe(0);
  });

  it('waives the ₦100 flat below ₦2,500', () => {
    // ₦2,000 → 1.5% = ₦30, no flat
    expect(estimatePaystackFeeKobo(200000)).toBe(3000);
  });

  it('adds the ₦100 flat at or above ₦2,500', () => {
    // ₦2,500 → 1.5% (₦37.50 = 3750 kobo) + ₦100 (10000) = 13750
    expect(estimatePaystackFeeKobo(250000)).toBe(13750);
  });

  it('caps the fee at ₦2,000', () => {
    // ₦1,000,000 → 1.5% = ₦15,000 + ₦100, capped to ₦2,000
    expect(estimatePaystackFeeKobo(100000000)).toBe(200000);
  });
});

describe('sumPaidCollected', () => {
  it('counts paid and partially_refunded, ignores everything else', () => {
    const total = sumPaidCollected([
      payment({ paymentStatus: 'paid', amountPaidKobo: 10000 }),
      payment({ paymentStatus: 'partially_refunded', amountPaidKobo: 5000 }),
      payment({ paymentStatus: 'pending', amountPaidKobo: 9999 }),
      payment({ paymentStatus: 'failed', amountPaidKobo: 9999 }),
      payment({ paymentStatus: 'abandoned', amountPaidKobo: 9999 }),
      payment({ paymentStatus: 'refunded', amountPaidKobo: 9999 }),
    ]);
    expect(total).toBe(15000);
  });
});

describe('sumProcessedRefunds', () => {
  const range = { dateFrom: '2026-07-01', dateTo: '2026-07-11' };

  it('sums only processed refunds with processedAt in range', () => {
    const total = sumProcessedRefunds([
      refund({ status: 'processed', amountKobo: 1000, processedAt: '2026-07-05T10:00:00Z' }),
      refund({ status: 'processed', amountKobo: 2000, processedAt: '2026-07-11T23:00:00Z' }),
      refund({ status: 'processed', amountKobo: 4000, processedAt: '2026-06-30T10:00:00Z' }), // out of range
      refund({ status: 'processing', amountKobo: 8000, processedAt: '2026-07-05T10:00:00Z' }), // not processed
      refund({ status: 'processed', amountKobo: 8000, processedAt: null }), // never left
    ], range);
    expect(total).toBe(3000);
  });
});

describe('groupByBeneficiary', () => {
  it('sums per beneficiary, excludes cancelled, sorts desc', () => {
    const rows = groupByBeneficiary([
      settlement({ vendorId: 'v1', payableKobo: 1000 }),
      settlement({ vendorId: 'v1', payableKobo: 500 }),
      settlement({ vendorId: 'v2', payableKobo: 3000 }),
      settlement({ vendorId: 'v2', status: 'cancelled', payableKobo: 9999 }),
      settlement({ vendorId: null, payableKobo: 100 }),
    ], 'vendor');
    expect(rows).toEqual([
      { id: 'v2', totalKobo: 3000 },
      { id: 'v1', totalKobo: 1500 },
    ]);
  });

  it('reads riderId when grouping riders', () => {
    const rows = groupByBeneficiary([
      settlement({ riderId: 'r1', payableKobo: 700 }),
      settlement({ vendorId: 'v1', payableKobo: 9999 }), // no riderId → skipped
    ], 'rider');
    expect(rows).toEqual([{ id: 'r1', totalKobo: 700 }]);
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
