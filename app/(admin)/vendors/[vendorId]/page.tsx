'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo, formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, Stat, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField, TextArea, Select } from '@/components/ui/Inputs';

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['vendor', vendorId], () => api.getVendor(vendorId));
  const perfQ = useApiQuery(['vendor', vendorId, 'performance'], () => api.getVendorPerformance(vendorId));
  const vendor = query.data?.data;

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', description: '', phone: '', active: true });
  const [userOpen, setUserOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'staff'>('staff');
  const [suspendOpen, setSuspendOpen] = useState(false);

  const invalidate = [['vendor', vendorId], ['vendors']];
  const save = useApiAction(() => api.updateVendor(vendorId, form), {
    invalidate, success: 'Vendor updated.', onSuccess: () => setEditOpen(false),
  });
  const approve = useApiAction(() => api.approveVendor(vendorId), { invalidate, success: 'Vendor approved.' });
  const activate = useApiAction(() => api.activateVendor(vendorId), { invalidate, success: 'Vendor activated.' });
  const suspend = useApiAction(() => api.suspendVendor(vendorId), {
    invalidate, success: 'Vendor suspended.', onSuccess: () => setSuspendOpen(false),
  });
  const addUser = useApiAction(() => api.addVendorUser(vendorId, { userId, role: userRole }), {
    invalidate, success: 'Vendor user added.', onSuccess: () => { setUserOpen(false); setUserId(''); },
  });

  const openEdit = () => {
    if (!vendor) return;
    setForm({
      displayName: vendor.displayName, description: vendor.description ?? '',
      phone: vendor.phone ?? '', active: vendor.active,
    });
    setEditOpen(true);
  };

  return (
    <>
      <PageHeader title="Vendor Detail" backHref="/vendors" />
      <AsyncBoundary query={query}>
        {(env) => {
          const v = env.data;
          const perf = perfQ.data?.data ?? {};
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Orders" value={perf.orderCount ?? 0} />
                <Stat label="Gross Sales" value={formatKobo(perf.grossSalesKobo)} />
                <Stat label="Reviews" value={perf.reviewCount ?? 0} />
                <Stat label="Avg Rating" value={perf.averageVendorRating ?? '—'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-space font-bold text-ink dark:text-white">{v.displayName}</h2>
                      <p className="text-xs text-muted font-mono">{v.id}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Field label="Legal Name">{v.legalName}</Field>
                    <Field label="Slug">{v.slug}</Field>
                    <Field label="Campus">{campusName(v.campusId)}</Field>
                    <Field label="Active">{v.active ? 'Yes' : 'No'}</Field>
                    <Field label="Phone">{v.phone ?? '—'}</Field>
                    <Field label="Email">{v.email ?? '—'}</Field>
                    <Field label="Description">{v.description ?? '—'}</Field>
                    <Field label="Created">{formatDateTime(v.createdAt)}</Field>
                  </dl>
                </Card>

                <Card className="p-6 h-fit">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline" onClick={openEdit}>Edit Details</Button>
                    {v.status !== 'approved' && (
                      <Button className="w-full" loading={approve.isPending} onClick={() => approve.mutate()}>Approve</Button>
                    )}
                    {v.status === 'suspended' || !v.active ? (
                      <Button className="w-full" loading={activate.isPending} onClick={() => activate.mutate()}>Activate</Button>
                    ) : (
                      <Button className="w-full" variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
                    )}
                    <Button className="w-full" variant="subtle" onClick={() => setUserOpen(true)}>Add Vendor User</Button>
                  </div>
                </Card>
              </div>
            </div>
          );
        }}
      </AsyncBoundary>

      <Modal
        open={editOpen} onClose={() => setEditOpen(false)} title="Edit Vendor"
        footer={<>
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="Display name" maxLength={120} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <TextArea label="Description" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
        </div>
      </Modal>

      <Modal
        open={userOpen} onClose={() => setUserOpen(false)} title="Add Vendor User"
        footer={<>
          <Button variant="ghost" onClick={() => setUserOpen(false)}>Cancel</Button>
          <Button loading={addUser.isPending} disabled={!userId} onClick={() => addUser.mutate()}>Add</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="User ID (UUID)" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Select label="Role" value={userRole} onChange={(e) => setUserRole(e.target.value as 'owner' | 'staff')}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        open={suspendOpen} onClose={() => setSuspendOpen(false)} onConfirm={() => suspend.mutate()}
        loading={suspend.isPending} danger confirmLabel="Suspend"
        title="Suspend Vendor" message="Suspended vendors cannot receive orders. Continue?"
      />
    </>
  );
}
