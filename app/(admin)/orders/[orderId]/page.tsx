'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { ORDER_STATUSES } from '@/lib/types';
import { formatKobo, formatDateTime, formatDate, titleize } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, TextArea } from '@/components/ui/Inputs';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['order', orderId], () => api.getOrder(orderId));

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [transOpen, setTransOpen] = useState(false);
  const [target, setTarget] = useState<string>('');
  const [transReason, setTransReason] = useState('');

  const invalidate = [['order', orderId], ['orders']];
  const cancel = useApiAction(() => api.cancelOrder(orderId, cancelReason || undefined), {
    invalidate, success: 'Order cancelled.', onSuccess: () => setCancelOpen(false),
  });
  const transition = useApiAction(() => api.transitionOrder(orderId, target, transReason || undefined), {
    invalidate, success: 'Status updated.', onSuccess: () => setTransOpen(false),
  });

  return (
    <>
      <PageHeader title="Order Investigation" backHref="/orders" />
      <AsyncBoundary query={query}>
        {(env) => {
          const o = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{o.orderNumber}</h2>
                    <p className="text-xs text-muted font-mono">{o.id}</p>
                  </div>
                  <StatusBadge status={o.orderStatus} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Customer">{o.customerEmail ?? o.customerId}</Field>
                  <Field label="Vendor">{o.vendorDisplayName}</Field>
                  <Field label="Campus">{campusName(o.campusId)}</Field>
                  <Field label="Delivery Mode">{titleize(o.deliveryMode)}</Field>
                  <Field label="Service Date">{formatDate(o.serviceDate)}</Field>
                  <Field label="Total">{formatKobo(o.totalKobo)}</Field>
                  <Field label="Created">{formatDateTime(o.createdAt)}</Field>
                  <Field label="Updated">{formatDateTime(o.updatedAt)}</Field>
                </dl>
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => { setTarget(o.orderStatus); setTransOpen(true); }}>
                    Transition Status
                  </Button>
                  <Button className="w-full" variant="danger" onClick={() => setCancelOpen(true)}>
                    Cancel Order
                  </Button>
                </div>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <Modal
        open={transOpen} onClose={() => setTransOpen(false)} title="Transition Order Status"
        footer={<>
          <Button variant="ghost" onClick={() => setTransOpen(false)}>Cancel</Button>
          <Button loading={transition.isPending} disabled={!target} onClick={() => transition.mutate()}>Apply</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Target status" value={target} onChange={(e) => setTarget(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
          </Select>
          <TextArea label="Reason (optional)" maxLength={500} value={transReason} onChange={(e) => setTransReason(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order"
        footer={<>
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>Back</Button>
          <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>Cancel Order</Button>
        </>}
      >
        <TextArea
          label="Reason" maxLength={500} placeholder="Defaults to “Cancelled by admin.”"
          value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
