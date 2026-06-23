'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { SearchInput } from '@/components/ui/Inputs';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<AuditLog>[] = [
  { header: 'Time', render: (l) => formatDateTime(l.createdAt) },
  { header: 'Action', render: (l) => <span className="font-mono text-xs text-ink dark:text-white">{l.action}</span> },
  { header: 'Entity', render: (l) => <span className="text-muted">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ''}</span> },
  { header: 'Actor', render: (l) => <span className="font-mono text-xs">{l.actorUserId ?? 'system'}</span> },
  { header: 'Request', align: 'right', render: (l) => <span className="font-mono text-xs text-muted">{l.requestId ?? '—'}</span> },
];

export default function AuditLogsPage() {
  const { scopeCampusId } = useSession();
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const debouncedAction = useDebounced(action);
  const debouncedEntity = useDebounced(entityType);

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Immutable record of administrative actions." />
      <ListView<AuditLog>
        baseKey="audit-logs"
        params={{ campusId: scopeCampusId ?? undefined, action: debouncedAction || undefined, entityType: debouncedEntity || undefined }}
        fetch={(q) => api.getAuditLogs(q)}
        columns={columns}
        rowKey={(l) => l.id}
        empty="No audit entries match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <SearchInput placeholder="Filter by action…" value={action} onChange={(e) => setAction(e.target.value)} />
            <SearchInput placeholder="Filter by entity type…" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
          </div>
        }
      />
    </>
  );
}
