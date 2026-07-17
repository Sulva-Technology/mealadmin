/**
 * Settlement readiness: which of a vendor's orders for a service date will the
 * backend's produce_vendor_daily_settlement actually count?
 *
 * The SQL function only sums orders in SETTLEABLE_STATUSES. Orders that are
 * paid but still moving (paid → out_for_delivery) hold real collected money
 * yet contribute ₦0 to the settlement — generating while any exist produces a
 * short payable. The admin remedy is to finish the day: mark stragglers
 * delivered/administratively_completed, then generate.
 */

import { api } from './api';
import type { OrderListItem, OrderStatus } from './types';

/** Statuses produce_vendor_daily_settlement includes in gross food + service fee. */
export const SETTLEABLE_STATUSES: readonly OrderStatus[] = [
  'delivered', 'confirmed', 'administratively_completed', 'refunded',
];

/** Money collected, order not finished — excluded from settlement until transitioned. */
export const AWAITING_TRANSITION_STATUSES: readonly OrderStatus[] = [
  'paid', 'accepted', 'preparing', 'ready', 'out_for_delivery',
];

export interface SettlementReadiness {
  /** Orders the settlement will count. */
  settleable: OrderListItem[];
  /** Paid-but-unfinished orders the settlement will silently exclude. */
  awaiting: OrderListItem[];
  /** Sum of totalKobo across awaiting orders — the money at risk of being missed. */
  awaitingTotalKobo: number;
}

/** Partition a vendor/date's orders by whether the settlement function counts them. */
export function assessSettlementReadiness(orders: OrderListItem[]): SettlementReadiness {
  const settleable: OrderListItem[] = [];
  const awaiting: OrderListItem[] = [];
  let awaitingTotalKobo = 0;
  for (const o of orders) {
    if (SETTLEABLE_STATUSES.includes(o.orderStatus)) settleable.push(o);
    else if (AWAITING_TRANSITION_STATUSES.includes(o.orderStatus)) {
      awaiting.push(o);
      awaitingTotalKobo += o.totalKobo;
    }
    // pending_payment / cancelled / expired: no settled money either way — ignored.
  }
  return { settleable, awaiting, awaitingTotalKobo };
}

const MAX_PAGES = 20;

/** Every order for one vendor on one service date (cursor-walked, bounded). */
export async function fetchVendorOrdersForDate(
  vendorId: string,
  date: string,
): Promise<OrderListItem[]> {
  const out: OrderListItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const env = await api.getOrders({ vendorId, date, limit: 100, cursor });
    out.push(...env.data);
    if (!env.pagination.hasMore || !env.pagination.nextCursor) break;
    cursor = env.pagination.nextCursor;
  }
  return out;
}
