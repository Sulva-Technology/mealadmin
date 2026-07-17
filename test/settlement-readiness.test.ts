import { describe, expect, it } from 'vitest';
import { assessSettlementReadiness } from '@/lib/settlement-readiness';
import type { OrderListItem, OrderStatus } from '@/lib/types';

function order(orderStatus: OrderStatus, totalKobo: number): OrderListItem {
  return {
    id: `o-${orderStatus}-${totalKobo}`,
    orderNumber: 'MD-1',
    customerId: 'cust',
    campusId: 'c1',
    vendorId: 'v1',
    vendorDisplayName: 'V',
    serviceDate: '2026-07-14',
    deliverySlotId: null,
    locationId: null,
    orderStatus,
    deliveryMode: 'rider_delivery',
    totalKobo,
    currency: 'NGN',
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-07-14T09:00:00Z',
  };
}

describe('assessSettlementReadiness', () => {
  it('splits settleable from awaiting and sums awaiting money', () => {
    const r = assessSettlementReadiness([
      order('delivered', 100000),
      order('confirmed', 50000),
      order('administratively_completed', 25000),
      order('refunded', 10000),
      order('paid', 200000),
      order('ready', 300000),
      order('out_for_delivery', 40000),
    ]);
    expect(r.settleable).toHaveLength(4);
    expect(r.awaiting).toHaveLength(3);
    expect(r.awaitingTotalKobo).toBe(540000);
  });

  it('ignores orders with no settled money either way', () => {
    const r = assessSettlementReadiness([
      order('pending_payment', 99999),
      order('cancelled', 99999),
      order('expired', 99999),
    ]);
    expect(r.settleable).toHaveLength(0);
    expect(r.awaiting).toHaveLength(0);
    expect(r.awaitingTotalKobo).toBe(0);
  });

  it('covers the July 14 incident shape: mostly ready, few delivered', () => {
    const r = assessSettlementReadiness([
      ...Array.from({ length: 11 }, (_, i) => order('ready', 200000 + i)),
      order('out_for_delivery', 294200),
      order('delivered', 190000),
      order('delivered', 180000),
    ]);
    expect(r.settleable).toHaveLength(2);
    expect(r.awaiting).toHaveLength(12);
  });
});
