'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';
import { ZonesPanel } from '@/components/admin/campus/ZonesPanel';
import { LocationsPanel } from '@/components/admin/campus/LocationsPanel';
import { SlotsPanel } from '@/components/admin/campus/SlotsPanel';

export default function CampusDetailPage() {
  // No single-campus GET endpoint; resolve from the list.
  const { campusId } = useParams<{ campusId: string }>();
  const query = useApiQuery(['campuses'], () => api.getCampuses({ limit: 100 }));
  const campus = query.data?.data.find((c) => c.id === campusId);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', timezone: '', currency: '', countryCode: '', active: true });

  const save = useApiAction(() => api.updateCampus(campusId, form), {
    invalidate: [['campuses']], success: 'Campus updated.', onSuccess: () => setEditOpen(false),
  });

  const openEdit = () => {
    if (!campus) return;
    setForm({ name: campus.name, timezone: campus.timezone ?? '', currency: campus.currency ?? '', countryCode: campus.countryCode ?? '', active: campus.active });
    setEditOpen(true);
  };

  return (
    <>
      <PageHeader title={campus?.name ?? 'Campus'} backHref="/campuses" actions={campus && <Button variant="outline" onClick={openEdit}>Edit Campus</Button>} />
      <AsyncBoundary query={query}>
        {() => {
          if (!campus) return <Card className="p-8 text-center text-muted">Campus not found.</Card>;
          return (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted font-mono">{campus.id}</p>
                  <StatusBadge status={campus.active ? 'active' : 'inactive'} />
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8">
                  <Field label="Slug">{campus.slug}</Field>
                  <Field label="Timezone">{campus.timezone}</Field>
                  <Field label="Currency">{campus.currency}</Field>
                  <Field label="Country">{campus.countryCode}</Field>
                </dl>
              </Card>

              <ZonesPanel campusId={campusId} />
              <LocationsPanel campusId={campusId} />
              <SlotsPanel campusId={campusId} />
            </div>
          );
        }}
      </AsyncBoundary>

      <Modal
        open={editOpen} onClose={() => setEditOpen(false)} title="Edit Campus"
        footer={<>
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            <TextField label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
          <TextField label="Country code" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
      </Modal>
    </>
  );
}
