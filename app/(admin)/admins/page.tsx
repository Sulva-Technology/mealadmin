'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatDate } from '@/lib/format';
import type { AdminMembership, AdminRole } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, Select } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

export default function AdminsPage() {
  const { isSuperAdmin, campuses, campusName } = useSession();
  const query = useApiQuery(['admin-memberships'], () => api.getAdminMemberships(), isSuperAdmin);

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<AdminRole>('campus_admin');
  const [campusId, setCampusId] = useState('');

  const invalidate = [['admin-memberships']];
  const grant = useApiAction(
    () => api.createAdminMembership({ userId, role, campusId: role === 'campus_admin' ? campusId : undefined }),
    { invalidate, success: 'Admin created. Ask them to sign out and back in for the role to take effect.', onSuccess: () => { setOpen(false); setUserId(''); } },
  );
  const revoke = useApiAction((id: string) => api.revokeAdminMembership(id), { invalidate, success: 'Membership revoked.' });
  const activate = useApiAction((id: string) => api.activateAdminMembership(id), { invalidate, success: 'Membership activated.' });

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Administrators" />
        <Card className="p-8 text-center text-muted">Only super admins can manage admin memberships.</Card>
      </>
    );
  }

  const columns: Column<AdminMembership>[] = [
    { header: 'User', render: (m) => <span className="font-mono text-xs">{m.userId}</span> },
    { header: 'Role', render: (m) => <StatusBadge status={m.role} tone={m.role === 'super_admin' ? 'info' : 'neutral'} /> },
    { header: 'Campus', render: (m) => (m.campusId ? campusName(m.campusId) : 'Global') },
    { header: 'Active', render: (m) => (m.active ? 'Yes' : 'No') },
    { header: 'Granted', render: (m) => formatDate(m.grantedAt) },
    {
      header: '', align: 'right',
      render: (m) => (m.active
        ? <Button size="sm" variant="danger" onClick={() => revoke.mutate(m.id)}>Revoke</Button>
        : <Button size="sm" variant="outline" onClick={() => activate.mutate(m.id)}>Activate</Button>),
    },
  ];

  const valid = userId && (role !== 'campus_admin' || campusId);

  return (
    <>
      <PageHeader
        title="Administrators"
        subtitle="Grant and revoke admin access."
        actions={<Button onClick={() => setOpen(true)}>+ Grant Admin</Button>}
      />
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty="No admin memberships." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={columns} rows={d.data} rowKey={(m) => m.id} />}
        </AsyncBoundary>
      </Card>

      <Modal
        open={open} onClose={() => setOpen(false)} title="Grant Admin Membership"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={grant.isPending} disabled={!valid} onClick={() => grant.mutate()}>Grant</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="User ID (UUID)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
            <option value="campus_admin">Campus Admin</option>
            <option value="finance_admin">Finance Admin</option>
            <option value="operations_admin">Operations Admin</option>
            <option value="support_admin">Support Admin</option>
            <option value="read_only_admin">Read-only Admin</option>
            <option value="super_admin">Super Admin</option>
          </Select>
          {role === 'campus_admin' && (
            <Select label="Campus" value={campusId} onChange={(e) => setCampusId(e.target.value)}>
              <option value="" disabled>Select campus</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </div>
      </Modal>
    </>
  );
}
