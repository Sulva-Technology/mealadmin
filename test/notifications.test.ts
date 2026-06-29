import { describe, expect, it } from 'vitest';
import { getNotificationHref, getUnreadNotificationCount } from '@/lib/notifications';
import type { NotificationRecord } from '@/lib/types';

const notification = (readAt: string | null | undefined): NotificationRecord => ({
  id: crypto.randomUUID(),
  recipientUserId: crypto.randomUUID(),
  eventType: 'order.updated',
  aggregateType: 'order',
  aggregateId: crypto.randomUUID(),
  title: 'Order updated',
  body: 'A meal order changed status.',
  linkPath: null,
  readAt,
  createdAt: '2026-06-29T10:00:00.000Z',
  updatedAt: '2026-06-29T10:00:00.000Z',
});

describe('notification helpers', () => {
  it('counts only unread notifications', () => {
    expect(getUnreadNotificationCount([
      notification(null),
      notification(undefined),
      notification('2026-06-29T10:05:00.000Z'),
    ])).toBe(2);
  });

  it('keeps notification links inside the admin app', () => {
    expect(getNotificationHref('/orders/order-1')).toBe('/orders/order-1');
    expect(getNotificationHref('https://example.com')).toBe('#');
    expect(getNotificationHref(null)).toBe('#');
  });
});
