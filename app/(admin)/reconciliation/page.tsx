'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Flag, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction } from '@/lib/hooks';
import { PAYMENT_QUEUE_KEYS, type PaymentQueueItem } from '@/lib/types';
import { formatKobo, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { PermissionAction } from '@/components/admin/Permission';
import type { Column } from '@/components/ui/DataTable';

function age(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function ReconciliationPage() {
  const [queue, setQueue] = useState('');
  const verify = useApiAction((id: string) => api.verifyPayment(id), {
    invalidate: [['reconciliation'], ['payment-queues'], ['payments']],
    success: 'Payment verification requested.',
  });
  const review = useApiAction((id: string) => api.markPaymentQueueReviewed(id, { note: 'Reviewed from reconciliation queue.' }), {
    invalidate: [['reconciliation'], ['payment-queues'], ['payments']],
    success: 'Queue item marked as reviewed.',
  });

  const columns: Column<PaymentQueueItem>[] = [
    { header: 'Severity', render: (q) => <StatusBadge status={q.severity} tone={q.severity === 'critical' || q.severity === 'high' ? 'danger' : 'warning'} /> },
    { header: 'Payment reference', render: (q) => <div><div className="font-semibold">{q.paymentReference}</div><div className="text-xs text-muted">{titleize(q.queue)}</div></div> },
    { header: 'Order ID', render: (q) => q.orderId },
    { header: 'Customer', render: (q) => q.customerName ?? q.customerEmail ?? 'Unknown customer' },
    { header: 'Amount', align: 'right', render: (q) => <span className="font-bold">{formatKobo(q.amountKobo)}</span> },
    { header: 'Age', render: (q) => age(q.issueAgeSeconds) },
    { header: 'Suggested action', render: (q) => q.suggestedAction },
    {
      header: 'Actions',
      render: (q) => (
        <div className="flex flex-wrap gap-2 min-w-[280px]">
          <PermissionAction size="sm" variant="outline" action="payment.verify" loading={verify.isPending} onClick={(event) => { event.stopPropagation(); verify.mutate(q.paymentId ?? q.id); }}>
            <RefreshCw className="w-4 h-4" /> Verify with Paystack
          </PermissionAction>
          <Link href={`/payments/${q.paymentId ?? q.id}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas font-medium">
            <Eye className="w-4 h-4" /> Open detail
          </Link>
          <PermissionAction size="sm" variant="subtle" action="payment.review" loading={review.isPending} onClick={(event) => { event.stopPropagation(); review.mutate(q.id); }}>
            <Flag className="w-4 h-4" /> Mark as reviewed
          </PermissionAction>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Reconciliation" subtitle="Payment exception queues that need finance, support, or operations review." />
      <ListView<PaymentQueueItem>
        baseKey="reconciliation"
        params={{ queue: queue || undefined }}
        fetch={(q) => api.getPaymentQueues(q)}
        columns={columns}
        rowKey={(q) => q.id}
        rowHref={(q) => `/payments/${q.paymentId ?? q.id}`}
        empty="No reconciliation issues match this queue."
        toolbar={
          <FilterSelect value={queue} onChange={(e) => setQueue(e.target.value)}>
            <option value="">All problem queues</option>
            {PAYMENT_QUEUE_KEYS.map((key) => <option key={key} value={key}>{titleize(key)}</option>)}
          </FilterSelect>
        }
      />
    </>
  );
}
