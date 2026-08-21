'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import type { AdminWallet } from '@/lib/types';
import { formatDateTime, formatKobo } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import { CopyButton } from '@/components/admin/finance/FinanceUI';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Inputs';
import { PermissionAction } from '@/components/admin/Permission';
import type { Column } from '@/components/ui/DataTable';

export default function WalletsPage() {
  const [adjustWallet, setAdjustWallet] = useState<AdminWallet | null>(null);
  const [freezeWallet, setFreezeWallet] = useState<AdminWallet | null>(null);
  const [ledgerWallet, setLedgerWallet] = useState<AdminWallet | null>(null);

  const [amountNaira, setAmountNaira] = useState('');
  const [reason, setReason] = useState('');

  const resetForm = () => { setAmountNaira(''); setReason(''); };

  const adjust = useApiAction(() => {
    const kobo = Math.round(Number(amountNaira) * 100);
    return api.adjustWallet(adjustWallet!.id, { amountKobo: kobo, reason });
  }, {
    invalidate: [['wallets']],
    success: 'Wallet adjusted.',
    onSuccess: () => { setAdjustWallet(null); resetForm(); },
  });

  const freeze = useApiAction(() =>
    api.freezeWallet(freezeWallet!.id, { frozen: freezeWallet!.status !== 'frozen', reason: reason || undefined }), {
    invalidate: [['wallets']],
    success: 'Wallet updated.',
    onSuccess: () => { setFreezeWallet(null); resetForm(); },
  });

  const amountKobo = Math.round(Number(amountNaira) * 100);
  const adjustInvalid = !amountNaira || Number.isNaN(amountKobo) || amountKobo === 0 || !reason.trim();

  const columns: Column<AdminWallet>[] = [
    {
      header: 'Customer',
      render: (w) => (
        <div>
          <div className="font-medium text-ink dark:text-white">{w.userDisplayName ?? '—'}</div>
          <div className="text-xs text-muted">{w.userEmail ?? w.userId}</div>
        </div>
      ),
    },
    { header: 'Balance', align: 'right', render: (w) => <span className="font-bold">{formatKobo(w.balanceKobo)}</span> },
    { header: 'Status', render: (w) => <StatusBadge status={w.status} tone={w.status === 'frozen' ? 'warning' : 'neutral'} /> },
    { header: 'Over cap', render: (w) => (w.overCap ? <StatusBadge status="over cap" tone="warning" /> : <span className="text-muted text-xs">—</span>) },
    { header: 'Top-up account', render: (w) => (w.accountNumber ? <span className="font-mono text-xs">{w.accountNumber}</span> : <span className="text-muted text-xs">Not provisioned</span>) },
    { header: 'Updated', render: (w) => formatDateTime(w.updatedAt) },
    {
      header: 'Actions',
      render: (w) => (
        <div className="flex flex-wrap gap-2 min-w-[280px]">
          <PermissionAction action="wallet.adjust" size="sm" variant="outline" onClick={() => { resetForm(); setAdjustWallet(w); }}>Adjust</PermissionAction>
          <PermissionAction action="wallet.freeze" size="sm" variant={w.status === 'frozen' ? 'outline' : 'danger'} onClick={() => { resetForm(); setFreezeWallet(w); }}>
            {w.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
          </PermissionAction>
          <Button size="sm" variant="ghost" onClick={() => setLedgerWallet(w)}>Ledger</Button>
          <CopyButton value={w.userId} label="Copy user ID" />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Wallets" subtitle="Customer wallet oversight. Adjust balances, freeze on abuse, and audit movements." />
      <ListView<AdminWallet>
        baseKey="wallets"
        params={{}}
        fetch={(q) => api.getWallets(q)}
        columns={columns}
        rowKey={(w) => w.id}
        empty="No wallets found."
      />

      {/* Adjust */}
      {adjustWallet && (
        <Modal
          open={!!adjustWallet}
          onClose={() => setAdjustWallet(null)}
          title="Adjust wallet balance"
          footer={<>
            <Button variant="ghost" onClick={() => setAdjustWallet(null)}>Cancel</Button>
            <PermissionAction action="wallet.adjust" loading={adjust.isPending} disabled={adjustInvalid} onClick={() => adjust.mutate()}>
              Apply adjustment
            </PermissionAction>
          </>}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {adjustWallet.userEmail ?? adjustWallet.userId} · current balance {formatKobo(adjustWallet.balanceKobo)}.
            </p>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-white mb-1.5">Amount (₦, negative to debit)</label>
              <input
                type="number"
                value={amountNaira}
                onChange={(e) => setAmountNaira(e.target.value)}
                placeholder="e.g. 1000 or -500"
                className="w-full rounded-lg border border-muted/30 bg-canvas px-3 py-2 text-sm text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {!!amountNaira && !Number.isNaN(amountKobo) && (
                <p className="mt-1 text-xs text-muted">= {formatKobo(amountKobo)} ({amountKobo >= 0 ? 'credit' : 'debit'})</p>
              )}
            </div>
            <TextArea label="Reason (required — audited)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Freeze / unfreeze */}
      {freezeWallet && (
        <Modal
          open={!!freezeWallet}
          onClose={() => setFreezeWallet(null)}
          title={freezeWallet.status === 'frozen' ? 'Unfreeze wallet' : 'Freeze wallet'}
          footer={<>
            <Button variant="ghost" onClick={() => setFreezeWallet(null)}>Cancel</Button>
            <PermissionAction action="wallet.freeze" variant={freezeWallet.status === 'frozen' ? 'primary' : 'danger'} loading={freeze.isPending} onClick={() => freeze.mutate()}>
              {freezeWallet.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            </PermissionAction>
          </>}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {freezeWallet.status === 'frozen'
                ? 'Unfreezing lets this customer pay for orders from their wallet again.'
                : 'Freezing blocks wallet order payments. Incoming top-ups and refunds still land.'}
            </p>
            <TextArea label="Reason (optional — audited)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Ledger */}
      {ledgerWallet && (
        <WalletLedgerModal wallet={ledgerWallet} onClose={() => setLedgerWallet(null)} />
      )}
    </>
  );
}

function WalletLedgerModal({ wallet, onClose }: { wallet: AdminWallet; onClose: () => void }) {
  const query = useApiQuery(['wallet-ledger', wallet.id], () => api.getWalletLedger(wallet.id));
  const entries = query.data?.data ?? [];

  return (
    <Modal open onClose={onClose} title={`Ledger — ${wallet.userEmail ?? wallet.userId}`}>
      {query.isLoading ? (
        <p className="text-sm text-muted">Loading movements…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">No wallet activity yet.</p>
      ) : (
        <div className="divide-y divide-muted/15 max-h-[60vh] overflow-y-auto">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink dark:text-white capitalize truncate">
                  {e.orderNumber ? `Order ${e.orderNumber}` : (e.reason ?? e.entryType.replace(/_/g, ' '))}
                </p>
                <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${e.amountKobo >= 0 ? 'text-success' : 'text-ink dark:text-white'}`}>
                  {e.amountKobo >= 0 ? '+' : ''}{formatKobo(e.amountKobo)}
                </p>
                <p className="text-xs text-muted">{formatKobo(e.balanceAfterKobo)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
