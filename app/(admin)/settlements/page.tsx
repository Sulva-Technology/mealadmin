'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { SETTLEMENT_STATUSES, type SettlementListItem, type BeneficiaryType } from '@/lib/types';
import { formatKobo, formatDate, titleize, todayISO } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterSelect, TextField, Select } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ListView } from '@/components/admin/ListView';
import type { Column } from '@/components/ui/DataTable';

const columns: Column<SettlementListItem>[] = [
  {
    header: 'Settlement',
    render: (s) => (
      <div>
        <div className="font-semibold text-ink dark:text-white">{formatDate(s.settlementDate)}</div>
        <div className="text-xs text-muted">{s.vendorId ? 'Vendor' : 'Rider'} · {(s.vendorId ?? s.riderId ?? '').slice(0, 8)}…</div>
      </div>
    ),
  },
  { header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
  { header: 'Paid At', render: (s) => formatDate(s.paidAt) },
  { header: 'Payable', align: 'right', render: (s) => <span className="font-bold">{formatKobo(s.payableKobo)}</span> },
];

export default function SettlementsPage() {
  const router = useRouter();
  const { scopeCampusId } = useSession();
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [beneficiaryType, setBeneficiaryType] = useState('');

  const [genOpen, setGenOpen] = useState(false);
  const [bType, setBType] = useState<BeneficiaryType>('vendor');
  const [bId, setBId] = useState('');
  const [bDate, setBDate] = useState(todayISO());

  const preview = useApiAction(
    () => api.previewSettlement({ beneficiaryType: bType, beneficiaryId: bId, settlementDate: bDate }),
    {},
  );
  const generate = useApiAction(
    () => api.generateSettlement({ beneficiaryType: bType, beneficiaryId: bId, settlementDate: bDate }),
    {
      invalidate: [['settlements']],
      success: 'Settlement generated.',
      onSuccess: (res) => { setGenOpen(false); router.push(`/settlements/${res.data.settlementId}`); },
    },
  );
  const est = preview.data?.data;

  return (
    <>
      <PageHeader
        title="Settlements"
        subtitle="Generate, approve and reconcile vendor & rider payouts."
        actions={<Button onClick={() => { preview.reset(); setGenOpen(true); }}>+ Generate</Button>}
      />
      <ListView<SettlementListItem>
        baseKey="settlements"
        params={{ campusId: scopeCampusId ?? undefined, status: status || undefined, date: date || undefined, beneficiaryType: beneficiaryType || undefined }}
        fetch={(q) => api.getSettlements(q)}
        columns={columns}
        rowKey={(s) => s.id}
        rowHref={(s) => `/settlements/${s.id}`}
        empty="No settlements match these filters."
        toolbar={
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {SETTLEMENT_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
            </FilterSelect>
            <FilterSelect value={beneficiaryType} onChange={(e) => setBeneficiaryType(e.target.value)}>
              <option value="">All beneficiaries</option>
              <option value="vendor">Vendor</option>
              <option value="rider">Rider</option>
            </FilterSelect>
            <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
          </div>
        }
      />

      <Modal
        open={genOpen} onClose={() => setGenOpen(false)} title="Generate Settlement"
        footer={<>
          <Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button variant="outline" loading={preview.isPending} disabled={!bId} onClick={() => preview.mutate()}>Preview</Button>
          <Button loading={generate.isPending} disabled={!bId} onClick={() => generate.mutate()}>Generate</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Beneficiary type" value={bType} onChange={(e) => setBType(e.target.value as BeneficiaryType)}>
            <option value="vendor">Vendor</option>
            <option value="rider">Rider</option>
          </Select>
          <TextField label="Beneficiary ID (UUID)" value={bId} onChange={(e) => setBId(e.target.value)} />
          <TextField label="Settlement date" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
          {est && (
            <div className="rounded-xl bg-canvas dark:bg-ink/60 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">Delivery earnings</span><span>{formatKobo(est.deliveryEarningsKobo)}</span></div>
              {est.grossFoodAmountKobo !== undefined && <div className="flex justify-between"><span className="text-muted">Gross food</span><span>{formatKobo(est.grossFoodAmountKobo)}</span></div>}
              {est.refundsKobo !== undefined && <div className="flex justify-between"><span className="text-muted">Refunds</span><span>{formatKobo(est.refundsKobo)}</span></div>}
              <div className="flex justify-between font-bold pt-1 border-t border-muted/20"><span>Estimated payable</span><span>{formatKobo(est.estimatedPayableKobo)}</span></div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
