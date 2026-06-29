'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import {
  type Zone,
  MIN_DELIVERY_FEE_KOBO, ORDER_CAP_KOBO, RIDER_SHARE_KOBO, DEFAULT_DELIVERY_FEE_KOBO,
} from '@/lib/types';
import { formatKobo, koboToNaira, nairaToKobo } from '@/lib/format';
import { Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

type Form = { name: string; code: string; active: boolean; displayOrder: number; deliveryFeeKobo: number };
const empty: Form = { name: '', code: '', active: true, displayOrder: 1, deliveryFeeKobo: DEFAULT_DELIVERY_FEE_KOBO };

export function ZonesPanel({ campusId }: { campusId: string }) {
  const key = ['zones', campusId];
  const query = useApiQuery(key, () => api.getZones(campusId, { limit: 100 }));

  const [editing, setEditing] = useState<Zone | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const save = useApiAction(
    () => (editing ? api.updateZone(editing.id, form) : api.createZone(campusId, form)),
    { invalidate: [key, ['locations', campusId]], success: 'Zone saved.', onSuccess: () => close() },
  );

  const close = () => { setEditing(null); setCreating(false); setForm(empty); };
  const openCreate = () => { setForm(empty); setCreating(true); };
  const openEdit = (z: Zone) => { setForm({ name: z.name, code: z.code, active: z.active, displayOrder: z.displayOrder, deliveryFeeKobo: z.deliveryFeeKobo }); setEditing(z); };

  const fee = form.deliveryFeeKobo;
  const feeValid = Number.isFinite(fee) && fee >= MIN_DELIVERY_FEE_KOBO && fee <= ORDER_CAP_KOBO;

  const columns: Column<Zone>[] = [
    { header: 'Zone', render: (z) => <span className="font-medium text-ink dark:text-white">{z.name}</span> },
    { header: 'Code', render: (z) => z.code },
    { header: 'Delivery fee', align: 'right', render: (z) => formatKobo(z.deliveryFeeKobo) },
    { header: 'Order', align: 'right', render: (z) => z.displayOrder },
    { header: 'Status', render: (z) => <StatusBadge status={z.active ? 'active' : 'inactive'} /> },
    { header: '', align: 'right', render: (z) => <Button size="sm" variant="outline" onClick={() => openEdit(z)}>Edit</Button> },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Zones</h3>
        <Button size="sm" onClick={openCreate}>+ Add Zone</Button>
      </div>
      <AsyncBoundary query={query} empty="No zones yet." isEmpty={(d) => d.data.length === 0}>
        {(d) => <DataTable columns={columns} rows={d.data} rowKey={(z) => z.id} />}
      </AsyncBoundary>

      <Modal
        open={creating || !!editing} onClose={close} title={editing ? 'Edit Zone' : 'Add Zone'}
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button loading={save.isPending} disabled={!form.name || !form.code || !feeValid} onClick={() => save.mutate()}>Save</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <TextField
            label="Delivery fee (₦)" type="number" min={MIN_DELIVERY_FEE_KOBO / 100} max={ORDER_CAP_KOBO / 100} step="1"
            value={koboToNaira(form.deliveryFeeKobo)}
            onChange={(e) => setForm({ ...form, deliveryFeeKobo: nairaToKobo(e.target.value) })}
            hint={
              feeValid
                ? `Rider nets ${formatKobo(RIDER_SHARE_KOBO)}; platform nets ${formatKobo(fee - RIDER_SHARE_KOBO)}.`
                : `Must be between ${formatKobo(MIN_DELIVERY_FEE_KOBO)} and ${formatKobo(ORDER_CAP_KOBO)}.`
            }
          />
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
          </label>
        </div>
      </Modal>
    </Card>
  );
}
