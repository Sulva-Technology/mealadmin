'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionAction } from '@/components/admin/Permission';
import { Timeline } from '@/components/admin/finance/FinanceUI';

export default function WebhookDetailPage() {
  const { webhookId } = useParams<{ webhookId: string }>();
  const query = useApiQuery(['webhook', webhookId], () => api.getWebhook(webhookId));
  const retry = useApiAction(() => api.retryWebhook(webhookId), {
    invalidate: [['webhook', webhookId], ['webhooks'], ['system-health']],
    success: 'Webhook retry requested.',
  });
  const review = useApiAction(() => api.markWebhookReviewed(webhookId, { note: 'Reviewed from admin dashboard.' }), {
    invalidate: [['webhook', webhookId], ['webhooks']],
    success: 'Webhook marked reviewed.',
  });

  return (
    <>
      <PageHeader title="Webhook detail" backHref="/health" />
      <AsyncBoundary query={query}>
        {(env) => {
          const webhook = env.data;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-space font-bold text-ink dark:text-white">{webhook.id}</h2>
                      <p className="text-xs text-muted">{webhook.eventType}</p>
                    </div>
                    <StatusBadge status={webhook.processingStatus} />
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Field label="Payment">
                      {webhook.paymentReference ? <Link className="text-primary hover:underline" href={`/payments?search=${encodeURIComponent(webhook.paymentReference)}`}>{webhook.paymentReference}</Link> : 'Not linked'}
                    </Field>
                    <Field label="Order">
                      {webhook.orderId ? <Link className="text-primary hover:underline" href={`/orders/${webhook.orderId}`}>{webhook.orderId}</Link> : 'Not linked'}
                    </Field>
                    <Field label="Signature verified">{webhook.signatureVerified ? 'Yes' : 'No'}</Field>
                    <Field label="Retry count">{webhook.retryCount}</Field>
                    <Field label="Received">{formatDateTime(webhook.receivedAt)}</Field>
                    <Field label="Processed">{formatDateTime(webhook.processedAt)}</Field>
                    <Field label="Failure reason">{webhook.failureReason ?? 'None'}</Field>
                  </dl>
                </Card>
                <Card className="p-6 h-fit">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                  <div className="space-y-3">
                    <PermissionAction className="w-full" action="webhook.retry" loading={retry.isPending} onClick={() => retry.mutate()}>
                      <RotateCcw className="w-4 h-4" /> Retry webhook
                    </PermissionAction>
                    <PermissionAction className="w-full" variant="subtle" action="webhook.review" loading={review.isPending} onClick={() => review.mutate()}>
                      Mark as reviewed
                    </PermissionAction>
                  </div>
                </Card>
              </div>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Safe event summary</h3>
                <pre className="text-xs whitespace-pre-wrap break-words rounded-xl bg-canvas dark:bg-ink/50 p-3">{JSON.stringify(webhook.safeSummary ?? {}, null, 2)}</pre>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Processing logs</h3>
                <Timeline events={webhook.processingLogs} />
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
