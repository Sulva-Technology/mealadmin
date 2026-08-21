'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { api } from '@/lib/api';
import type { PayoutTransferListItem } from '@/lib/types';
import { formatDateTime, formatKobo, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { CopyButton } from '@/components/admin/finance/FinanceUI';
import type { Column } from '@/components/ui/DataTable';

const TRANSFER_STATUSES = ['pending', 'success', 'failed', 'reversed', 'needs_admin'];

export default function PayoutsPage() {
  const [status, setStatus] = useState('');

  const columns: Column<PayoutTransferListItem>[] = [
    { header: 'Reference', render: (t) => <div><div className="font-mono text-xs">{t.reference}</div><div className="text-xs text-muted">{t.providerTransferCode ?? 'No transfer code'}</div></div> },
    { header: 'Settlement', render: (t) => <Link href={`/settlements/${t.settlementId}`} className="text-primary hover:underline font-mono text-xs">{t.settlementId}</Link> },
    { header: 'Amount', align: 'right', render: (t) => <span className="font-bold">{formatKobo(t.amountKobo)}</span> },
    { header: 'Attempt', align: 'right', render: (t) => t.attempt },
    { header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    { header: 'Needs admin', render: (t) => <StatusBadge status={t.needsAdmin ? 'required' : 'ok'} tone={t.needsAdmin ? 'warning' : 'neutral'} /> },
    { header: 'Created', render: (t) => formatDateTime(t.createdAt) },
    {
      header: 'Actions',
      render: (t) => (
        <div className="flex flex-wrap gap-2 min-w-[200px]">
          <Link href={`/payouts/${t.id}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas font-medium">
            <Eye className="w-4 h-4" /> Open transfer
          </Link>
          <CopyButton value={t.reference} label="Copy reference" />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Payouts" subtitle="Automated Paystack payout transfers. Filter to needs-admin to triage stuck payouts." />
      <ListView<PayoutTransferListItem>
        baseKey="payout-transfers"
        params={{ status: status || undefined }}
        fetch={(q) => api.getPayoutTransfers(q)}
        columns={columns}
        rowKey={(t) => t.id}
        rowHref={(t) => `/payouts/${t.id}`}
        empty="No payout transfers match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All transfer statuses</option>
              {TRANSFER_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
          </div>
        }
      />
    </>
  );
}
