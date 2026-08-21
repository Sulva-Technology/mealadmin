'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { formatDateTime, formatKobo } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CopyButton } from '@/components/admin/finance/FinanceUI';

export default function PayoutTransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useApiQuery(['payout-transfer', id], () => api.getPayoutTransfer(id));

  return (
    <>
      <PageHeader title="Payout transfer" backHref="/payouts" />
      <AsyncBoundary query={query}>
        {(env) => {
          const t = env.data;
          return (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{t.reference}</h2>
                    <p className="text-xs text-muted">{t.providerTransferCode ?? 'No Paystack transfer code yet'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={t.status} />
                    <StatusBadge status={t.needsAdmin ? 'needs admin' : 'ok'} tone={t.needsAdmin ? 'warning' : 'neutral'} />
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Amount">{formatKobo(t.amountKobo)}</Field>
                  <Field label="Attempt">{t.attempt}</Field>
                  <Field label="Settlement">
                    <Link className="text-primary hover:underline font-mono text-xs" href={`/settlements/${t.settlementId}`}>{t.settlementId}</Link>
                  </Field>
                  <Field label="Created">{formatDateTime(t.createdAt)}</Field>
                  <Field label="Reference"><span className="inline-flex items-center gap-2 font-mono text-xs">{t.reference}<CopyButton value={t.reference} label="Copy reference" /></span></Field>
                </dl>
              </Card>

              {t.needsAdmin && (
                <Card className="p-6 border-l-4 border-l-warning">
                  <h3 className="text-sm font-bold text-ink dark:text-white mb-1">Needs admin attention</h3>
                  <p className="text-sm text-muted">
                    This transfer exhausted automatic retries or was reversed. Review the beneficiary&apos;s payout account
                    (Vendor/Rider detail → payout account) and re-trigger the settlement payout once the account is fixed.
                  </p>
                </Card>
              )}
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
