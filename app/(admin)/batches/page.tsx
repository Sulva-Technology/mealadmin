'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { BATCH_STATUSES, type BatchListItem } from '@/lib/types';
import { formatKobo, formatDate, formatTime, titleize } from '@/lib/format';
import { useDispatchRef, type DispatchRef } from '@/lib/dispatch-ref';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

function buildColumns(ref: DispatchRef): Column<BatchListItem>[] {
  return [
    {
      header: 'Batch',
      render: (b) => {
        const zone = ref.zoneLabel(b.zoneId);
        const delivery = ref.slotTime(b.deliverySlotId);
        const created = formatTime(b.createdAt);
        return (
          <div>
            <div className="font-semibold text-ink dark:text-white">{zone ?? b.batchNumber}</div>
            <div className="text-xs text-muted">
              {formatDate(b.serviceDate)}{delivery ? ` · Delivery ${delivery}` : ''}{created ? ` · Made ${created}` : ''}
            </div>
            {zone && <div className="text-[11px] text-muted font-mono">{b.batchNumber}</div>}
          </div>
        );
      },
    },
    { header: 'Vendor', render: (b) => b.vendorDisplayName },
    { header: 'Orders', align: 'right', render: (b) => b.orderCount },
    { header: 'Earnings', align: 'right', render: (b) => formatKobo(b.deliveryEarningsKobo) },
    { header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  ];
}

export default function BatchesPage() {
  const { scopeCampusId } = useSession();
  const ref = useDispatchRef();
  const columns = buildColumns(ref);
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
