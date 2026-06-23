'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatDateTime, titleize } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField, TextArea } from '@/components/ui/Inputs';

export default function EscalationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { campusName, session } = useSession();
  const query = useApiQuery(['escalation', id], () => api.getEscalation(id));

  const [assignOpen, setAssignOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);

  const invalidate = [['escalation', id], ['escalations']];
  const assign = useApiAction(() => api.assignEscalation(id, adminUserId), {
    invalidate, success: 'Escalation assigned.', onSuccess: () => setAssignOpen(false),
  });
  const evidence = useApiAction(() => api.requestEscalationEvidence(id), { invalidate, success: 'Evidence requested.' });
  const resolve = useApiAction(() => api.resolveEscalation(id, resolution), {
    invalidate, success: 'Escalation resolved.', onSuccess: () => setResolveOpen(false),
  });
  const refund = useApiAction(() => api.refundEscalation(id), {
    invalidate, success: 'Marked refunded.', onSuccess: () => setRefundOpen(false),
  });

  return (
    <>
      <PageHeader title="Escalation" backHref="/escalations" />
      <AsyncBoundary query={query}>
        {(env) => {
          const e = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-space font-bold text-ink dark:text-white">{titleize(e.category)}</h2>
                  <StatusBadge status={e.status} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Order"><Link className="text-primary hover:underline" href={`/orders/${e.orderId}`}>{e.orderId}</Link></Field>
                  <Field label="Campus">{campusName(e.campusId)}</Field>
                  <Field label="Assignee">{e.assignedAdminId ?? '—'}</Field>
                  <Field label="Refund">{e.refundId ?? '—'}</Field>
                  <Field label="Opened">{formatDateTime(e.openedAt)}</Field>
                  <Field label="Resolved">{formatDateTime(e.resolvedAt)}</Field>
                </dl>
                <div className="mt-2">
                  <Field label="Description">{e.description}</Field>
                  <Field label="Resolution">{e.resolution ?? '—'}</Field>
                </div>
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Workflow</h3>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={() => { setAdminUserId(session?.userId ?? ''); setAssignOpen(true); }}>Assign</Button>
                  <Button className="w-full" variant="outline" loading={evidence.isPending} onClick={() => evidence.mutate()}>Request Evidence</Button>
                  <Button className="w-full" disabled={e.status === 'resolved'} onClick={() => setResolveOpen(true)}>Resolve</Button>
                  <Button className="w-full" variant="danger" onClick={() => setRefundOpen(true)}>Issue Refund</Button>
                </div>
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <Modal
        open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Escalation"
        footer={<>
          <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button loading={assign.isPending} disabled={!adminUserId} onClick={() => assign.mutate()}>Assign</Button>
        </>}
      >
        <TextField label="Admin user ID (UUID)" value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)} hint="Defaults to you." />
      </Modal>

      <Modal
        open={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve Escalation"
        footer={<>
          <Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancel</Button>
          <Button loading={resolve.isPending} disabled={resolution.length < 3} onClick={() => resolve.mutate()}>Resolve</Button>
        </>}
      >
        <TextArea label="Resolution" maxLength={1000} value={resolution} onChange={(e) => setResolution(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={refundOpen} onClose={() => setRefundOpen(false)} onConfirm={() => refund.mutate()}
        loading={refund.isPending} danger confirmLabel="Mark Refunded"
        title="Issue Refund" message="Mark this escalation as refunded and resolved? This triggers the refund flow."
      />
    </>
  );
}
