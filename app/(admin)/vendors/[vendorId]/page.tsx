'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useToast } from '@/components/ui/Toast';
import { formatKobo, formatDateTime, koboToNaira, nairaToKobo } from '@/lib/format';
import { PageHeader, Card, Field, Stat, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField, TextArea, Select } from '@/components/ui/Inputs';
import { DataTable } from '@/components/ui/DataTable';
import type { MenuItem, VendorInvitation, VendorInvitationCreated, VendorUserRole } from '@/lib/types';

type MenuForm = {
  name: string;
  priceKobo: number;
  unitTypeId: string;
  categoryId: string; // '' = none
  description: string;
  requiresSoup: boolean;
};
const emptyMenuForm: MenuForm = {
  name: '', priceKobo: 0, unitTypeId: '', categoryId: '', description: '', requiresSoup: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invitationStatus(inv: VendorInvitation): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (inv.revokedAt) return { label: 'revoked', tone: 'danger' };
  if (inv.acceptedAt) return { label: 'accepted', tone: 'success' };
  return { label: 'pending', tone: 'warning' };
}

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { campusName } = useSession();
  const toast = useToast();
  const query = useApiQuery(['vendor', vendorId], () => api.getVendor(vendorId));
  const perfQ = useApiQuery(['vendor', vendorId, 'performance'], () => api.getVendorPerformance(vendorId));
  const invitationsQ = useApiQuery(['vendor', vendorId, 'invitations'], () => api.getVendorInvitations(vendorId));
  const menuItemsQ = useApiQuery(['vendor', vendorId, 'menu-items'], () => api.getVendorMenuItems(vendorId));
  const menuMetaQ = useApiQuery(['vendor', vendorId, 'menu-metadata'], () => api.getVendorMenuMetadata(vendorId));
  const vendor = query.data?.data;

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ displayName: '', description: '', phone: '', active: true });
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<VendorUserRole>('staff');
  const [inviteHours, setInviteHours] = useState(72);
  const [inviteResult, setInviteResult] = useState<VendorInvitationCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const inviteCountdown = useCountdown(inviteResult?.expiresAt);

  // Menu management
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuEditing, setMenuEditing] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState<MenuForm>(emptyMenuForm);
  const menuInvalidate = [['vendor', vendorId, 'menu-items'], ['vendor', vendorId, 'menu-metadata']];
  const unitTypes = menuMetaQ.data?.data.unitTypes ?? [];
  const categories = menuMetaQ.data?.data.categories ?? [];

  const openMenuCreate = () => { setMenuEditing(null); setMenuForm(emptyMenuForm); setMenuOpen(true); };
  const openMenuEdit = (item: MenuItem) => {
    setMenuEditing(item);
    setMenuForm({
      name: item.name, priceKobo: item.priceKobo, unitTypeId: item.unitTypeId,
      categoryId: item.categoryId ?? '', description: item.description ?? '', requiresSoup: item.requiresSoup,
    });
    setMenuOpen(true);
  };
  const menuFormValid = menuForm.name.trim().length > 0 && menuForm.unitTypeId !== '' && menuForm.priceKobo >= 0;
  const saveMenu = useApiAction(
    () => {
      const body = {
        name: menuForm.name.trim(),
        priceKobo: menuForm.priceKobo,
        unitTypeId: menuForm.unitTypeId,
        categoryId: menuForm.categoryId === '' ? null : menuForm.categoryId,
        description: menuForm.description.trim() === '' ? null : menuForm.description.trim(),
        requiresSoup: menuForm.requiresSoup,
      };
      return menuEditing
        ? api.updateVendorMenuItem(vendorId, menuEditing.id, body)
        : api.createVendorMenuItem(vendorId, body);
    },
    { invalidate: menuInvalidate, success: 'Menu item saved.', onSuccess: () => setMenuOpen(false) },
  );
  const toggleMenuActive = useApiAction(
    (item: MenuItem) => (item.active
      ? api.deactivateVendorMenuItem(vendorId, item.id)
      : api.activateVendorMenuItem(vendorId, item.id)),
    { invalidate: menuInvalidate, success: 'Menu item updated.' },
  );

  const invalidate = [['vendor', vendorId], ['vendors']];
  const save = useApiAction(() => api.updateVendor(vendorId, form), {
    invalidate, success: 'Vendor updated.', onSuccess: () => setEditOpen(false),
  });
  const approve = useApiAction(() => api.approveVendor(vendorId), { invalidate, success: 'Vendor approved.' });
  const activate = useApiAction(() => api.activateVendor(vendorId), { invalidate, success: 'Vendor activated.' });
  const suspend = useApiAction(() => api.suspendVendor(vendorId), {
    invalidate, success: 'Vendor suspended.', onSuccess: () => setSuspendOpen(false),
  });
  const invite = useApiAction(
    () => api.createVendorInvitation(vendorId, { email: inviteEmail, role: inviteRole, expiresInHours: inviteHours }),
    {
      invalidate: [['vendor', vendorId, 'invitations']],
      onSuccess: (res) => { setInviteResult(res.data); setInviteEmail(''); setCopied(false); },
    },
  );

  const closeInvite = () => {
    setInviteOpen(false); setInviteResult(null); setInviteEmail(''); setInviteRole('staff'); setInviteHours(72);
  };
  const copyInviteUrl = async () => {
    if (!inviteResult) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      toast.success('Invite link copied.');
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

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
                    <Button className="w-full" variant="subtle" onClick={() => setInviteOpen(true)}>Invite Vendor User</Button>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Vendor Invitations</h3>
                {invitationsQ.data?.data.length ? (
                  <DataTable<VendorInvitation>
                    rowKey={(r) => r.id}
                    columns={[
                      { header: 'Email', render: (r) => r.email },
                      { header: 'Role', render: (r) => <span className="capitalize">{r.role}</span> },
                      { header: 'Status', render: (r) => {
                        const s = invitationStatus(r);
                        return <StatusBadge status={s.label} tone={s.tone} />;
                      } },
                      { header: 'Invited At', render: (r) => formatDateTime(r.createdAt) },
                      { header: 'Expires At', render: (r) => formatDateTime(r.expiresAt) },
                      { header: 'Invited By', render: (r) => r.createdByAdminId },
                    ]}
                    rows={invitationsQ.data.data}
                  />
                ) : (
                  <p className="text-sm text-muted">No invitations sent yet.</p>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Menu</h3>
                  <Button size="sm" onClick={openMenuCreate} disabled={menuMetaQ.isLoading}>Add Item</Button>
                </div>
                {menuItemsQ.data?.data.length ? (
                  <DataTable<MenuItem>
                    rowKey={(r) => r.id}
                    columns={[
                      { header: 'Name', render: (r) => (
                        <div>
                          <div className="font-medium text-ink dark:text-white">{r.name}</div>
                          {r.description && <div className="text-xs text-muted line-clamp-1">{r.description}</div>}
                        </div>
                      ) },
                      { header: 'Category', render: (r) => r.categoryName ?? '—' },
                      { header: 'Unit', render: (r) => r.unitCode },
                      { header: 'Price', render: (r) => formatKobo(r.priceKobo) },
                      { header: 'Soup', render: (r) => (r.requiresSoup ? 'Required' : '—') },
                      { header: 'Status', render: (r) => (
                        <StatusBadge status={r.active ? 'active' : 'inactive'} tone={r.active ? 'success' : 'warning'} />
                      ) },
                      { header: '', render: (r) => (
                        <div className="flex items-center gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openMenuEdit(r)}>Edit</Button>
                          <Button
                            size="sm" variant={r.active ? 'subtle' : 'primary'}
                            loading={toggleMenuActive.isPending}
                            onClick={() => toggleMenuActive.mutate(r)}
                          >
                            {r.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      ) },
                    ]}
                    rows={menuItemsQ.data.data}
                  />
                ) : (
                  <p className="text-sm text-muted">No menu items yet. Add the vendor&apos;s first item.</p>
                )}
              </Card>
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
        open={menuOpen} onClose={() => setMenuOpen(false)}
        title={menuEditing ? 'Edit Menu Item' : 'Add Menu Item'}
        footer={<>
          <Button variant="ghost" onClick={() => setMenuOpen(false)}>Cancel</Button>
          <Button loading={saveMenu.isPending} disabled={!menuFormValid} onClick={() => saveMenu.mutate()}>Save</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField
            label="Name" maxLength={180} value={menuForm.name}
            onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
          />
          <TextField
            label="Price (₦)" type="number" min={0} step="1"
            value={koboToNaira(menuForm.priceKobo)}
            onChange={(e) => setMenuForm({ ...menuForm, priceKobo: nairaToKobo(e.target.value) })}
          />
          <Select
            label="Unit type" value={menuForm.unitTypeId}
            onChange={(e) => setMenuForm({ ...menuForm, unitTypeId: e.target.value })}
          >
            <option value="" disabled>Select a unit type…</option>
            {unitTypes.map((u) => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </Select>
          <Select
            label="Category" value={menuForm.categoryId}
            onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
          >
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <TextArea
            label="Description" maxLength={1000} value={menuForm.description}
            onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={menuForm.requiresSoup}
              onChange={(e) => setMenuForm({ ...menuForm, requiresSoup: e.target.checked })}
            />
            Requires soup selection
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={suspendOpen} onClose={() => setSuspendOpen(false)} onConfirm={() => suspend.mutate()}
        loading={suspend.isPending} danger confirmLabel="Suspend"
        title="Suspend Vendor" message="Suspended vendors cannot receive orders. Continue?"
      />

      <Modal
        open={inviteOpen} onClose={closeInvite} title="Invite Vendor User"
        footer={inviteResult ? (
          <Button onClick={closeInvite}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={closeInvite}>Cancel</Button>
            <Button
              loading={invite.isPending}
              disabled={!EMAIL_RE.test(inviteEmail) || inviteHours < 1 || inviteHours > 168}
              onClick={() => invite.mutate()}
            >
              Send Invite
            </Button>
          </>
        )}
      >
        {inviteResult ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning">
              This link is shown once. The raw token is not stored and cannot be retrieved again — copy it now.
            </div>
            <div>
              <span className="block text-sm font-medium text-ink dark:text-muted mb-1">Invite URL</span>
              <div className="flex items-center gap-2">
                <input
                  readOnly value={inviteResult.inviteUrl}
                  className="w-full px-3 py-2 rounded-xl bg-surface dark:bg-ink/50 border border-muted/20 text-xs font-mono outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button variant="outline" size="sm" onClick={copyInviteUrl}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Field label="Expires">{formatDateTime(inviteResult.expiresAt)} ({inviteCountdown})</Field>
          </div>
        ) : (
          <div className="space-y-4">
            <TextField
              label="Email" type="email" value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              hint="A signup link is generated for whoever should accept this invite."
            />
            <Select
              label="Role" value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as VendorUserRole)}
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </Select>
            <TextField
              label="Expires in (hours)" type="number" min={1} max={168}
              value={inviteHours}
              onChange={(e) => setInviteHours(Number(e.target.value))}
              hint="1–168 hours. Defaults to 72."
            />
          </div>
        )}
      </Modal>
    </>
  );
}
