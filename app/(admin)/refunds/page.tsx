'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { REFUND_STATUSES, type RefundListItem } from '@/lib/types';
import { formatDateTime, formatKobo, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect, SearchInput } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { CustomerCell, CopyButton } from '@/components/admin/finance/FinanceUI';
import type { Column } from '@/components/ui/DataTable';

export default function RefundsPage() {
  const { scopeCampusId } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [required, setRequired] = useState('');
  const debounced = useDebounced(search);

  const columns: Column<RefundListItem>[] = [
    { header: 'Refund ID', render: (r) => <div><div className="font-mono text-xs">{r.id}</div><div className="text-xs text-muted">{r.paymentReference}</div></div> },
    { header: 'Order ID', render: (r) => r.orderId },
    { header: 'Customer', render: (r) => <CustomerCell name={r.customerName} email={r.customerEmail} /> },
    { header: 'Vendor', render: (r) => r.vendorDisplayName },
    { header: 'Amount', align: 'right', render: (r) => <span className="font-bold">{formatKobo(r.amountKobo)}</span> },
    { header: 'Reason', render: (r) => <span className="line-clamp-2">{r.reason}</span> },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { header: 'Requested', render: (r) => formatDateTime(r.requestedAt) },
    { header: 'Processed', render: (r) => formatDateTime(r.processedAt) },
    { header: 'Admin action', render: (r) => <StatusBadge status={r.adminActionRequired ? 'required' : 'not_required'} tone={r.adminActionRequired ? 'warning' : 'neutral'} /> },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2 min-w-[220px]">
          <Link href={`/refunds/${r.id}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas font-medium">
            <Eye className="w-4 h-4" /> Open refund
          </Link>
          <CopyButton value={r.paymentReference} label="Copy payment reference" />
          <CopyButton value={r.orderId} label="Copy order ID" />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Refunds" subtitle="Approve, reject, initiate, retry, and audit refund requests." />
      <ListView<RefundListItem>
        baseKey="refunds"
        params={{
          campusId: scopeCampusId ?? undefined,
          status: status || undefined,
          adminActionRequired: required || undefined,
          search: debounced || undefined,
        }}
        fetch={(q) => api.getRefunds(q)}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/refunds/${r.id}`}
        empty="No refunds match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Search refund, order, payment, customer" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All refund statuses</option>
              {REFUND_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <FilterSelect value={required} onChange={(e) => setRequired(e.target.value)}>
              <option value="">Any action state</option>
              <option value="true">Admin action required</option>
              <option value="false">No admin action required</option>
            </FilterSelect>
          </div>
        }
      />
    </>
  );
}
