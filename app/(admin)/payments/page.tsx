'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Flag, RefreshCw, Undo2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery, useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import {
  PAYMENT_STATUSES,
  REFUND_STATUSES,
  type PaymentListItem,
  type PaymentQueueItem,
} from '@/lib/types';
import { formatDateTime, formatKobo, titleize } from '@/lib/format';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterSelect, SearchInput, TextArea, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { PermissionAction } from '@/components/admin/Permission';
import { CustomerCell, MoneyPair, PaymentIdentity } from '@/components/admin/finance/FinanceUI';
import type { Column } from '@/components/ui/DataTable';

const queueCards: { key: string; label: string }[] = [
  { key: 'paid_order_pending', label: 'Paid but order pending' },
  { key: 'pending_over_10_minutes', label: 'Pending over 10 minutes' },
  { key: 'pending_over_30_minutes', label: 'Pending over 30 minutes' },
  { key: 'failed_payments', label: 'Failed payments' },
  { key: 'webhook_failed', label: 'Webhook failed' },
  { key: 'webhook_not_received', label: 'Webhook not received' },
  { key: 'amount_mismatch', label: 'Amount mismatch' },
  { key: 'duplicate_payment_suspicion', label: 'Duplicate payment suspicion' },
  { key: 'refund_stuck', label: 'Refund stuck' },
  { key: 'requires_finance_review', label: 'Requires finance review' },
];

function age(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function QueuePreview() {
  const [queue, setQueue] = useState(queueCards[0].key);
  const query = useApiQuery(['payment-queues', queue], () => api.getPaymentQueues({ queue, limit: 8 }));
  const verify = useApiAction((id: string) => api.verifyPayment(id), {
    invalidate: [['payment-queues'], ['payments']],
    success: 'Payment verification requested.',
  });
  const review = useApiAction((id: string) => api.markPaymentQueueReviewed(id, { note: 'Reviewed from payment queue.' }), {
    invalidate: [['payment-queues'], ['payments']],
    success: 'Queue item marked as reviewed.',
  });

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-space font-bold text-ink dark:text-white">Payment problem queues</h2>
          <p className="text-sm text-muted">Finance and support triage for reconciliation issues.</p>
        </div>
        <FilterSelect value={queue} onChange={(e) => setQueue(e.target.value)}>
          {queueCards.map((card) => <option key={card.key} value={card.key}>{card.label}</option>)}
        </FilterSelect>
      </div>
      <AsyncBoundary query={query} empty="No issues in this queue." isEmpty={(d) => d.data.length === 0}>
        {(env) => (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {env.data.map((item: PaymentQueueItem) => (
              <div key={item.id} className="rounded-2xl bg-canvas dark:bg-ink/50 p-4 border border-muted/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.severity} tone={item.severity === 'critical' || item.severity === 'high' ? 'danger' : 'warning'} />
                      <span className="text-xs text-muted">{age(item.issueAgeSeconds)} old</span>
                    </div>
                    <p className="font-semibold text-ink dark:text-white mt-2">{item.paymentReference}</p>
                    <p className="text-xs text-muted">{item.orderId} - {item.customerName ?? item.customerEmail ?? 'Unknown customer'}</p>
                    <p className="text-sm text-muted mt-2">{item.suggestedAction}</p>
                  </div>
                  <p className="font-bold">{formatKobo(item.amountKobo)}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <PermissionAction size="sm" variant="outline" action="payment.verify" disabled={!item.paymentId} loading={verify.isPending} onClick={() => item.paymentId && verify.mutate(item.paymentId)}>
                    <RefreshCw className="w-4 h-4" /> Verify with Paystack
                  </PermissionAction>
                  {item.paymentId && (
                    <Link className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-surface font-medium" href={`/payments/${item.paymentId}`}>
                      <Eye className="w-4 h-4" /> Open detail
                    </Link>
                  )}
                  <PermissionAction size="sm" variant="subtle" action="payment.review" loading={review.isPending} onClick={() => review.mutate(item.id)}>
                    <Flag className="w-4 h-4" /> Mark as reviewed
                  </PermissionAction>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncBoundary>
    </Card>
  );
}

export default function PaymentsPage() {
  const { scopeCampusId, campuses } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [refundStatus, setRefundStatus] = useState('');
  const [vendor, setVendor] = useState('');
  const [campus, setCampus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [webhookReceived, setWebhookReceived] = useState('');
  const [requiresReview, setRequiresReview] = useState('');
  const [reviewPayment, setReviewPayment] = useState<PaymentListItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [refundPayment, setRefundPayment] = useState<PaymentListItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const debounced = useDebounced(search);

  const verify = useApiAction((id: string) => api.verifyPayment(id), {
    invalidate: [['payments'], ['payment-queues']],
    success: 'Payment verification requested.',
  });
  const review = useApiAction(() => api.markPaymentForReview(reviewPayment!.id, { note: reviewNote || undefined }), {
    invalidate: [['payments'], ['payment-queues']],
    success: 'Payment marked for review.',
    onSuccess: () => { setReviewPayment(null); setReviewNote(''); },
  });
  const refund = useApiAction(() => api.createRefundForPayment(refundPayment!.id, {
    amountKobo: refundPayment!.amountPaidKobo,
    reason: refundReason,
  }), {
    invalidate: [['payments'], ['refunds']],
    success: 'Refund request submitted to backend.',
    onSuccess: () => { setRefundPayment(null); setRefundReason(''); },
  });

  const columns: Column<PaymentListItem>[] = [
    { header: 'Payment', render: (p) => <PaymentIdentity payment={p} /> },
    {
      header: 'Order',
      render: (p) => (
        <div>
          <div className="font-medium text-ink dark:text-white">{p.orderNumber ?? p.orderId}</div>
          <div className="font-mono text-xs text-muted">{p.orderId}</div>
        </div>
      ),
    },
    { header: 'Customer', render: (p) => <CustomerCell name={p.customerName} email={p.customerEmail} phone={p.customerPhone} /> },
    {
      header: 'Vendor',
      render: (p) => (
        <div>
          <div className="text-ink dark:text-white">{p.vendorDisplayName}</div>
          <div className="text-xs text-muted">{p.campusName ?? p.campusId}</div>
        </div>
      ),
    },
    { header: 'Amount', align: 'right', render: (p) => <MoneyPair expected={p.amountExpectedKobo} paid={p.amountPaidKobo} currency={p.currency} /> },
    {
      header: 'Status',
      render: (p) => (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={p.paymentStatus} />
            {p.refundStatus && p.refundStatus !== 'none' && <StatusBadge status={p.refundStatus} />}
          </div>
          <div className="text-xs text-muted">Order: {titleize(p.orderStatus)}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
            <span className={p.webhookReceived ? '' : 'text-warning font-medium'}>{p.webhookReceived ? 'Webhook ✓' : 'No webhook'}</span>
            <span aria-hidden>·</span>
            <span>{titleize(p.verificationStatus)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Created',
      render: (p) => (
        <div>
          <div className="text-ink dark:text-muted">{formatDateTime(p.createdAt)}</div>
          <div className="text-xs text-muted">Updated {formatDateTime(p.updatedAt)}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex flex-col items-stretch gap-1.5 min-w-[132px]" onClick={(event) => event.stopPropagation()}>
          <PermissionAction size="sm" variant="outline" action="payment.verify" loading={verify.isPending} onClick={() => verify.mutate(p.id)}>
            <RefreshCw className="w-4 h-4" /> Verify
          </PermissionAction>
          <PermissionAction size="sm" variant="subtle" action="payment.review" onClick={() => setReviewPayment(p)}>
            <Flag className="w-4 h-4" /> Review
          </PermissionAction>
          <PermissionAction size="sm" variant="outline" action="refund.initiate" disabled={!['paid', 'refunded'].includes(String(p.paymentStatus))} onClick={() => setRefundPayment(p)}>
            <Undo2 className="w-4 h-4" /> Refund
          </PermissionAction>
          <Link href={`/payments/${p.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas font-medium">
            <Eye className="w-4 h-4" /> Detail
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Payments" subtitle="Search, verify, reconcile, and support customer payments." />
      <QueuePreview />
      <ListView<PaymentListItem>
        baseKey="payments"
        params={{
          campusId: campus || scopeCampusId || undefined,
          status: status || undefined,
          refundStatus: refundStatus || undefined,
          vendorId: vendor || undefined,
          from: from || undefined,
          to: to || undefined,
          minAmountKobo: minAmount ? Number(minAmount) * 100 : undefined,
          maxAmountKobo: maxAmount ? Number(maxAmount) * 100 : undefined,
          webhookReceived: webhookReceived || undefined,
          requiresReview: requiresReview || undefined,
          search: debounced || undefined,
        }}
        fetch={(q) => api.getPayments(q)}
        columns={columns}
        tableLayout="auto"
        rowKey={(p) => p.id}
        rowHref={(p) => `/payments/${p.id}`}
        empty="No payments match these filters."
        toolbar={
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <SearchInput className="md:w-full xl:col-span-2" placeholder="Order, payment, Paystack ref, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All payment statuses</option>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <FilterSelect value={refundStatus} onChange={(e) => setRefundStatus(e.target.value)}>
              <option value="">All refund statuses</option>
              {REFUND_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <FilterSelect value={webhookReceived} onChange={(e) => setWebhookReceived(e.target.value)}>
              <option value="">Any webhook status</option>
              <option value="true">Webhook received</option>
              <option value="false">Webhook not received</option>
            </FilterSelect>
            <FilterSelect value={requiresReview} onChange={(e) => setRequiresReview(e.target.value)}>
              <option value="">Any review state</option>
              <option value="true">Requires admin review</option>
              <option value="false">No review required</option>
            </FilterSelect>
            <FilterSelect value={campus} onChange={(e) => setCampus(e.target.value)}>
              <option value="">Scoped campus</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FilterSelect>
            <TextField placeholder="Vendor ID" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            <TextField type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <TextField type="number" placeholder="Min amount (NGN)" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <TextField type="number" placeholder="Max amount (NGN)" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
          </div>
        }
      />

      <Modal
        open={!!reviewPayment}
        onClose={() => setReviewPayment(null)}
        title="Mark payment for review"
        footer={<>
          <Button variant="ghost" onClick={() => setReviewPayment(null)}>Cancel</Button>
          <PermissionAction action="payment.review" loading={review.isPending} onClick={() => review.mutate()}>Mark for review</PermissionAction>
        </>}
      >
        <TextArea label="Internal note" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Reason finance/support should review this payment." />
      </Modal>

      {refundPayment && (
        <Modal
          open={!!refundPayment}
          onClose={() => setRefundPayment(null)}
          title="Initiate refund"
          footer={<>
            <Button variant="ghost" onClick={() => setRefundPayment(null)}>Cancel</Button>
            <PermissionAction action="refund.initiate" variant="danger" loading={refund.isPending} disabled={!refundReason.trim()} onClick={() => refund.mutate()}>
              Initiate refund
            </PermissionAction>
          </>}
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
              Refund amount: {formatKobo(refundPayment.amountPaidKobo)}. Vendor settlement may be affected. Duplicate refund action is blocked while request is in flight.
            </div>
            <TextArea label="Refund reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Customer approved refund reason." />
          </div>
        </Modal>
      )}
    </>
  );
}
