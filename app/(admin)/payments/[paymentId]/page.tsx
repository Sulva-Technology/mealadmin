'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Flag, RefreshCw, Undo2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatDateTime, formatKobo, titleize } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionAction } from '@/components/admin/Permission';
import {
  CopyButton,
  MoneyPair,
  NotesList,
  RefundMiniTable,
  SettlementImpact,
  SupportLinkGrid,
  Timeline,
  WebhookMiniTable,
} from '@/components/admin/finance/FinanceUI';

export default function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['payment', paymentId], () => api.getPayment(paymentId));

  const [reviewOpen, setReviewOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [note, setNote] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const invalidate = [['payment', paymentId], ['payments'], ['payment-queues']];
  const verify = useApiAction(() => api.verifyPayment(paymentId), {
    invalidate,
    success: 'Payment verification requested.',
  });
  const review = useApiAction(() => api.markPaymentForReview(paymentId, { note: note || undefined }), {
    invalidate,
    success: 'Payment marked for review.',
    onSuccess: () => { setReviewOpen(false); setNote(''); },
  });
  const addNote = useApiAction(() => api.addPaymentNote(paymentId, { note }), {
    invalidate,
    success: 'Internal note added.',
    onSuccess: () => { setNoteOpen(false); setNote(''); },
  });
  const refund = useApiAction((amountKobo: number) => api.createRefundForPayment(paymentId, { amountKobo, reason: refundReason }), {
    invalidate: [['payment', paymentId], ['payments'], ['refunds']],
    success: 'Refund request submitted to backend.',
    onSuccess: () => { setRefundOpen(false); setRefundReason(''); },
  });

  return (
    <>
      <PageHeader title="Payment detail" backHref="/payments" />
      <AsyncBoundary query={query}>
        {(env) => {
          const payment = env.data;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-space font-bold text-ink dark:text-white">{payment.paymentReference}</h2>
                      <p className="text-xs text-muted">{payment.paystackReference ?? 'No Paystack reference'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={payment.paymentStatus} />
                      <StatusBadge status={payment.verificationStatus} />
                      <StatusBadge status={payment.refundStatus} />
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Field label="Payment reference">{payment.paymentReference}</Field>
                    <Field label="Paystack reference">{payment.paystackReference ?? 'Not returned'}</Field>
                    <Field label="Order"><Link className="text-primary hover:underline" href={`/orders/${payment.orderId}`}>{payment.orderNumber ?? payment.orderId}</Link></Field>
                    <Field label="Customer"><Link className="text-primary hover:underline" href={`/users/${payment.customerId}`}>{payment.customer?.email ?? payment.customerName ?? payment.customerId}</Link></Field>
                    <Field label="Vendor"><Link className="text-primary hover:underline" href={`/vendors/${payment.vendorId}`}>{payment.vendor?.displayName ?? payment.vendorDisplayName}</Link></Field>
                    <Field label="Campus">{payment.campusName ?? campusName(payment.campusId)}</Field>
                    <Field label="Rider/delivery">{payment.riderDelivery?.riderName ?? payment.riderDelivery?.status ?? 'Not returned'}</Field>
                    <Field label="Amounts"><MoneyPair expected={payment.amountExpectedKobo} paid={payment.amountPaidKobo} currency={payment.currency} /></Field>
                    <Field label="Webhook received">{payment.webhookReceived ? 'Yes' : 'No'}</Field>
                    <Field label="Requires admin review">{payment.requiresAdminReview ? 'Yes' : 'No'}</Field>
                    <Field label="Created">{formatDateTime(payment.createdAt)}</Field>
                    <Field label="Updated">{formatDateTime(payment.updatedAt)}</Field>
                  </dl>
                </Card>

                <Card className="p-6 h-fit">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                  <div className="space-y-3">
                    <PermissionAction className="w-full" action="payment.verify" loading={verify.isPending} onClick={() => verify.mutate()}>
                      <RefreshCw className="w-4 h-4" /> Verify with Paystack
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="outline" action="payment.review" onClick={() => setReviewOpen(true)}>
                      <Flag className="w-4 h-4" /> Mark for review
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="danger" action="refund.initiate" disabled={!['paid', 'partially_refunded'].includes(String(payment.paymentStatus))} onClick={() => setRefundOpen(true)}>
                      <Undo2 className="w-4 h-4" /> Initiate refund
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="subtle" action="support.note" onClick={() => setNoteOpen(true)}>
                      Add internal note
                    </PermissionAction>
                  </div>
                </Card>
              </div>

              <SupportLinkGrid payment={payment} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Order summary</h3>
                  <dl>
                    <Field label="Order status">{payment.orderSummary?.status ?? payment.orderStatus}</Field>
                    <Field label="Order total">{formatKobo(payment.orderSummary?.totalKobo ?? payment.amountExpectedKobo)}</Field>
                    <Field label="Order created">{formatDateTime(payment.orderSummary?.createdAt)}</Field>
                  </dl>
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Amount breakdown</h3>
                  {payment.amountBreakdown ? (
                    <dl>
                      {Object.entries(payment.amountBreakdown).map(([key, value]) => (
                        <Field key={key} label={titleize(key)}>{typeof value === 'number' ? formatKobo(value) : String(value ?? 'Not returned')}</Field>
                      ))}
                    </dl>
                  ) : <p className="text-sm text-muted">No amount breakdown returned by backend.</p>}
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Paystack verification result</h3>
                  <pre className="text-xs whitespace-pre-wrap break-words rounded-xl bg-canvas dark:bg-ink/50 p-3">{JSON.stringify(payment.paystackVerification ?? {}, null, 2)}</pre>
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Webhook event history</h3>
                  <WebhookMiniTable events={payment.webhookEvents} />
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Refund history</h3>
                  <RefundMiniTable refunds={payment.refundHistory} />
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Admin notes</h3>
                  <NotesList notes={payment.adminNotes} />
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Admin action history</h3>
                  <Timeline events={payment.adminActions} />
                </Card>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Payment/order timeline</h3>
                  <Timeline events={payment.timeline} />
                </Card>
              </div>

              <SettlementImpact impact={payment.settlementImpact} />

              <Modal
                open={reviewOpen}
                onClose={() => setReviewOpen(false)}
                title="Mark payment for review"
                footer={<>
                  <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
                  <PermissionAction action="payment.review" loading={review.isPending} onClick={() => review.mutate()}>Mark for review</PermissionAction>
                </>}
              >
                <TextArea label="Internal note" value={note} onChange={(e) => setNote(e.target.value)} />
              </Modal>

              <Modal
                open={noteOpen}
                onClose={() => setNoteOpen(false)}
                title="Add internal note"
                footer={<>
                  <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
                  <PermissionAction action="support.note" loading={addNote.isPending} disabled={!note.trim()} onClick={() => addNote.mutate()}>Add internal note</PermissionAction>
                </>}
              >
                <TextArea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              </Modal>

              <Modal
                open={refundOpen}
                onClose={() => setRefundOpen(false)}
                title="Initiate refund"
                footer={<>
                  <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
                  <PermissionAction action="refund.initiate" variant="danger" loading={refund.isPending} disabled={!refundReason.trim()} onClick={() => refund.mutate(payment.amountPaidKobo)}>
                    Initiate refund
                  </PermissionAction>
                </>}
              >
                <div className="space-y-4">
                  <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
                    Refund amount: {formatKobo(payment.amountPaidKobo)}. Vendor settlement may be affected. Backend must enforce eligibility and idempotency.
                  </div>
                  <TextArea label="Refund reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
                </div>
              </Modal>
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
