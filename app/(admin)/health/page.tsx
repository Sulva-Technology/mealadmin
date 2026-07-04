'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { type WebhookEvent } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { PageHeader, Stat, Card, AsyncBoundary } from '@/components/ui/Page';
import { FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { PermissionAction } from '@/components/admin/Permission';
import type { Column } from '@/components/ui/DataTable';

export default function HealthPage() {
  const health = useApiQuery(['system-health'], () => api.getSystemHealth());
  const [status, setStatus] = useState('');
  const retry = useApiAction((id: string) => api.retryWebhook(id), {
    invalidate: [['webhooks'], ['system-health']],
    success: 'Webhook retry requested.',
  });

  const columns: Column<WebhookEvent>[] = [
    { header: 'Event ID', render: (w) => <span className="font-mono text-xs">{w.id}</span> },
    { header: 'Event type', render: (w) => w.eventType },
    { header: 'Payment reference', render: (w) => w.paymentReference ?? 'Not linked' },
    { header: 'Order ID', render: (w) => w.orderId ?? 'Not linked' },
    { header: 'Signature verified', render: (w) => <StatusBadge status={w.signatureVerified ? 'verified' : 'not_verified'} tone={w.signatureVerified ? 'success' : 'danger'} /> },
    { header: 'Processing status', render: (w) => <StatusBadge status={w.processingStatus} /> },
    { header: 'Received', render: (w) => formatDateTime(w.receivedAt) },
    { header: 'Processed', render: (w) => formatDateTime(w.processedAt) },
    { header: 'Failure reason', render: (w) => w.failureReason ?? 'None' },
    { header: 'Retry count', align: 'right', render: (w) => w.retryCount },
    {
      header: 'Actions',
      render: (w) => (
        <div className="flex flex-wrap gap-2 min-w-[190px]">
          <Link href={`/health/webhooks/${w.id}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas font-medium">
            <Eye className="w-4 h-4" /> Open detail
          </Link>
          <PermissionAction size="sm" variant="outline" action="webhook.retry" loading={retry.isPending} onClick={(event) => { event.stopPropagation(); retry.mutate(w.id); }}>
            <RotateCcw className="w-4 h-4" /> Retry webhook
          </PermissionAction>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="System health" subtitle="Backend, database, Paystack, webhook, and reconciliation diagnostics." />
      <Card className="p-5 mb-6">
        <AsyncBoundary query={health}>
          {(env) => {
            const h = env.data;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Stat label="Backend API health" value={<StatusBadge status={h.api} />} />
                <Stat label="Database health" value={<StatusBadge status={h.database} />} />
                <Stat label="Paystack connectivity" value={<StatusBadge status={h.paystack} />} />
                <Stat label="Failed webhook count" value={h.failedWebhookCount} />
                <Stat label="Last successful webhook" value={formatDateTime(h.lastSuccessfulWebhookAt)} />
                <Stat label="Last failed webhook" value={formatDateTime(h.lastFailedWebhookAt)} />
                <Stat label="Pending reconciliation" value={h.pendingReconciliationCount} />
                <Stat label="Failed jobs" value={h.failedJobsCount ?? 'Not returned'} />
              </div>
            );
          }}
        </AsyncBoundary>
      </Card>

      <PageHeader title="Webhook viewer" subtitle="Inspect processing status and safe retry actions." />
      <ListView<WebhookEvent>
        baseKey="webhooks"
        params={{ status: status || undefined }}
        fetch={(q) => api.getWebhooks(q)}
        columns={columns}
        rowKey={(w) => w.id}
        rowHref={(w) => `/health/webhooks/${w.id}`}
        empty="No webhook events match this filter."
        toolbar={
          <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All webhook statuses</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
          </FilterSelect>
        }
      />
    </>
  );
}
