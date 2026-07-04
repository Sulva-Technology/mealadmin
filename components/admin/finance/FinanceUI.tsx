'use client';

import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card, Field } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatKobo, titleize } from '@/lib/format';
import type { PaymentEvent, PaymentListItem, RefundListItem, WebhookEvent } from '@/lib/types';

export function CopyButton({ value, label }: { value?: string | null; label: string }) {
  const toast = useToast();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={!value}
      onClick={(event) => {
        event.stopPropagation();
        if (!value) return;
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied.`);
      }}
    >
      <Copy className="w-4 h-4" /> {label}
    </Button>
  );
}

export function MoneyPair({
  expected,
  paid,
  currency,
}: {
  expected: number;
  paid: number;
  currency?: string | null;
}) {
  const mismatch = expected !== paid;
  return (
    <div className="space-y-1">
      <div className="font-semibold">{formatKobo(paid)}</div>
      <div className={mismatch ? 'text-xs text-danger' : 'text-xs text-muted'}>
        Expected {formatKobo(expected)} {currency ?? ''}
      </div>
    </div>
  );
}

export function PaymentIdentity({ payment }: { payment: PaymentListItem }) {
  return (
    <div>
      <div className="font-semibold text-ink dark:text-white">{payment.paymentReference}</div>
      <div className="text-xs text-muted">{payment.paystackReference ?? 'No Paystack reference'}</div>
    </div>
  );
}

export function CustomerCell({
  name,
  email,
  phone,
}: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return (
    <div>
      <div className="font-medium text-ink dark:text-white">{name ?? email ?? phone ?? 'Unknown customer'}</div>
      <div className="text-xs text-muted">{email ?? 'No email'} {phone ? `· ${phone}` : ''}</div>
    </div>
  );
}

export function Timeline({ events = [] }: { events?: PaymentEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted">No timeline events returned by backend.</p>;
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="border-l-2 border-primary/25 pl-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink dark:text-white">{titleize(event.type)}</span>
            {event.status && <StatusBadge status={event.status} />}
          </div>
          {event.message && <p className="text-sm text-muted mt-1">{event.message}</p>}
          <p className="text-xs text-muted mt-1">{formatDateTime(event.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

export function NotesList({ notes = [] }: { notes?: { id: string; note: string; createdAt: string }[] }) {
  if (!notes.length) return <p className="text-sm text-muted">No internal notes yet.</p>;
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="rounded-xl bg-canvas dark:bg-ink/50 p-3">
          <p className="text-sm text-ink dark:text-white">{note.note}</p>
          <p className="text-xs text-muted mt-1">{formatDateTime(note.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

export function WebhookMiniTable({ events = [] }: { events?: WebhookEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted">No webhook events returned by backend.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted uppercase">
          <tr>
            <th className="text-left py-2">Event</th>
            <th className="text-left py-2">Signature</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Received</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted/10">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="py-2">{event.eventType}</td>
              <td className="py-2">{event.signatureVerified ? 'Verified' : 'Not verified'}</td>
              <td className="py-2"><StatusBadge status={event.processingStatus} /></td>
              <td className="py-2">{formatDateTime(event.receivedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RefundMiniTable({ refunds = [] }: { refunds?: RefundListItem[] }) {
  if (!refunds.length) return <p className="text-sm text-muted">No refund history returned by backend.</p>;
  return (
    <div className="space-y-3">
      {refunds.map((refund) => (
        <Link key={refund.id} href={`/refunds/${refund.id}`} className="block rounded-xl bg-canvas dark:bg-ink/50 p-3 hover:bg-canvas/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink dark:text-white">{refund.id}</p>
              <p className="text-xs text-muted">{refund.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatKobo(refund.amountKobo)}</p>
              <StatusBadge status={refund.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function SupportLinkGrid({ payment }: { payment: PaymentListItem }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Support links</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CopyButton value={payment.paymentReference} label="Copy payment reference" />
        <CopyButton value={payment.orderId} label="Copy order ID" />
        <CopyButton value={payment.customerEmail ?? payment.customerPhone} label="Copy customer contact" />
        <Link
          href={`/orders/${payment.orderId}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-muted/30 text-ink dark:text-muted hover:bg-canvas dark:hover:bg-ink/60 font-medium"
        >
          <ExternalLink className="w-4 h-4" /> Open order
        </Link>
      </div>
    </Card>
  );
}

export function SettlementImpact({
  impact,
}: {
  impact?: { settlementId?: string | null; affected: boolean; message?: string | null; warning?: string | null; amountKobo?: number | null } | null;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Settlement impact</h3>
      <dl>
        <Field label="Affected">{impact?.affected ? 'Yes' : 'No'}</Field>
        <Field label="Settlement">{impact?.settlementId ?? 'No settlement linked'}</Field>
        <Field label="Amount">{typeof impact?.amountKobo === 'number' ? formatKobo(impact.amountKobo) : 'Not returned'}</Field>
        <Field label="Warning">{impact?.warning ?? impact?.message ?? 'No backend warning returned'}</Field>
      </dl>
    </Card>
  );
}
