'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/lib/session';
import { formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Inputs';
import { PermissionAction } from '@/components/admin/Permission';
import { CopyButton } from '@/components/admin/finance/FinanceUI';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const toast = useToast();
  const { isSuperAdmin, campusName, session } = useSession();
  const query = useApiQuery(['user', userId], () => api.getUser(userId));
  const user = query.data?.data;
  const isSelf = session?.userId === userId;

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [supportText, setSupportText] = useState('');
  const invalidate = [['user', userId], ['users']];
  const suspend = useApiAction(() => api.suspendUser(userId), {
    invalidate, success: 'User suspended.', onSuccess: () => setSuspendOpen(false),
  });
  const activate = useApiAction(() => api.activateUser(userId), { invalidate, success: 'User activated.' });
  const deleteUser = useApiAction(() => api.deleteUser(userId), {
    invalidate: [['users']],
    onSuccess: (res) => {
      setDeleteOpen(false);
      if (res?.data?.outcome === 'anonymized') {
        toast.success('User had transaction history — account anonymized and login disabled.');
      } else {
        toast.success('User permanently deleted.');
      }
      router.push('/users');
    },
  });
  const addNote = useApiAction(() => api.addUserNote(userId, { note: supportText }), {
    invalidate, success: 'Internal note added.', onSuccess: () => { setNoteOpen(false); setSupportText(''); },
  });
  const escalate = useApiAction(() => api.escalateUserIssue(userId, { reason: supportText }), {
    invalidate, success: 'Customer issue escalated.', onSuccess: () => { setEscalateOpen(false); setSupportText(''); },
  });
  const resolve = useApiAction(() => api.markUserIssueResolved(userId, { note: supportText || undefined }), {
    invalidate, success: 'Customer issue marked resolved.', onSuccess: () => { setResolveOpen(false); setSupportText(''); },
  });

  return (
    <>
      <PageHeader title="User Account" backHref="/users" />
      <AsyncBoundary query={query}>
        {(env) => {
          const u = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{u.displayName}</h2>
                    <p className="text-xs text-muted font-mono">{u.id}</p>
                  </div>
                  <StatusBadge status={u.accountStatus} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Email">{u.email ?? '—'}</Field>
                  <Field label="Phone">{u.phoneNumber ?? '—'}</Field>
                  <Field label="Default Campus">{campusName(u.defaultCampusId)}</Field>
                  <Field label="Created">{formatDateTime(u.createdAt)}</Field>
                </dl>
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Actions</h3>
                <div className="space-y-3">
                  {isSuperAdmin ? (
                    <>
                    {u.accountStatus === 'active' ? (
                      <Button className="w-full" variant="danger" onClick={() => setSuspendOpen(true)}>Suspend</Button>
                    ) : (
                      <Button className="w-full" loading={activate.isPending} onClick={() => activate.mutate()}>Activate</Button>
                    )}
                    <Button className="w-full" variant="danger" disabled={isSelf} onClick={() => setDeleteOpen(true)}>Delete account</Button>
                    {isSelf && <p className="text-xs text-muted">You cannot delete your own account.</p>}
                    </>
                  ) : (
                    <p className="text-sm text-muted">Account status changes require a super admin.</p>
                  )}
                  <CopyButton value={u.email} label="Copy customer email" />
                  <CopyButton value={u.phoneNumber} label="Copy customer phone" />
                  <Button className="w-full" variant="outline" onClick={() => { window.location.href = `/orders?search=${encodeURIComponent(u.email ?? u.id)}`; }}>
                    Open customer order history
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => { window.location.href = `/payments?search=${encodeURIComponent(u.email ?? u.phoneNumber ?? u.id)}`; }}>
                    Open payment history
                  </Button>
                  <PermissionAction className="w-full" variant="subtle" action="support.note" onClick={() => setNoteOpen(true)}>
                    Add internal note
                  </PermissionAction>
                  <PermissionAction className="w-full" variant="subtle" action="support.escalate" onClick={() => setEscalateOpen(true)}>
                    Escalate issue
                  </PermissionAction>
                  <PermissionAction className="w-full" variant="subtle" action="support.resolve" onClick={() => setResolveOpen(true)}>
                    Mark issue resolved
                  </PermissionAction>
                </div>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <ConfirmDialog
        open={suspendOpen} onClose={() => setSuspendOpen(false)} onConfirm={() => suspend.mutate()}
        loading={suspend.isPending} danger confirmLabel="Suspend"
        title="Suspend User" message="Suspended users cannot place orders. Continue?"
      />
      <ConfirmDialog
        open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteUser.mutate()}
        loading={deleteUser.isPending} danger confirmLabel="Delete account"
        title="Delete User Account"
        message="This permanently removes the account. Users with order history are anonymized (data scrubbed, login disabled); others are fully deleted. This cannot be undone."
      />
      <Modal
        open={noteOpen} onClose={() => setNoteOpen(false)} title="Add internal note"
        footer={<>
          <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
          <PermissionAction action="support.note" loading={addNote.isPending} disabled={!supportText.trim()} onClick={() => addNote.mutate()}>Add internal note</PermissionAction>
        </>}
      >
        <TextArea label="Internal note" value={supportText} onChange={(e) => setSupportText(e.target.value)} />
      </Modal>
      <Modal
        open={escalateOpen} onClose={() => setEscalateOpen(false)} title="Escalate issue"
        footer={<>
          <Button variant="ghost" onClick={() => setEscalateOpen(false)}>Cancel</Button>
          <PermissionAction action="support.escalate" loading={escalate.isPending} disabled={!supportText.trim()} onClick={() => escalate.mutate()}>Escalate issue</PermissionAction>
        </>}
      >
        <TextArea label="Escalation reason" value={supportText} onChange={(e) => setSupportText(e.target.value)} />
      </Modal>
      <Modal
        open={resolveOpen} onClose={() => setResolveOpen(false)} title="Mark issue resolved"
        footer={<>
          <Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancel</Button>
          <PermissionAction action="support.resolve" loading={resolve.isPending} onClick={() => resolve.mutate()}>Mark issue resolved</PermissionAction>
        </>}
      >
        <TextArea label="Resolution note" value={supportText} onChange={(e) => setSupportText(e.target.value)} />
      </Modal>
    </>
  );
}
