'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import type { DeliverySlot } from '@/lib/types';
import { Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

type Form = { name: string; time: string; cutoffMinutes: number; active: boolean; displayOrder: number };
const empty: Form = { name: '', time: '12:00', cutoffMinutes: 60, active: true, displayOrder: 1 };
// Backend stores HH:MM:SS; the <input type=time> works in HH:MM.
const toApi = (t: string) => (t.length === 5 ? `${t}:00` : t);
const toInput = (t: string) => t.slice(0, 5);

export function SlotsPanel({ campusId }: { campusId: string }) {
  const key = ['delivery-slots', campusId];
  const query = useApiQuery(key, () => api.getDeliverySlots(campusId, { limit: 100 }));

  const [editing, setEditing] = useState<DeliverySlot | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const save = useApiAction(
    () => {
      const body = { name: form.name, deliveryTime: toApi(form.time), cutoffMinutes: form.cutoffMinutes, active: form.active, displayOrder: form.displayOrder };
      return editing ? api.updateDeliverySlot(editing.id, body) : api.createDeliverySlot(campusId, body);
    },
    { invalidate: [key], success: 'Delivery slot saved.', onSuccess: () => close() },
  );

  const close = () => { setEditing(null); setCreating(false); setForm(empty); };
  const openCreate = () => { setForm(empty); setCreating(true); };
  const openEdit = (s: DeliverySlot) => {
    setForm({ name: s.name, time: toInput(s.deliveryTime), cutoffMinutes: s.cutoffMinutes, active: s.active, displayOrder: s.displayOrder });
    setEditing(s);
  };

  const columns: Column<DeliverySlot>[] = [
    { header: 'Slot', render: (s) => <span className="font-medium text-ink dark:text-white">{s.name}</span> },
    { header: 'Delivery Time', render: (s) => toInput(s.deliveryTime) },
    { header: 'Cutoff', render: (s) => `${s.cutoffMinutes} min before` },
    { header: 'Order', align: 'right', render: (s) => s.displayOrder },
    { header: 'Status', render: (s) => <StatusBadge status={s.active ? 'active' : 'inactive'} /> },
    { header: '', align: 'right', render: (s) => <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button> },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Delivery Slots</h3>
          <p className="text-xs text-muted mt-0.5">Available delivery times and ordering cutoffs.</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Slot</Button>
      </div>
      <AsyncBoundary query={query} empty="No delivery slots yet." isEmpty={(d) => d.data.length === 0}>
        {(d) => <DataTable columns={columns} rows={d.data} rowKey={(s) => s.id} />}
      </AsyncBoundary>

      <Modal
        open={creating || !!editing} onClose={close} title={editing ? 'Edit Delivery Slot' : 'Add Delivery Slot'}
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button loading={save.isPending} disabled={!form.name || !form.time} onClick={() => save.mutate()}>Save</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="Name" value={form.name} placeholder="e.g. Lunch" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Delivery time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <TextField label="Cutoff (minutes before)" type="number" value={form.cutoffMinutes} onChange={(e) => setForm({ ...form, cutoffMinutes: Number(e.target.value) })} />
          </div>
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
      </Modal>
    </Card>
  );
}
