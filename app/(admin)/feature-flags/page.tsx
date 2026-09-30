'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction, useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatDate } from '@/lib/format';
import type { FeatureFlag, FeatureFlagMode, FeatureTester, FeatureTesterSubjectType } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, Select, SearchInput } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

const MODES: { value: FeatureFlagMode; label: string; hint: string }[] = [
  { value: 'off', label: 'Off', hint: 'Hidden and inert for everyone (kill switch).' },
  { value: 'test', label: 'Test', hint: 'Only the tester cohort below sees it.' },
  { value: 'on', label: 'On', hint: 'Live for every user and vendor.' },
];

const MODE_TONE = { off: 'neutral', test: 'warning', on: 'success' } as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function FeatureFlagsPage() {
  const { isSuperAdmin } = useSession();
  const flagsQ = useApiQuery(['feature-flags'], () => api.getFeatureFlags(), isSuperAdmin);
  const testersQ = useApiQuery(['feature-testers'], () => api.getFeatureTesters(), isSuperAdmin);
  const vendorsQ = useApiQuery(['feature-testers', 'vendors'], () => api.getVendors({ limit: 100 }), isSuperAdmin);

  const [pending, setPending] = useState<{ flag: FeatureFlag; mode: FeatureFlagMode } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const setMode = useApiAction(
    ({ key, mode }: { key: string; mode: FeatureFlagMode }) => api.updateFeatureFlag(key, mode),
    { invalidate: [['feature-flags']], success: 'Flag updated.', onSuccess: () => setPending(null) },
  );
  const removeTester = useApiAction((id: string) => api.removeFeatureTester(id), {
    invalidate: [['feature-testers']],
    success: 'Tester removed.',
  });

  if (!isSuperAdmin) {
    return (
      <>
        <PageHeader title="Feature Flags" />
        <Card className="p-8 text-center text-muted">Only super admins can manage feature flags.</Card>
      </>
    );
  }

  const vendorName = (id: string) => vendorsQ.data?.data.find((v) => v.id === id)?.displayName;

  const flagColumns: Column<FeatureFlag>[] = [
    {
      header: 'Feature',
      render: (f) => (
        <div>
          <p className="font-mono text-xs font-semibold">{f.key}</p>
          {f.description && <p className="text-xs text-muted mt-0.5">{f.description}</p>}
        </div>
      ),
    },
    { header: 'Mode', render: (f) => <StatusBadge status={f.mode} tone={MODE_TONE[f.mode]} /> },
    { header: 'Updated', render: (f) => formatDate(f.updatedAt) },
    {
      header: '', align: 'right',
      render: (f) => (
        <div className="inline-flex gap-1.5">
          {MODES.map((m) => (
            <Button
              key={m.value}
              size="sm"
              variant={f.mode === m.value ? 'primary' : 'outline'}
              disabled={f.mode === m.value}
              onClick={() => setPending({ flag: f, mode: m.value })}
            >
              {m.label}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  const testerColumns: Column<FeatureTester>[] = [
    { header: 'Type', render: (t) => <StatusBadge status={t.subjectType} tone={t.subjectType === 'vendor' ? 'info' : 'neutral'} /> },
    {
      header: 'Subject',
      render: (t) =>
        t.subjectType === 'vendor' ? (
          <Link href={`/vendors/${t.subjectId}`} className="text-primary hover:underline">
            {vendorName(t.subjectId) ?? <span className="font-mono text-xs">{t.subjectId}</span>}
          </Link>
        ) : (
          <UserLabel id={t.subjectId} />
        ),
    },
    { header: 'Note', render: (t) => t.note ?? '—' },
    { header: 'Added', render: (t) => formatDate(t.createdAt) },
    {
      header: '', align: 'right',
      render: (t) => (
        <Button size="sm" variant="danger" onClick={() => removeTester.mutate(t.id)}>Remove</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Feature Flags"
        subtitle="Roll features out safely: Off → Test (tester cohort only) → On. Every change is audited."
      />

      <Card className="overflow-hidden mb-6">
        <AsyncBoundary query={flagsQ} empty="No feature flags." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={flagColumns} rows={d.data} rowKey={(f) => f.key} />}
        </AsyncBoundary>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-space font-bold text-ink dark:text-white">Tester cohort</h2>
          <p className="text-sm text-muted">Users and vendors who see features in Test mode. Test orders are real production rows.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>+ Add tester</Button>
      </div>
      <Card className="overflow-hidden">
        <AsyncBoundary query={testersQ} empty="No testers yet." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={testerColumns} rows={d.data} rowKey={(t) => t.id} />}
        </AsyncBoundary>
      </Card>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Change feature mode"
        footer={<>
          <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          <Button
            loading={setMode.isPending}
            variant={pending?.mode === 'off' ? 'danger' : 'primary'}
            onClick={() => pending && setMode.mutate({ key: pending.flag.key, mode: pending.mode })}
          >
            Set {pending?.mode}
          </Button>
        </>}
      >
        {pending && (
          <p className="text-sm">
            Switch <span className="font-mono font-semibold">{pending.flag.key}</span> from{' '}
            <strong>{pending.flag.mode}</strong> to <strong>{pending.mode}</strong>.{' '}
            {MODES.find((m) => m.value === pending.mode)?.hint}
          </p>
        )}
      </Modal>

      <AddTesterModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        vendors={vendorsQ.data?.data ?? []}
      />
    </>
  );
}

function UserLabel({ id }: { id: string }) {
  const q = useApiQuery(['users', id], () => api.getUser(id));
  const user = q.data?.data;
  return (
    <Link href={`/users/${id}`} className="text-primary hover:underline">
      {user ? `${user.displayName}${user.email ? ` · ${user.email}` : ''}` : <span className="font-mono text-xs">{id}</span>}
    </Link>
  );
}

function AddTesterModal({
  open, onClose, vendors,
}: {
  open: boolean;
  onClose: () => void;
  vendors: { id: string; displayName: string }[];
}) {
  const [subjectType, setSubjectType] = useState<FeatureTesterSubjectType>('vendor');
  const [subjectId, setSubjectId] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);

  const usersQ = useApiQuery(
    ['feature-testers', 'user-search', debounced],
    () => api.getUsers({ search: debounced, limit: 8 }),
    open && subjectType === 'user' && debounced.trim().length >= 2,
  );

  const reset = () => { setSubjectId(''); setNote(''); setSearch(''); };
  const add = useApiAction(
    () => api.addFeatureTester({ subjectType, subjectId: subjectId.trim(), note: note.trim() || undefined }),
    { invalidate: [['feature-testers']], success: 'Tester added.', onSuccess: () => { reset(); onClose(); } },
  );

  const valid = UUID_RE.test(subjectId.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add tester"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={add.isPending} disabled={!valid} onClick={() => add.mutate()}>Add</Button>
      </>}
    >
      <div className="space-y-4">
        <Select
          label="Type"
          value={subjectType}
          onChange={(e) => { setSubjectType(e.target.value as FeatureTesterSubjectType); setSubjectId(''); }}
        >
          <option value="vendor">Vendor (whole store — e.g. printing)</option>
          <option value="user">User (one account)</option>
        </Select>

        {subjectType === 'vendor' ? (
          <Select label="Vendor" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="" disabled>Select vendor</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.displayName}</option>)}
          </Select>
        ) : (
          <div className="space-y-2">
            <SearchInput placeholder="Search users by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            {(usersQ.data?.data ?? []).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSubjectId(u.id)}
                className={`w-full text-left rounded-xl px-3 py-2 text-sm border ${subjectId === u.id ? 'border-primary bg-primary/5' : 'border-muted/20 hover:bg-canvas'}`}
              >
                {u.displayName} <span className="text-muted">{u.email ?? u.phoneNumber ?? ''}</span>
              </button>
            ))}
            <TextField label="User ID (UUID)" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} />
          </div>
        )}

        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Test vendor for cloud printing" />
      </div>
    </Modal>
  );
}
