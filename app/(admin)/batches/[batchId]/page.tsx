'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo, formatDate, formatDateTime, titleize } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Inputs';

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { campusName, scopeCampusId } = useSession();
  const query = useApiQuery(['batch', batchId], () => api.getBatch(batchId));
  const batch = query.data?.data;

  // Read-only chat oversight (newest-first from API → flip to chronological).
  const chatQ = useApiQuery(['batch-chat', batchId], () => api.getBatchChat(batchId, { limit: 100 }));
  const chatMessages = [...(chatQ.data?.data ?? [])].reverse();

  // Verified riders for the batch's campus, for the assignment selector.
  const ridersQ = useApiQuery(
    ['riders', 'verified', batch?.campusId],
    () => api.getRiders({ campusId: batch?.campusId, status: 'verified', limit: 100 }),
    !!batch,
  );
  const riders = ridersQ.data?.data ?? [];

  const [assignOpen, setAssignOpen] = useState(false);
  const [reassign, setReassign] = useState(false);
  const [riderId, setRiderId] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');

  const invalidate = [['batch', batchId], ['batches']];
  const doAssign = useApiAction(
    () => (reassign ? api.reassignRider(batchId, riderId) : api.assignRider(batchId, riderId)),
    { invalidate, success: 'Rider assigned.', onSuccess: () => setAssignOpen(false) },
  );
  const doVendorDelivery = useApiAction(() => api.assignVendorDelivery(batchId, batch!.vendorId), {
    invalidate, success: 'Vendor self-delivery assigned.', onSuccess: () => setVendorOpen(false),
  });
  const doClose = useApiAction(() => api.closeBatch(batchId), {
    invalidate, success: 'Batch closed.', onSuccess: () => setCloseOpen(false),
  });
  const doCancelAssign = useApiAction(() => api.cancelBatchAssignment(batchId), {
    invalidate, success: 'Assignment cancelled.', onSuccess: () => setCancelOpen(false),
  });
  const doSendChat = useApiAction(() => api.sendBatchChat(batchId, chatDraft.trim()), {
    invalidate: [['batch-chat', batchId]],
    success: 'Message sent to the batch.',
    onSuccess: () => setChatDraft(''),
  });

  const openAssign = (re: boolean) => { setReassign(re); setRiderId(''); setAssignOpen(true); };

  return (
    <>
      <PageHeader title="Batch Detail" backHref="/batches" />
      <AsyncBoundary query={query}>
        {(env) => {
          const b = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{b.batchNumber}</h2>
                    <p className="text-xs text-muted font-mono">{b.id}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Vendor">{b.vendorDisplayName}</Field>
                  <Field label="Campus">{campusName(b.campusId)}</Field>
                  <Field label="Service Date">{formatDate(b.serviceDate)}</Field>
                  <Field label="Delivery Mode">{titleize(b.deliveryMode)}</Field>
                  <Field label="Orders">{b.orderCount}</Field>
                  <Field label="Delivery Earnings">{formatKobo(b.deliveryEarningsKobo)}</Field>
                  <Field label="Assigned Rider">{b.riderId ?? '—'}</Field>
                  <Field label="Assignment Status">{b.assignmentStatus ? <StatusBadge status={b.assignmentStatus} /> : '—'}</Field>
                  <Field label="Created">{formatDateTime(b.createdAt)}</Field>
                  <Field label="Updated">{formatDateTime(b.updatedAt)}</Field>
                </dl>

                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mt-6 mb-3">Orders</h3>
                {b.orders && b.orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted uppercase tracking-wider">
                          <th className="py-2 pr-4 font-semibold">Order</th>
                          <th className="py-2 pr-4 font-semibold">Location</th>
                          <th className="py-2 pr-4 font-semibold">Room</th>
                          <th className="py-2 pr-4 font-semibold">Status</th>
                          <th className="py-2 pr-0 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.orders.map((o) => (
                          <tr key={o.id} className="border-t border-muted/20">
                            <td className="py-2 pr-4 font-mono text-xs">
                              <a href={`/orders/${o.id}`} className="hover:underline">{o.orderNumber}</a>
                            </td>
                            <td className="py-2 pr-4">{o.locationName}</td>
                            <td className="py-2 pr-4 font-semibold text-ink dark:text-white">{o.roomNumber ?? '—'}</td>
                            <td className="py-2 pr-4"><StatusBadge status={o.orderStatus} /></td>
                            <td className="py-2 pr-0 text-right">{formatKobo(o.totalKobo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted">No orders in this batch.</p>
                )}
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Dispatch</h3>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => openAssign(false)}>Assign Rider</Button>
                  <Button className="w-full" variant="outline" onClick={() => openAssign(true)}>Reassign Rider</Button>
                  <Button className="w-full" variant="outline" onClick={() => setVendorOpen(true)}>Vendor Self-Delivery</Button>
                  <Button className="w-full" variant="subtle" onClick={() => setCancelOpen(true)}>Cancel Assignment</Button>
                  <Button className="w-full" variant="danger" onClick={() => setCloseOpen(true)}>Close Batch</Button>
                </div>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Batch Chat (oversight)</h3>
          <button
            onClick={() => chatQ.refetch()}
            className="text-xs text-muted hover:text-ink dark:hover:text-white"
          >
            Refresh
          </button>
        </div>
        {chatMessages.length === 0 ? (
          <p className="text-sm text-muted">No messages in this batch chat.</p>
        ) : (
          <div className="space-y-3 max-h-[28rem] overflow-y-auto">
            {chatMessages.map((m) => (
              <div key={m.id} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-ink dark:text-white">{m.senderLabel}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted">{m.senderRole}</span>
                  <span className="text-[10px] text-muted ml-auto font-mono">{formatDateTime(m.createdAt)}</span>
                </div>
                <p className="text-sm text-ink/90 dark:text-white/90 whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-end gap-2 border-t border-muted/20 pt-4">
          <textarea
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value.slice(0, 2000))}
            rows={2}
            placeholder="Message the batch as Support…"
            className="flex-1 resize-none rounded-lg border border-muted/30 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <Button
            loading={doSendChat.isPending}
            disabled={chatDraft.trim().length === 0}
            onClick={() => doSendChat.mutate()}
          >
            Send
          </Button>
        </div>
        <p className="text-[10px] text-muted mt-3">
          You post as “Support” — everyone on the batch is notified. Customers appear pseudonymously (Customer N).
        </p>
      </Card>

      <Modal
        open={assignOpen} onClose={() => setAssignOpen(false)}
        title={reassign ? 'Reassign Rider' : 'Assign Rider'}
        footer={<>
          <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button loading={doAssign.isPending} disabled={!riderId} onClick={() => doAssign.mutate()}>Confirm</Button>
        </>}
      >
        <Select label="Rider" value={riderId} onChange={(e) => setRiderId(e.target.value)}>
          <option value="" disabled>Select a verified rider</option>
          {riders.map((r) => <option key={r.id} value={r.id}>{r.displayName} · {r.phone ?? r.id.slice(0, 8)}</option>)}
        </Select>
        {riders.length === 0 && <p className="text-xs text-warning mt-2">No verified riders for this campus.</p>}
      </Modal>

      <ConfirmDialog
        open={vendorOpen} onClose={() => setVendorOpen(false)} onConfirm={() => doVendorDelivery.mutate()}
        loading={doVendorDelivery.isPending} confirmLabel="Assign"
        title="Vendor Self-Delivery" message="Assign this batch to the vendor for self-delivery?"
      />
      <ConfirmDialog
        open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => doCancelAssign.mutate()}
        loading={doCancelAssign.isPending} danger confirmLabel="Cancel Assignment"
        title="Cancel Assignment" message="Remove the current rider/vendor assignment from this batch?"
      />
      <ConfirmDialog
        open={closeOpen} onClose={() => setCloseOpen(false)} onConfirm={() => doClose.mutate()}
        loading={doClose.isPending} danger confirmLabel="Close Batch"
        title="Close Batch" message="Closing a batch stops further changes. Continue?"
      />
    </>
  );
}
