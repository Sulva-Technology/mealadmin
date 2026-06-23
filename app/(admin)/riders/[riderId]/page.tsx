'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo, formatDate, formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import type { RiderAssignment, SettlementListItem } from '@/lib/types';

const assignCols: Column<RiderAssignment>[] = [
  { header: 'Batch', render: (a) => a.batchNumber },
  { header: 'Vendor', render: (a) => a.vendorDisplayName },
  { header: 'Orders', align: 'right', render: (a) => a.orderCount },
  { header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
  { header: 'Date', align: 'right', render: (a) => formatDate(a.serviceDate) },
];
const settleCols: Column<SettlementListItem>[] = [
  { header: 'Date', render: (s) => formatDate(s.settlementDate) },
  { header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
  { header: 'Payable', align: 'right', render: (s) => formatKobo(s.payableKobo) },
];

export default function RiderDetailPage() {
  const { riderId } = useParams<{ riderId: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['rider', riderId], () => api.getRider(riderId));
  const assignQ = useApiQuery(['rider', riderId, 'assignments'], () => api.getRiderAssignments(riderId));
  const settleQ = useApiQuery(['rider', riderId, 'settlements'], () => api.getRiderSettlements(riderId));
  const rider = query.data?.data;

  const [suspendOpen, setSuspendOpen] = useState(false);
  const invalidate = [['rider', riderId], ['riders']];
  const verify = useApiAction(() => api.verifyRider(riderId), { invalidate, success: 'Rider verified.' });
  const activate = useApiAction(() => api.activateRider(riderId), { invalidate, success: 'Rider activated.' });
  const suspend = useApiAction(() => api.suspendRider(riderId), {
    invalidate, success: 'Rider suspended.', onSuccess: () => setSuspendOpen(false),
  });

  return (
    <>
      <PageHeader title="Rider Detail" backHref="/riders" />
      <AsyncBoundary query={query}>
        {(env) => {
          const r = env.data;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-space font-bold text-ink dark:text-white">{r.displayName}</h2>
                      <p className="text-xs text-muted font-mono">{r.id}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Field label="Phone">{r.phone ?? '—'}</Field>
                    <Field label="Campus">{campusName(r.campusId)}</Field>
                    <Field label="Active">{r.active ? 'Yes' : 'No'}</Field>
                    <Field label="Verified At">{formatDateTime(r.verifiedAt)}</Field>
                    <Field label="User ID">{r.userId}</Field>
                    <Field label="Created">{formatDateTime(r.createdAt)}</Field>
                  </dl>
                </Card>
                <Card className="p-6 h-fit">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                  <div className="space-y-3">
                    {r.status !== 'verified' && (
                      <Button className="w-full" loading={verify.isPending} onClick={() => verify.mutate()}>Verify</Button>
                    )}
                    {r.status === 'suspended' || !r.active ? (
                      <Button className="w-full" loading={activate.isPending} onClick={() => activate.mutate()}>Activate</Button>
                    ) : (
                      <Button className="w-full" variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
                    )}
                  </div>
                </Card>
              </div>

              <Card className="overflow-hidden">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider px-5 pt-5">Recent Assignments</h3>
                <AsyncBoundary query={assignQ} empty="No assignments." isEmpty={(d) => d.data.length === 0}>
                  {(d) => <DataTable columns={assignCols} rows={d.data} rowKey={(a) => a.id} />}
                </AsyncBoundary>
              </Card>

              <Card className="overflow-hidden">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider px-5 pt-5">Settlements</h3>
                <AsyncBoundary query={settleQ} empty="No settlements." isEmpty={(d) => d.data.length === 0}>
                  {(d) => <DataTable columns={settleCols} rows={d.data} rowKey={(s) => s.id} rowHref={(s) => `/settlements/${s.id}`} />}
                </AsyncBoundary>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <ConfirmDialog
        open={suspendOpen} onClose={() => setSuspendOpen(false)} onConfirm={() => suspend.mutate()}
        loading={suspend.isPending} danger confirmLabel="Suspend"
        title="Suspend Rider" message="Suspended riders cannot accept deliveries. Continue?"
      />
    </>
  );
}
