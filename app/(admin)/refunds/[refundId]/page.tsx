'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { formatDateTime, formatKobo } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionAction } from '@/components/admin/Permission';
import { NotesList, SettlementImpact, Timeline } from '@/components/admin/finance/FinanceUI';

export default function RefundDetailPage() {
  const { refundId } = useParams<{ refundId: string }>();
  const query = useApiQuery(['refund', refundId], () => api.getRefund(refundId));
  const [action, setAction] = useState<'approve' | 'reject' | 'initiate' | 'retry' | 'resolve' | 'note' | null>(null);
  const [text, setText] = useState('');

  const invalidate = [['refund', refundId], ['refunds'], ['payments']];
  const approve = useApiAction(() => api.approveRefund(refundId, { note: text || undefined }), {
    invalidate,
    success: 'Refund approved.',
    onSuccess: () => { setAction(null); setText(''); },
  });
  const reject = useApiAction(() => api.rejectRefund(refundId, { reason: text }), {
    invalidate,
    success: 'Refund rejected.',
    onSuccess: () => { setAction(null); setText(''); },
  });
  const initiate = useApiAction((amountKobo: number) => api.initiateRefund(refundId, { amountKobo, reason: text }), {
    invalidate,
    success: 'Refund initiation requested.',
    onSuccess: () => { setAction(null); setText(''); },
  });
  const retry = useApiAction(() => api.retryRefund(refundId), {
    invalidate,
    success: 'Refund retry requested.',
    onSuccess: () => setAction(null),
  });
  const resolve = useApiAction(() => api.markRefundManuallyResolved(refundId, { note: text }), {
    invalidate,
    success: 'Refund marked manually resolved.',
    onSuccess: () => { setAction(null); setText(''); },
  });
  const note = useApiAction(() => api.addRefundNote(refundId, { note: text }), {
    invalidate,
    success: 'Internal note added.',
    onSuccess: () => { setAction(null); setText(''); },
  });

  return (
    <>
      <PageHeader title="Refund detail" backHref="/refunds" />
      <AsyncBoundary query={query}>
        {(env) => {
          const refund = env.data;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-space font-bold text-ink dark:text-white">{refund.id}</h2>
                      <p className="text-xs text-muted">{refund.paymentReference}</p>
                    </div>
                    <StatusBadge status={refund.status} />
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Field label="Original payment">
                      {refund.paymentId ? <Link className="text-primary hover:underline" href={`/payments/${refund.paymentId}`}>{refund.paymentReference}</Link> : refund.paymentReference}
                    </Field>
                    <Field label="Order"><Link className="text-primary hover:underline" href={`/orders/${refund.orderId}`}>{refund.orderSummary?.orderNumber ?? refund.orderId}</Link></Field>
                    <Field label="Customer">{refund.customerName ?? refund.customerEmail ?? 'Unknown customer'}</Field>
                    <Field label="Vendor">{refund.vendorDisplayName}</Field>
                    <Field label="Refund amount">{formatKobo(refund.amountKobo)}</Field>
                    <Field label="Eligibility">{refund.eligibilityState}</Field>
                    <Field label="Customer reason">{refund.customerReason ?? refund.reason}</Field>
                    <Field label="Paystack refund status">{refund.paystackRefundStatus ?? 'Not returned'}</Field>
                    <Field label="Requested">{formatDateTime(refund.requestedAt)}</Field>
                    <Field label="Processed">{formatDateTime(refund.processedAt)}</Field>
                  </dl>
                </Card>

                <Card className="p-6 h-fit">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                  <div className="space-y-3">
                    <PermissionAction className="w-full" action="refund.approve" onClick={() => setAction('approve')}>
                      <CheckCircle2 className="w-4 h-4" /> Approve refund
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="outline" action="refund.reject" onClick={() => setAction('reject')}>
                      <XCircle className="w-4 h-4" /> Reject refund
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="danger" action="refund.initiate" onClick={() => setAction('initiate')}>
                      Initiate refund
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="outline" action="refund.retry" onClick={() => setAction('retry')}>
                      <RotateCcw className="w-4 h-4" /> Retry failed refund
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="subtle" action="refund.resolve" onClick={() => setAction('resolve')}>
                      Mark manually resolved
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="subtle" action="support.note" onClick={() => setAction('note')}>
                      Add internal note
                    </PermissionAction>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Refund timeline</h3>
                  <Timeline events={refund.timeline} />
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Admin notes</h3>
                  <NotesList notes={refund.adminNotes} />
                </Card>
              </div>

              <SettlementImpact impact={refund.settlementImpact} />

              <Modal
                open={!!action}
                onClose={() => setAction(null)}
                title={
                  action === 'approve' ? 'Approve refund'
                  : action === 'reject' ? 'Reject refund'
                  : action === 'initiate' ? 'Initiate refund'
                  : action === 'retry' ? 'Retry failed refund'
                  : action === 'resolve' ? 'Mark manually resolved'
                  : 'Add internal note'
                }
                footer={<>
                  <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
                  {action === 'approve' && <PermissionAction action="refund.approve" loading={approve.isPending} onClick={() => approve.mutate()}>Approve refund</PermissionAction>}
                  {action === 'reject' && <PermissionAction action="refund.reject" variant="danger" loading={reject.isPending} disabled={!text.trim()} onClick={() => reject.mutate()}>Reject refund</PermissionAction>}
                  {action === 'initiate' && <PermissionAction action="refund.initiate" variant="danger" loading={initiate.isPending} disabled={!text.trim()} onClick={() => initiate.mutate(refund.amountKobo)}>Initiate refund</PermissionAction>}
                  {action === 'retry' && <PermissionAction action="refund.retry" loading={retry.isPending} onClick={() => retry.mutate()}>Retry failed refund</PermissionAction>}
                  {action === 'resolve' && <PermissionAction action="refund.resolve" loading={resolve.isPending} disabled={!text.trim()} onClick={() => resolve.mutate()}>Mark manually resolved</PermissionAction>}
                  {action === 'note' && <PermissionAction action="support.note" loading={note.isPending} disabled={!text.trim()} onClick={() => note.mutate()}>Add internal note</PermissionAction>}
                </>}
              >
                <div className="space-y-4">
                  {(action === 'initiate' || action === 'retry' || action === 'resolve') && (
                    <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
                      Refund amount: {formatKobo(refund.amountKobo)}. Vendor settlement may be affected. Backend must reject duplicate or unsafe actions.
                    </div>
                  )}
                  {action !== 'retry' && (
                    <TextArea
                      label={action === 'reject' ? 'Rejection reason' : action === 'note' ? 'Internal note' : 'Admin note / reason'}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  )}
                </div>
              </Modal>
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
