'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { INVENTORY_STATES, type InventoryRow } from '@/lib/types';
import { titleize } from '@/lib/format';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterSelect, TextField, TextArea } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

function stateOf(remaining: number) {
  if (remaining <= 0) return 'sold_out';
  if (remaining <= 5) return 'low';
  return 'available';
}

export default function InventoryPage() {
  const { scopeCampusId } = useSession();
  const [date, setDate] = useState('');
  const [state, setState] = useState('');
  const [target, setTarget] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const query = useApiQuery(
    ['inventory', scopeCampusId, date, state],
    () => api.getInventory({ campusId: scopeCampusId ?? undefined, date: date || undefined, state: state || undefined }),
  );

  const adjust = useApiAction(
    () => api.adjustInventory(target!.id, { delta: Number(delta), reason }),
    {
      invalidate: [['inventory']],
      success: 'Adjustment recorded.',
      onSuccess: () => { setTarget(null); setDelta(''); setReason(''); },
    },
  );

  const columns: Column<InventoryRow>[] = [
    { header: 'Item', render: (r) => <span className="font-medium text-ink dark:text-white">{r.menuItemName}</span> },
    { header: 'Service Date', render: (r) => r.serviceDate },
    { header: 'Total', align: 'right', render: (r) => r.quantityTotal },
    { header: 'Reserved', align: 'right', render: (r) => r.quantityReserved },
    { header: 'Sold', align: 'right', render: (r) => r.quantitySold },
    { header: 'Remaining', align: 'right', render: (r) => <span className="font-bold">{r.remainingQuantity}</span> },
    { header: 'State', render: (r) => <StatusBadge status={stateOf(r.remainingQuantity)} /> },
    {
      header: '', align: 'right',
      render: (r) => <Button size="sm" variant="outline" onClick={() => setTarget(r)}>Adjust</Button>,
    },
  ];

  const validDelta = delta !== '' && Number.isInteger(Number(delta));

  return (
    <>
      <PageHeader title="Inventory Oversight" subtitle="Monitor stock and record audited adjustments." />
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
        <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
        <FilterSelect value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>
          {INVENTORY_STATES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
        </FilterSelect>
      </div>
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty="No inventory rows for these filters." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={columns} rows={d.data} rowKey={(r) => r.id} />}
        </AsyncBoundary>
      </Card>

      <Modal
        open={!!target} onClose={() => setTarget(null)} title="Record Inventory Adjustment"
        footer={<>
          <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
          <Button loading={adjust.isPending} disabled={!validDelta || reason.length < 3} onClick={() => adjust.mutate()}>Record</Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">{target?.menuItemName} · remaining {target?.remainingQuantity}</p>
          <TextField label="Delta (signed integer)" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} hint="Positive adds stock, negative removes." />
          <TextArea label="Reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
