'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { formatDate } from '@/lib/format';
import type { Campus } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const columns: Column<Campus>[] = [
  {
    header: 'University / Campus',
    render: (c) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{c.name}</div>
        <div className="text-xs text-muted">{c.slug}</div>
      </div>
    ),
  },
  { header: 'Timezone', render: (c) => c.timezone ?? '—' },
  { header: 'Currency', render: (c) => c.currency ?? '—' },
  { header: 'Status', render: (c) => <StatusBadge status={c.active ? 'active' : 'inactive'} /> },
  { header: 'Created', align: 'right', render: (c) => formatDate(c.createdAt) },
];

export default function CampusesPage() {
  const query = useApiQuery(['campuses'], () => api.getCampuses({ limit: 100 }));

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', slug: '', timezone: 'Africa/Lagos', currency: 'NGN', countryCode: 'NG' });
  const [slugDirty, setSlugDirty] = useState(false);

  const create = useApiAction(
    () => api.createCampus({ ...f, active: true }),
    { invalidate: [['campuses']], success: 'Campus created.', onSuccess: () => { setOpen(false); setF({ name: '', slug: '', timezone: 'Africa/Lagos', currency: 'NGN', countryCode: 'NG' }); setSlugDirty(false); } },
  );

  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug);
  const valid = f.name.length >= 2 && validSlug && f.timezone && f.currency && f.countryCode;

  return (
    <>
      <PageHeader
        title="Campuses"
        subtitle="Onboard universities and manage zones, dispatch locations and delivery times."
        actions={<Button onClick={() => setOpen(true)}>+ Add Campus</Button>}
      />
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty="No campuses yet." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={columns} rows={d.data} rowKey={(c) => c.id} rowHref={(c) => `/campuses/${c.id}`} />}
        </AsyncBoundary>
      </Card>

      <Modal
        open={open} onClose={() => setOpen(false)} title="Onboard University"
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={create.isPending} disabled={!valid} onClick={() => create.mutate()}>Create</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField
            label="Name" value={f.name} minLength={2} required
            onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: slugDirty ? s.slug : slugify(e.target.value) }))}
          />
          <TextField
            label="Slug" value={f.slug} required
            hint={f.slug && !validSlug ? 'Lowercase letters, numbers and single hyphens.' : undefined}
            onChange={(e) => { setSlugDirty(true); setF((s) => ({ ...s, slug: e.target.value })); }}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Timezone" value={f.timezone} onChange={(e) => setF((s) => ({ ...s, timezone: e.target.value }))} />
            <TextField label="Currency" value={f.currency} onChange={(e) => setF((s) => ({ ...s, currency: e.target.value }))} />
          </div>
          <TextField label="Country code" value={f.countryCode} onChange={(e) => setF((s) => ({ ...s, countryCode: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
}
