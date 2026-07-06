'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo, formatDate, formatDateTime } from '@/lib/format';
import { PageHeader, Card, Field, AsyncBoundary } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Inputs';

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { campusName } = useSession();
  const query = useApiQuery(['settlement', id], () => api.getSettlement(id));
  const s = query.data?.data;

  const [approveOpen, setApproveOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [adjOpen, setAdjOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showAccount, setShowAccount] = useState(false);

  const payoutAccount = useApiQuery(
    ['payout-account', id],
    () => api.getSettlementPayoutAccount(id),
    showAccount,
  );
  const bank = payoutAccount.data?.data;

  const invalidate = [['settlement', id], ['settlements']];
  const approve = useApiAction(() => api.approveSettlement(id), {
    invalidate, success: 'Settlement approved.', onSuccess: () => setApproveOpen(false),
  });
  const payout = useApiAction(() => api.paySettlement(id), {
    invalidate, success: 'Payout initiated. It settles once Paystack confirms the transfer.',
    onSuccess: () => setPayoutOpen(false),
  });
  const markPaid = useApiAction(() => api.markSettlementPaid(id, reference), {
    invalidate, success: 'Marked paid.', onSuccess: () => { setPayOpen(false); setReference(''); },
  });
  const adjust = useApiAction(() => api.addSettlementAdjustment(id, { amountKobo: Number(amount), description }), {
    invalidate, success: 'Adjustment added.', onSuccess: () => { setAdjOpen(false); setAmount(''); setDescription(''); },
  });

  return (
    <>
      <PageHeader title="Settlement" backHref="/settlements" />
      <AsyncBoundary query={query}>
        {(env) => {
          const st = env.data;
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-space font-bold text-ink dark:text-white">{formatDate(st.settlementDate)}</h2>
                    <p className="text-xs text-muted font-mono">{st.id}</p>
                  </div>
                  <StatusBadge status={st.status} />
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <Field label="Beneficiary">{st.vendorId ? `Vendor ${st.vendorId}` : `Rider ${st.riderId}`}</Field>
                  <Field label="Campus">{campusName(st.campusId)}</Field>
                  <Field label="Gross Food">{formatKobo(st.grossFoodAmountKobo)}</Field>
                  <Field label="Delivery Earnings">{formatKobo(st.deliveryEarningsKobo)}</Field>
                  <Field label="Refunds">{formatKobo(st.refundsKobo)}</Field>
                  <Field label="Adjustments">{formatKobo(st.adjustmentsKobo)}</Field>
                  <Field label="Payable"><span className="font-bold">{formatKobo(st.payableKobo)}</span></Field>
                  <Field label="External Reference">{st.externalReference ?? '—'}</Field>
                  <Field label="Paid At">{formatDateTime(st.paidAt)}</Field>
                </dl>
              </Card>

              <Card className="p-6 h-fit">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Reconciliation</h3>
                <div className="space-y-3">
                  <Button className="w-full" disabled={st.status !== 'draft'} onClick={() => setApproveOpen(true)}>Approve</Button>
                  <Button className="w-full" disabled={st.status !== 'approved'} onClick={() => setPayoutOpen(true)}>Pay Now (Paystack)</Button>
                  <Button className="w-full" variant="outline" disabled={st.status !== 'approved'} onClick={() => setPayOpen(true)}>Mark Paid (manual)</Button>
                  <Button className="w-full" variant="outline" onClick={() => setShowAccount(true)}>Show Bank Account</Button>
                  <Button className="w-full" variant="outline" onClick={() => setAdjOpen(true)}>Add Adjustment</Button>
                </div>

                {showAccount && (
                  <div className="mt-4 rounded-xl bg-canvas dark:bg-ink/60 p-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">Bank Account</span>
                      <button className="text-xs text-muted hover:text-ink dark:hover:text-white" onClick={() => setShowAccount(false)}>Hide</button>
                    </div>
                    {payoutAccount.isLoading && <p className="text-muted">Loading…</p>}
                    {payoutAccount.isError && <p className="text-danger">{(payoutAccount.error as Error)?.message ?? 'No bank account on file.'}</p>}
                    {bank && (
                      <dl className="space-y-2">
                        <div className="flex justify-between gap-3"><dt className="text-muted">Bank</dt><dd className="font-medium text-right">{bank.bankName}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-muted">Account name</dt><dd className="font-medium text-right">{bank.accountName || '—'}</dd></div>
                        <div className="flex justify-between gap-3 items-center">
                          <dt className="text-muted">Account number</dt>
                          <dd className="font-mono font-bold text-right flex items-center gap-2">
                            {bank.accountNumber}
                            <button
                              className="text-xs text-muted hover:text-ink dark:hover:text-white"
                              onClick={() => navigator.clipboard?.writeText(bank.accountNumber)}
                            >Copy</button>
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 pt-1 border-t border-muted/20"><dt className="text-muted">Amount to pay</dt><dd className="font-bold text-right">{formatKobo(bank.payableKobo)}</dd></div>
                      </dl>
                    )}
                  </div>
                )}
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>

      <ConfirmDialog
        open={approveOpen} onClose={() => setApproveOpen(false)} onConfirm={() => approve.mutate()}
        loading={approve.isPending} confirmLabel="Approve"
        title="Approve Settlement" message="Approve this settlement for payout?"
      />

      <ConfirmDialog
        open={payoutOpen} onClose={() => setPayoutOpen(false)} onConfirm={() => payout.mutate()}
        loading={payout.isPending} confirmLabel="Send Payout"
        title="Send Automated Payout"
        message={`Transfer ${s ? formatKobo(s.payableKobo) : ''} to the beneficiary's bank account via Paystack? This moves real money and cannot be undone.`}
      />

      <Modal
        open={payOpen} onClose={() => setPayOpen(false)} title="Mark Settlement Paid"
        footer={<>
          <Button variant="ghost" onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button loading={markPaid.isPending} disabled={reference.length < 3} onClick={() => markPaid.mutate()}>Mark Paid</Button>
        </>}
      >
        <TextField label="External payment reference" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} />
      </Modal>

      <Modal
        open={adjOpen} onClose={() => setAdjOpen(false)} title="Add Adjustment"
        footer={<>
          <Button variant="ghost" onClick={() => setAdjOpen(false)}>Cancel</Button>
          <Button loading={adjust.isPending} disabled={amount === '' || description.length < 3} onClick={() => adjust.mutate()}>Add</Button>
        </>}
      >
        <div className="space-y-4">
          <TextField label="Amount (kobo, signed)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Negative reduces the payable." />
          <TextField label="Description" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
