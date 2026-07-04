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
import { PermissionAction } from '@/components/admin/Permission';
import { CopyButton } from '@/components/admin/finance/FinanceUI';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['order', orderId], () => api.getOrder(orderId));

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [transOpen, setTransOpen] = useState(false);
  const [target, setTarget] = useState<string>('');
  const [transReason, setTransReason] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [supportNote, setSupportNote] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const invalidate = [['order', orderId], ['orders']];
  const cancel = useApiAction(() => api.cancelOrder(orderId, cancelReason || undefined), {
    invalidate, success: 'Order cancelled.', onSuccess: () => setCancelOpen(false),
  });
  const transition = useApiAction(() => api.transitionOrder(orderId, target, transReason || undefined), {
    invalidate, success: 'Status updated.', onSuccess: () => setTransOpen(false),
  });
  const addNote = useApiAction(() => api.addOrderNote(orderId, { note: supportNote }), {
    invalidate, success: 'Internal note added.', onSuccess: () => { setNoteOpen(false); setSupportNote(''); },
  });
  const escalate = useApiAction(() => api.escalateOrder(orderId, { reason: escalateReason }), {
    invalidate, success: 'Issue escalated.', onSuccess: () => { setEscalateOpen(false); setEscalateReason(''); },
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
                  <Field label="Customer phone">{o.customerPhone ?? 'Not returned'}</Field>
                  <Field label="Vendor">{o.vendorDisplayName}</Field>
                  <Field label="Campus">{campusName(o.campusId)}</Field>
                  <Field label="Payment reference">{o.paymentReference ?? 'Not returned'}</Field>
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
                  <CopyButton value={o.id} label="Copy order ID" />
                  <CopyButton value={o.paymentReference} label="Copy payment reference" />
                  <CopyButton value={o.customerEmail ?? o.customerPhone} label="Copy customer contact" />
                  <Button className="w-full" variant="outline" onClick={() => { window.location.href = `/users/${o.customerId}`; }}>
                    Open customer order history
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => { window.location.href = `/payments?search=${encodeURIComponent(o.paymentReference ?? o.id)}`; }}>
                    Open payment history
                  </Button>
                  <PermissionAction className="w-full" variant="subtle" action="support.note" onClick={() => setNoteOpen(true)}>
                    Add internal note
                  </PermissionAction>
                  <PermissionAction className="w-full" variant="subtle" action="support.escalate" onClick={() => setEscalateOpen(true)}>
                    Escalate issue
                  </PermissionAction>
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
          <PermissionAction action="order.transition" loading={transition.isPending} disabled={!target} onClick={() => transition.mutate()}>Transition order status</PermissionAction>
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
          <PermissionAction action="order.cancel" variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>Cancel order</PermissionAction>
        </>}
      >
        <TextArea
          label="Reason" maxLength={500} placeholder="Defaults to “Cancelled by admin.”"
          value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>

      <Modal
        open={noteOpen} onClose={() => setNoteOpen(false)} title="Add internal note"
        footer={<>
          <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
          <PermissionAction action="support.note" loading={addNote.isPending} disabled={!supportNote.trim()} onClick={() => addNote.mutate()}>Add internal note</PermissionAction>
        </>}
      >
        <TextArea label="Internal note" maxLength={500} value={supportNote} onChange={(e) => setSupportNote(e.target.value)} />
      </Modal>

      <Modal
        open={escalateOpen} onClose={() => setEscalateOpen(false)} title="Escalate issue"
        footer={<>
          <Button variant="ghost" onClick={() => setEscalateOpen(false)}>Cancel</Button>
          <PermissionAction action="support.escalate" loading={escalate.isPending} disabled={!escalateReason.trim()} onClick={() => escalate.mutate()}>Escalate issue</PermissionAction>
        </>}
      >
        <TextArea label="Escalation reason" maxLength={500} value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} />
      </Modal>
    </>
  );
}
