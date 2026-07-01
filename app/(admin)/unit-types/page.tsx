'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { type UnitType } from '@/lib/types';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

type Form = { code: string; displayName: string; countsTowardSpoonLimit: boolean };
const empty: Form = { code: '', displayName: '', countsTowardSpoonLimit: false };

export default function UnitTypesPage() {
  const key = ['unit-types'];
  const query = useApiQuery(key, () => api.getUnitTypes({ limit: 100 }));

  const [editing, setEditing] = useState<UnitType | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const close = () => { setEditing(null); setCreating(false); setForm(empty); };
  const openCreate = () => { setForm(empty); setCreating(true); };
  const openEdit = (u: UnitType) => {
    setForm({ code: u.code, displayName: u.displayName, countsTowardSpoonLimit: u.countsTowardSpoonLimit });
    setEditing(u);
  };

  // Code is immutable after creation, so edits only send the mutable fields.
  const save = useApiAction(
    () => (editing
      ? api.updateUnitType(editing.id, {
          displayName: form.displayName,
          countsTowardSpoonLimit: form.countsTowardSpoonLimit,
        })
      : api.createUnitType(form)),
    { invalidate: [key], success: 'Unit type saved.', onSuccess: () => close() },
  );

  const toggleActive = useApiAction(
    (u: UnitType) => api.updateUnitType(u.id, { active: !u.active }),
    { invalidate: [key], success: 'Unit type updated.' },
  );

  const columns: Column<UnitType>[] = [
    { header: 'Code', render: (u) => <span className="font-mono text-ink dark:text-white">{u.code}</span> },
    { header: 'Display Name', render: (u) => <span className="font-medium text-ink dark:text-white">{u.displayName}</span> },
    { header: 'Counts toward spoon limit', render: (u) => (u.countsTowardSpoonLimit ? 'Yes' : 'No') },
    { header: 'Active', render: (u) => <StatusBadge status={u.active ? 'active' : 'inactive'} /> },
    {
      header: '', align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm" variant={u.active ? 'outline' : 'primary'}
            loading={toggleActive.isPending && toggleActive.variables?.id === u.id}
            onClick={() => toggleActive.mutate(u)}
          >
            {u.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Unit Types"
        subtitle="Global units shared by all vendors. Codes are permanent once created."
        actions={<Button onClick={openCreate}>+ Add unit type</Button>}
      />
      <Card className="overflow-hidden">
        <AsyncBoundary query={query} empty="No unit types yet." isEmpty={(d) => d.data.length === 0}>
          {(d) => <DataTable columns={columns} rows={d.data} rowKey={(u) => u.id} />}
        </AsyncBoundary>
      </Card>

      <Modal
        open={creating || !!editing} onClose={close} title={editing ? 'Edit Unit Type' : 'Add Unit Type'}
        footer={<>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            loading={save.isPending}
            disabled={!form.displayName || (!editing && !form.code)}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </>}
      >
        <div className="space-y-4">
          {editing ? (
            <div>
              <span className="block text-sm font-medium text-ink dark:text-muted mb-1">Code</span>
              <p className="font-mono text-sm text-muted">{editing.code}</p>
              <span className="block text-xs text-muted mt-1">Code is permanent and cannot be changed.</span>
            </div>
          ) : (
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              hint="Immutable machine key, e.g. spoon, plate, wrap."
            />
          )}
          <TextField
            label="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.countsTowardSpoonLimit}
              onChange={(e) => setForm({ ...form, countsTowardSpoonLimit: e.target.checked })}
            /> Counts toward spoon limit
          </label>
        </div>
      </Modal>
    </>
  );
}
