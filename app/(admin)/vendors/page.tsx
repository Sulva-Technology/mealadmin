'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { VENDOR_STATUSES, type VendorListItem } from '@/lib/types';
import { formatDate, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { SearchInput, FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<VendorListItem>[] = [
  {
    header: 'Vendor',
    render: (v) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{v.displayName}</div>
        <div className="text-xs text-muted">{v.legalName}</div>
      </div>
    ),
  },
  { header: 'Contact', render: (v) => <span className="text-muted">{v.email ?? v.phone ?? '—'}</span> },
  { header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
  { header: 'Active', render: (v) => (v.active ? 'Yes' : 'No') },
  { header: 'Joined', align: 'right', render: (v) => formatDate(v.createdAt) },
];

export default function VendorsPage() {
  const { scopeCampusId } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounced(search);

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Directory, approval and lifecycle."
        actions={<Link href="/vendors/new"><Button>+ Onboard Vendor</Button></Link>}
      />
      <ListView<VendorListItem>
        baseKey="vendors"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, search: debounced || undefined }}
        fetch={(q) => api.getVendors(q)}
        columns={columns}
        rowKey={(v) => v.id}
        rowHref={(v) => `/vendors/${v.id}`}
        empty="No vendors match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {VENDOR_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
          </div>
        }
      />
    </>
  );
}
