'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { ACCOUNT_STATUSES, type UserRecord } from '@/lib/types';
import { formatDate, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { SearchInput, FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<UserRecord>[] = [
  {
    header: 'User',
    render: (u) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{u.displayName}</div>
        <div className="text-xs text-muted">{u.email ?? '—'}</div>
      </div>
    ),
  },
  { header: 'Phone', render: (u) => u.phoneNumber ?? '—' },
  { header: 'Status', render: (u) => <StatusBadge status={u.accountStatus} /> },
  { header: 'Joined', align: 'right', render: (u) => formatDate(u.createdAt) },
];

export default function UsersPage() {
  const { scopeCampusId } = useSession();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounced(search);

  return (
    <>
      <PageHeader title="Customer Accounts" subtitle="Account administration." />
      <ListView<UserRecord>
        baseKey="users"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, search: debounced || undefined }}
        fetch={(q) => api.getUsers(q)}
        columns={columns}
        rowKey={(u) => u.id}
        rowHref={(u) => `/users/${u.id}`}
        empty="No users match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
          </div>
        }
      />
    </>
  );
}
