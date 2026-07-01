import type { NotificationRecord } from '@/lib/types';

export function getUnreadNotificationCount(notifications: NotificationRecord[]): number {
  return notifications.filter((notification) => !notification.readAt).length;
}

export function getNotificationHref(linkPath?: string | null): string {
  if (!linkPath?.startsWith('/')) return '#';
  if (linkPath.startsWith('//')) return '#';
  return linkPath;
}
