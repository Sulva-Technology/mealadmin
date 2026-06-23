'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { RIDER_STATUSES, type RiderListItem } from '@/lib/types';
import { formatDate, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { SearchInput, FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<RiderListItem>[] = [
  {
    header: 'Rider',
    render: (r) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{r.displayName}</div>
        <div className="text-xs text-muted">{r.phone ?? '—'}</div>
      </div>
    ),
  },
  { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { header: 'Active', render: (r) => (r.active ? 'Yes' : 'No') },
  { header: 'Verified', align: 'right', render: (r) => formatDate(r.verifiedAt) },
];

export default function RidersPage() {
  const { scopeCampusId } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounced(search);

  return (
    <>
      <PageHeader title="Riders" subtitle="Directory and verification." />
      <ListView<RiderListItem>
        baseKey="riders"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, search: debounced || undefined }}
        fetch={(q) => api.getRiders(q)}
        columns={columns}
        rowKey={(r) => r.id}
        rowHref={(r) => `/riders/${r.id}`}
        empty="No riders match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {RIDER_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
          </div>
        }
      />
    </>
  );
}
