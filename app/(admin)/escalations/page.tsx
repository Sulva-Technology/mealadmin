'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ESCALATION_STATUSES, type EscalationListItem } from '@/lib/types';
import { formatDateTime, titleize } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { FilterSelect } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<EscalationListItem>[] = [
  {
    header: 'Escalation',
    render: (e) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{titleize(e.category)}</div>
        <div className="text-xs text-muted font-mono">order {e.orderId.slice(0, 8)}…</div>
      </div>
    ),
  },
  { header: 'Opened By', render: (e) => e.openedBy },
  { header: 'Assignee', render: (e) => e.assignedAdminId ?? '—' },
  { header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
  { header: 'Opened', align: 'right', render: (e) => formatDateTime(e.openedAt) },
];

export default function EscalationsPage() {
  const { scopeCampusId } = useSession();
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  return (
    <>
      <PageHeader title="Escalations" subtitle="Dispute queue, investigation and resolution." />
      <ListView<EscalationListItem>
        baseKey="escalations"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, category: category || undefined }}
        fetch={(q) => api.getEscalations(q)}
        columns={columns}
        rowKey={(e) => e.id}
        rowHref={(e) => `/escalations/${e.id}`}
        empty="No escalations match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {ESCALATION_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <input
              placeholder="Category…" value={category} onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface dark:bg-ink/50 border border-muted/20 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        }
      />
    </>
  );
}
