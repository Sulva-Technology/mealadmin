'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction, useDebounced } from '@/lib/hooks';
import { formatDateTime, titleize } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FeatureFlag, FeatureFlagMode, FeatureTester, FeatureTesterSubjectType } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SearchInput, Select, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

const MODES: { mode: FeatureFlagMode; label: string; hint: string }[] = [
  { mode: 'off', label: 'Off', hint: 'Nobody' },
  { mode: 'test', label: 'Test', hint: 'Testers only' },
  { mode: 'on', label: 'On', hint: 'Everyone' },
];

const MODE_ACTIVE: Record<FeatureFlagMode, string> = {
  off: 'bg-muted/20 text-ink dark:text-white',
  test: 'bg-warning/20 text-ink dark:text-white',
  on: 'bg-primary text-white',
};

/** Testers carry only an id; resolve the vendor or user name for display. */
function TesterName({ tester }: { tester: FeatureTester }) {
  const isVendor = tester.subjectType === 'vendor';
  const query = useApiQuery<{ name: string; detail: string | null }>(
    [isVendor ? 'vendor' : 'user', tester.subjectId, 'tester-name'],
    async () => {
      if (isVendor) {
        const { data: v } = await api.getVendor(tester.subjectId);
        return { name: v.displayName, detail: v.email ?? v.slug };
      }
      const { data: u } = await api.getUser(tester.subjectId);
      return { name: u.displayName, detail: u.email ?? u.phoneNumber };
    },
  );
  const name = query.data?.name;
  const sub = query.data?.detail;
  return (
    <div className="min-w-0">
      <p className="font-medium text-ink dark:text-white truncate">
        {query.isLoading ? 'Loading…' : name ?? 'Unknown'}
      </p>
      <p className="text-xs text-muted font-mono truncate">{sub ?? tester.subjectId}</p>
    </div>
  );
}

type Candidate = { id: string; name: string; detail: string | null };

function AddTesterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [subjectType, setSubjectType] = useState<FeatureTesterSubjectType>('vendor');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Candidate | null>(null);
  const [note, setNote] = useState('');
  const debounced = useDebounced(search);

  const reset = () => { setSearch(''); setPicked(null); setNote(''); setSubjectType('vendor'); };
  const close = () => { reset(); onClose(); };

  const candidates = useApiQuery<Candidate[]>(
    ['feature-tester-candidates', subjectType, debounced],
    async () => {
      if (subjectType === 'vendor') {
        const r = await api.getVendors({ search: debounced || undefined, limit: 20 });
        return r.data.map((v) => ({ id: v.id, name: v.displayName, detail: v.email ?? v.slug }));
      }
      const r = await api.getUsers({ search: debounced || undefined, limit: 20 });
      return r.data.map((u) => ({ id: u.id, name: u.displayName, detail: u.email ?? u.phoneNumber }));
    },
    open && !picked,
  );

  const add = useApiAction(
    () => api.addFeatureTester({
      subjectType,
      subjectId: picked!.id,
      ...(note.trim() ? { note: note.trim() } : {}),
    }),
    { invalidate: [['feature-testers']], success: 'Tester added.', onSuccess: () => close() },
  );

  return (
    <Modal
      open={open} onClose={close} title="Add Tester"
      footer={<>
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button loading={add.isPending} disabled={!picked} onClick={() => add.mutate()}>Add tester</Button>
      </>}
    >
      <div className="space-y-4">
        <Select
          label="Tester type"
          value={subjectType}
          onChange={(e) => { setSubjectType(e.target.value as FeatureTesterSubjectType); setPicked(null); }}
        >
          <option value="vendor">Vendor (everyone on that vendor account)</option>
          <option value="user">User (one person)</option>
        </Select>

        {picked ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-canvas dark:bg-ink/60">
            <div className="min-w-0">
              <p className="font-medium text-ink dark:text-white truncate">{picked.name}</p>
              <p className="text-xs text-muted truncate">{picked.detail ?? picked.id}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPicked(null)}>Change</Button>
          </div>
        ) : (
          <div>
            <SearchInput
              className="md:w-full"
              placeholder={subjectType === 'vendor' ? 'Search vendor name…' : 'Search name or email…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-muted/20 divide-y divide-muted/10">
              {candidates.isLoading && <p className="p-3 text-sm text-muted">Searching…</p>}
              {candidates.isError && <p className="p-3 text-sm text-danger">Search failed.</p>}
              {candidates.data?.length === 0 && <p className="p-3 text-sm text-muted">No matches.</p>}
              {candidates.data?.map((c) => (
                <button
                  key={c.id} type="button" onClick={() => setPicked(c)}
                  className="w-full text-left p-3 hover:bg-canvas dark:hover:bg-ink/60 transition-colors"
                >
                  <p className="text-sm font-medium text-ink dark:text-white">{c.name}</p>
                  <p className="text-xs text-muted">{c.detail ?? c.id}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <TextField
          label="Note (optional)"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          hint="Why they're testing, e.g. “printer pilot — Mama Put kitchen”."
        />
      </div>
    </Modal>
  );
}

export default function FeatureFlagsPage() {
  const flagsKey = ['feature-flags'];
  const testersKey = ['feature-testers'];
  const flags = useApiQuery(flagsKey, () => api.getFeatureFlags());
  const testers = useApiQuery(testersKey, () => api.getFeatureTesters());

  const [adding, setAdding] = useState(false);
  const [confirmOn, setConfirmOn] = useState<FeatureFlag | null>(null);
  const [removing, setRemoving] = useState<FeatureTester | null>(null);

  const setMode = useApiAction(
    ({ key, mode }: { key: string; mode: FeatureFlagMode }) => api.setFeatureFlagMode(key, mode),
    { invalidate: [flagsKey], success: 'Flag updated.', onSuccess: () => setConfirmOn(null) },
  );

  const remove = useApiAction(
    (t: FeatureTester) => api.removeFeatureTester(t.id),
    { invalidate: [testersKey], success: 'Tester removed.', onSuccess: () => setRemoving(null) },
  );

  // Going fully live reaches every user, so it gets a confirmation step; off/test do not.
  const choose = (flag: FeatureFlag, mode: FeatureFlagMode) => {
    if (mode === flag.mode) return;
    if (mode === 'on') { setConfirmOn(flag); return; }
    setMode.mutate({ key: flag.key, mode });
  };

  const testerColumns: Column<FeatureTester>[] = [
    { header: 'Tester', render: (t) => <TesterName tester={t} /> },
    { header: 'Type', render: (t) => <StatusBadge status={t.subjectType} tone={t.subjectType === 'vendor' ? 'info' : 'neutral'} /> },
    { header: 'Note', render: (t) => <span className="text-muted">{t.note ?? '—'}</span> },
    { header: 'Added', render: (t) => formatDateTime(t.createdAt) },
    {
      header: '', align: 'right',
      render: (t) => <Button size="sm" variant="outline" onClick={() => setRemoving(t)}>Remove</Button>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Feature Flags"
        subtitle="Roll features out safely: Off → Test (testers only) → On (everyone). Every change is audited."
      />

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-muted/10">
          <h2 className="font-space font-bold text-ink dark:text-white">Flags</h2>
        </div>
        <AsyncBoundary query={flags} empty="No feature flags defined." isEmpty={(d) => d.data.length === 0}>
          {(d) => (
            <ul className="divide-y divide-muted/10">
              {d.data.map((flag) => (
                <li key={flag.key} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-ink dark:text-white">{flag.key}</p>
                    {flag.description && <p className="text-sm text-muted mt-0.5">{flag.description}</p>}
                    <p className="text-xs text-muted mt-1">Updated {formatDateTime(flag.updatedAt)}</p>
                  </div>
                  <div
                    role="radiogroup" aria-label={`${flag.key} mode`}
                    className="inline-flex shrink-0 p-1 rounded-xl bg-canvas dark:bg-ink/60"
                  >
                    {MODES.map(({ mode, label, hint }) => {
                      const active = flag.mode === mode;
                      const busy = setMode.isPending && setMode.variables?.key === flag.key && setMode.variables?.mode === mode;
                      return (
                        <button
                          key={mode} type="button" role="radio" aria-checked={active}
                          disabled={setMode.isPending}
                          onClick={() => choose(flag, mode)}
                          className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60',
                            active ? MODE_ACTIVE[mode] : 'text-muted hover:text-ink dark:hover:text-white',
                          )}
                        >
                          {busy ? '…' : label}
                          <span className="block text-[10px] font-normal opacity-80">{hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-space font-bold text-ink dark:text-white">Testers</h2>
            <p className="text-sm text-muted">
              Get every flag that is in <b>Test</b> mode. Add a vendor to cover all of that vendor&apos;s staff.
            </p>
          </div>
          <Button onClick={() => setAdding(true)}>+ Add tester</Button>
        </div>
        <AsyncBoundary query={testers} empty="No testers yet. Flags in Test mode reach nobody until you add one." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={testerColumns} rows={d.data} rowKey={(t) => t.id} layout="auto" />}
        </AsyncBoundary>
      </Card>

      <AddTesterModal open={adding} onClose={() => setAdding(false)} />

      <Modal
        open={!!confirmOn} onClose={() => setConfirmOn(null)} title="Turn on for everyone?"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmOn(null)}>Cancel</Button>
          <Button
            loading={setMode.isPending}
            onClick={() => confirmOn && setMode.mutate({ key: confirmOn.key, mode: 'on' })}
          >
            Turn on
          </Button>
        </>}
      >
        <p className="text-sm">
          <span className="font-mono font-semibold">{confirmOn?.key}</span> will be live for every user and vendor,
          not just testers. You can switch it back to Test or Off at any time.
        </p>
      </Modal>

      <Modal
        open={!!removing} onClose={() => setRemoving(null)} title="Remove tester?"
        footer={<>
          <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button variant="danger" loading={remove.isPending} onClick={() => removing && remove.mutate(removing)}>
            Remove
          </Button>
        </>}
      >
        <p className="text-sm">
          This {titleize(removing?.subjectType).toLowerCase()} loses access to every flag that is in Test mode.
        </p>
      </Modal>
    </>
  );
}
