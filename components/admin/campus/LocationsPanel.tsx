'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { LOCATION_TYPES, type CampusLocation, type LocationType } from '@/lib/types';
import { titleize } from '@/lib/format';
import { Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField, Select, TextArea } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

type Form = {
  zoneId: string; name: string; slug: string; type: LocationType;
  deliveryInstructions: string; active: boolean; displayOrder: number;
};
const empty: Form = { zoneId: '', name: '', slug: '', type: 'department', deliveryInstructions: '', active: true, displayOrder: 1 };
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function LocationsPanel({ campusId }: { campusId: string }) {
  const key = ['locations', campusId];
  const query = useApiQuery(key, () => api.getLocations(campusId, { limit: 100 }));
  const zonesQ = useApiQuery(['zones', campusId], () => api.getZones(campusId, { limit: 100 }));
  const zones = zonesQ.data?.data ?? [];

  const [editing, setEditing] = useState<CampusLocation | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [slugDirty, setSlugDirty] = useState(false);

  const save = useApiAction(
    () => {
      const body = { ...form, deliveryInstructions: form.deliveryInstructions || undefined };
      return editing ? api.updateLocation(editing.id, body) : api.createLocation(campusId, body);
    },
    { invalidate: [key], success: 'Location saved.', onSuccess: () => close() },
  );

  const close = () => { setEditing(null); setCreating(false); setForm(empty); setSlugDirty(false); };
  const openCreate = () => { setForm({ ...empty, zoneId: zones[0]?.id ?? '' }); setCreating(true); };
  const openEdit = (l: CampusLocation) => {
    setForm({ zoneId: l.zoneId, name: l.name, slug: l.slug, type: l.type, deliveryInstructions: l.deliveryInstructions ?? '', active: l.active, displayOrder: l.displayOrder });
    setSlugDirty(true); setEditing(l);
  };

  const columns: Column<CampusLocation>[] = [
    { header: 'Location', render: (l) => <span className="font-medium text-ink dark:text-white">{l.name}</span> },
    { header: 'Zone', render: (l) => l.zoneName },
    { header: 'Type', render: (l) => titleize(l.type) },
    { header: 'Order', align: 'right', render: (l) => l.displayOrder },
    { header: 'Status', render: (l) => <StatusBadge status={l.active ? 'active' : 'inactive'} /> },
    { header: '', align: 'right', render: (l) => <Button size="sm" variant="outline" onClick={() => openEdit(l)}>Edit</Button> },
  ];

  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug);
  const valid = form.zoneId && form.name && validSlug;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Dispatch Locations</h3>
          <p className="text-xs text-muted mt-0.5">Preset delivery points (departments, hostels).</p>
        </div>
        <Button size="sm" disabled={zones.length === 0} onClick={openCreate}>+ Add Location</Button>
      </div>
      {zones.length === 0 && <p className="px-5 pt-2 text-xs text-warning">Add a zone first — locations belong to a zone.</p>}
      <AsyncBoundary query={query} empty="No locations yet." isEmpty={(d) => d.data.length === 0}>
        {(d) => <DataTable columns={columns} rows={d.data} rowKey={(l) => l.id} />}
      </AsyncBoundary>

      <Modal
        open={creating || !!editing} onClose={close} title={editing ? 'Edit Location' : 'Add Location'} wide
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button loading={save.isPending} disabled={!valid} onClick={() => save.mutate()}>Save</Button>
        </>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Zone" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
            <option value="" disabled>Select zone</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Select>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LocationType })}>
            {LOCATION_TYPES.map((t) => <option key={t} value={t}>{titleize(t)}</option>)}
          </Select>
          <TextField
            label="Name" value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value, slug: slugDirty ? s.slug : slugify(e.target.value) }))}
          />
          <TextField
            label="Slug" value={form.slug}
            hint={form.slug && !validSlug ? 'Lowercase, hyphens.' : undefined}
            onChange={(e) => { setSlugDirty(true); setForm({ ...form, slug: e.target.value }); }}
          />
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm self-end pb-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
          <div className="sm:col-span-2">
            <TextArea label="Delivery instructions" value={form.deliveryInstructions} onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })} />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
