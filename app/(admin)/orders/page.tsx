'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { ORDER_STATUSES, type OrderListItem } from '@/lib/types';
import { formatKobo, formatDate, titleize } from '@/lib/format';
import { useDispatchRef, type DispatchRef } from '@/lib/dispatch-ref';
import { PageHeader } from '@/components/ui/Page';
import { SearchInput, FilterSelect, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

function buildColumns(ref: DispatchRef): Column<OrderListItem>[] {
  return [
    {
      header: 'Order',
      render: (o) => {
        const location = ref.locationLabel(o.locationId);
        const time = ref.slotTime(o.deliverySlotId);
        return (
          <div>
            <div className="font-semibold text-ink dark:text-white">{location ?? o.orderNumber}</div>
            <div className="text-xs text-muted">
              {formatDate(o.serviceDate)}{time ? ` · ${time}` : ''}
            </div>
            {location && <div className="text-[11px] text-muted font-mono">{o.orderNumber}</div>}
          </div>
        );
      },
    },
    { header: 'Vendor', render: (o) => o.vendorDisplayName },
    { header: 'Mode', render: (o) => titleize(o.deliveryMode) },
    { header: 'Status', render: (o) => <StatusBadge status={o.orderStatus} /> },
    { header: 'Total', align: 'right', render: (o) => <span className="font-bold">{formatKobo(o.totalKobo)}</span> },
  ];
}

export default function OrdersPage() {
  const { scopeCampusId } = useSession();
  const ref = useDispatchRef();
  const columns = buildColumns(ref);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const debounced = useDebounced(search);

  return (
    <>
      <PageHeader title="Orders" subtitle="Investigate and administer campus orders." />
      <ListView<OrderListItem>
        baseKey="orders"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, search: debounced || undefined, date: date || undefined }}
        fetch={(q) => api.getOrders(q)}
        columns={columns}
        rowKey={(o) => o.id}
        rowHref={(o) => `/orders/${o.id}`}
        empty="No orders match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Search order number…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
          </div>
        }
      />
    </>
  );
}
