'use client';

import Link from 'next/link';
import { Bell, Check, CheckCheck, Mail, MonitorCheck, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { formatDateTime, titleize } from '@/lib/format';
import { getNotificationHref, getUnreadNotificationCount } from '@/lib/notifications';
import type { NotificationPreferences } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

const preferenceGroups: Array<{
  title: string;
  description: string;
  icon: typeof Bell;
  keys: Array<keyof Omit<NotificationPreferences, 'userId' | 'updatedAt'>>;
}> = [
  {
    title: 'Channels',
    description: 'Where alerts can be delivered.',
    icon: Smartphone,
    keys: ['inAppEnabled', 'pushEnabled', 'emailEnabled'],
  },
  {
    title: 'Activity',
    description: 'Operational events to include.',
    icon: MonitorCheck,
    keys: ['orderUpdates', 'paymentUpdates', 'deliveryUpdates', 'escalationUpdates', 'settlementUpdates'],
  },
];

function preferenceLabel(key: string) {
  return titleize(key.replace(/Enabled$/, '').replace(/Updates$/, ' updates'));
}

export default function NotificationsPage() {
  const notificationsQuery = useApiQuery(
    ['notifications', { limit: 50 }],
    () => api.getNotifications({ limit: 50 }),
  );
  const preferencesQuery = useApiQuery(
    ['notification-preferences'],
    () => api.getNotificationPreferences(),
  );

  const markRead = useApiAction((id: string) => api.markNotificationRead(id), {
    invalidate: [['notifications', { limit: 50 }]],
    success: 'Notification marked read.',
  });
  const markAllRead = useApiAction(() => api.markAllNotificationsRead(), {
    invalidate: [['notifications', { limit: 50 }]],
    success: 'Notifications marked read.',
  });
  const updatePreference = useApiAction(
    (patch: Partial<NotificationPreferences>) => api.updateNotificationPreferences(patch),
    {
      invalidate: [['notification-preferences']],
      success: 'Notification preferences saved.',
    },
  );

  const unreadCount = getUnreadNotificationCount(notificationsQuery.data?.data ?? []);

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Your admin notification inbox and delivery preferences."
        actions={
          <Button
            variant="outline"
            disabled={unreadCount === 0}
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-0 xl:col-span-2 overflow-hidden">
          <div className="px-6 py-4 border-b border-muted/10 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-space font-bold text-ink dark:text-white">Inbox</h2>
              <p className="text-sm text-muted">{unreadCount} unread from latest 50</p>
            </div>
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <AsyncBoundary
            query={notificationsQuery}
            empty="No notifications yet."
            isEmpty={(env) => env.data.length === 0}
          >
            {(env) => (
              <div className="divide-y divide-muted/10">
                {env.data.map((notification) => {
                  const unread = !notification.readAt;
                  const href = getNotificationHref(notification.linkPath);
                  return (
                    <article key={notification.id} className="px-6 py-4 flex flex-col md:flex-row md:items-start gap-4">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full ${unread ? 'bg-primary' : 'bg-muted/30'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-ink dark:text-white">{notification.title}</h3>
                          {unread ? <StatusBadge status="unread" tone="info" /> : <StatusBadge status="read" tone="neutral" />}
                        </div>
                        <p className="text-sm text-muted mt-1">{notification.body}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span>{formatDateTime(notification.createdAt)}</span>
                          <span>{titleize(notification.eventType)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        {href !== '#' && (
                          <Link href={href} className="text-sm font-medium text-primary hover:text-primary-strong">
                            Open
                          </Link>
                        )}
                        {unread && (
                          <Button
                            size="sm"
                            variant="subtle"
                            loading={markRead.isPending}
                            onClick={() => markRead.mutate(notification.id)}
                          >
                            <Check className="w-4 h-4" /> Read
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </AsyncBoundary>
        </Card>

        <Card className="p-0 h-fit overflow-hidden">
          <div className="px-6 py-4 border-b border-muted/10">
            <h2 className="text-lg font-space font-bold text-ink dark:text-white">Preferences</h2>
            <p className="text-sm text-muted">Choose the alerts this admin account receives.</p>
          </div>
          <AsyncBoundary query={preferencesQuery}>
            {(env) => (
              <div className="p-6 space-y-6">
                {preferenceGroups.map((group) => (
                  <section key={group.title}>
                    <div className="flex items-center gap-2 mb-3">
                      <group.icon className="w-4 h-4 text-primary" />
                      <div>
                        <h3 className="text-sm font-semibold text-ink dark:text-white">{group.title}</h3>
                        <p className="text-xs text-muted">{group.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {group.keys.map((key) => (
                        <label key={key} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-ink dark:text-white">{preferenceLabel(key)}</span>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={Boolean(env.data[key])}
                            disabled={updatePreference.isPending}
                            onChange={(event) => updatePreference.mutate({ [key]: event.target.checked })}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
                <p className="text-xs text-muted flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Last updated {formatDateTime(env.data.updatedAt)}
                </p>
              </div>
            )}
          </AsyncBoundary>
        </Card>
      </div>
    </>
  );
}
