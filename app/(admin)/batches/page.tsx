'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { BATCH_STATUSES, type BatchListItem } from '@/lib/types';
import { formatKobo, formatDate, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<BatchListItem>[] = [
  {
    header: 'Batch',
    render: (b) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{b.batchNumber}</div>
        <div className="text-xs text-muted">{formatDate(b.serviceDate)}</div>
      </div>
    ),
  },
  { header: 'Vendor', render: (b) => b.vendorDisplayName },
  { header: 'Orders', align: 'right', render: (b) => b.orderCount },
  { header: 'Earnings', align: 'right', render: (b) => formatKobo(b.deliveryEarningsKobo) },
  { header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
];

export default function BatchesPage() {
  const { scopeCampusId } = useSession();
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');

  return (
    <>
      <PageHeader title="Delivery Batches" subtitle="Dispatch operations: rider assignment and delivery." />
      <ListView<BatchListItem>
        baseKey="batches"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, date: date || undefined }}
        fetch={(q) => api.getBatches(q)}
        columns={columns}
        rowKey={(b) => b.id}
        rowHref={(b) => `/batches/${b.id}`}
        empty="No batches match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {BATCH_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
          </div>
        }
      />
    </>
  );
}
