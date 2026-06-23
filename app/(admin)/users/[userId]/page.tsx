'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { isSuperAdmin, campusName } = useSession();
  const query = useApiQuery(['user', userId], () => api.getUser(userId));
  const user = query.data?.data;

  const [suspendOpen, setSuspendOpen] = useState(false);
  const invalidate = [['user', userId], ['users']];
  const suspend = useApiAction(() => api.suspendUser(userId), {
    invalidate, success: 'User suspended.', onSuccess: () => setSuspendOpen(false),
  });
  const activate = useApiAction(() => api.activateUser(userId), { invalidate, success: 'User activated.' });

  return (
    <>
      <PageHeader title="User Account" backHref="/users" />
      <AsyncBoundary query={query}>
        {(env) => {
          const u = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{u.displayName}</h2>
                    <p className="text-xs text-muted font-mono">{u.id}</p>
                  </div>
                  <StatusBadge status={u.accountStatus} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Email">{u.email ?? '—'}</Field>
                  <Field label="Phone">{u.phoneNumber ?? '—'}</Field>
                  <Field label="Default Campus">{campusName(u.defaultCampusId)}</Field>
                  <Field label="Created">{formatDateTime(u.createdAt)}</Field>
                </dl>
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                {isSuperAdmin ? (
                  <div className="space-y-3">
                    {u.accountStatus === 'active' ? (
                      <Button className="w-full" variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
                    ) : (
                      <Button className="w-full" loading={activate.isPending} onClick={() => activate.mutate()}>Activate</Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Account status changes require a super admin.</p>
                )}
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <ConfirmDialog
        open={suspendOpen} onClose={() => setSuspendOpen(false)} onConfirm={() => suspend.mutate()}
        loading={suspend.isPending} danger confirmLabel="Suspend"
        title="Suspend User" message="Suspended users cannot place orders. Continue?"
      />
    </>
  );
}
