'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useApiAction, useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { SETTLEMENT_STATUSES, type SettlementListItem, type BeneficiaryType, type OrderListItem } from '@/lib/types';
import { assessSettlementReadiness, fetchVendorOrdersForDate } from '@/lib/settlement-readiness';
import { formatKobo, formatDate, titleize, todayISO } from '@/lib/format';
import { PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
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

  const [reviewOpen, setReviewOpen] = useState(false);
  const [completeOrder, setCompleteOrder] = useState<OrderListItem | null>(null);

  const vendorsParams = { campusId: scopeCampusId ?? undefined, status: 'approved', limit: 100 };
  const ridersParams = { campusId: scopeCampusId ?? undefined, status: 'verified', limit: 100 };

  const vendors = useApiQuery(
    ['vendors', 'settlement-picker', vendorsParams],
    () => api.getVendors(vendorsParams),
    genOpen && bType === 'vendor',
  );
  const riders = useApiQuery(
    ['riders', 'settlement-picker', ridersParams],
    () => api.getRiders(ridersParams),
    genOpen && bType === 'rider',
  );
  const beneficiaries = bType === 'vendor' ? vendors : riders;
  const beneficiariesLoading = beneficiaries.isLoading;

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

  // Which of this vendor/date's orders will the settlement actually count?
  // Orders still in paid…out_for_delivery hold collected money the backend
  // excludes; surface them before the admin generates a short settlement.
  const readinessQuery = useApiQuery(
    ['settlement-readiness', bId, bDate],
    () => fetchVendorOrdersForDate(bId, bDate),
    genOpen && bType === 'vendor' && !!bId && !!bDate,
  );
  const readiness = readinessQuery.data ? assessSettlementReadiness(readinessQuery.data) : null;
  const awaiting = readiness?.awaiting ?? [];

  const complete = useApiAction(
    (orderId: string) => api.transitionOrder(orderId, 'administratively_completed', 'Closed out during settlement review.'),
    {
      invalidate: [['settlement-readiness', bId, bDate], ['orders']],
      success: 'Order marked administratively completed.',
      onSuccess: () => { setCompleteOrder(null); preview.reset(); },
    },
  );

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
          <Select label="Beneficiary type" value={bType} onChange={(e) => { setBType(e.target.value as BeneficiaryType); setBId(''); preview.reset(); }}>
            <option value="vendor">Vendor</option>
            <option value="rider">Rider</option>
          </Select>
          <Select
            label={bType === 'vendor' ? 'Vendor' : 'Rider'}
            value={bId}
            onChange={(e) => { setBId(e.target.value); preview.reset(); }}
            disabled={beneficiariesLoading}
          >
            <option value="">{beneficiariesLoading ? 'Loading…' : `Select a ${bType}…`}</option>
            {beneficiaries.data?.data.map((b) => (
              <option key={b.id} value={b.id}>{b.displayName}</option>
            ))}
          </Select>
          <TextField label="Settlement date" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
          {bType === 'vendor' && awaiting.length > 0 && (
            <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 text-sm">
              <p className="font-semibold text-ink dark:text-white">
                {awaiting.length} order{awaiting.length === 1 ? '' : 's'} not yet delivered — {formatKobo(readiness!.awaitingTotalKobo)} will be excluded
              </p>
              <p className="text-muted mt-1">
                The settlement only counts delivered, confirmed, administratively-completed and refunded orders.
                Close out the day before generating, or this payable will come out short.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setReviewOpen(true)}>
                Review orders
              </Button>
            </div>
          )}
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

      <Modal
        open={reviewOpen} onClose={() => setReviewOpen(false)}
        title={`Orders awaiting transition — ${formatDate(bDate)}`}
        footer={<Button variant="ghost" onClick={() => setReviewOpen(false)}>Close</Button>}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            These orders are paid but not marked delivered, so the settlement excludes them.
            Verify each was actually fulfilled, then mark it completed — or chase the rider/vendor to finish the flow.
          </p>
          <div className="divide-y divide-muted/10">
            {awaiting.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <a href={`/orders/${o.id}`} target="_blank" rel="noreferrer" className="font-semibold text-ink dark:text-white hover:underline">
                    {o.orderNumber}
                  </a>
                  <div className="mt-1"><StatusBadge status={o.orderStatus} /></div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold">{formatKobo(o.totalKobo)}</span>
                  <Button size="sm" variant="outline" onClick={() => setCompleteOrder(o)}>Mark completed</Button>
                </div>
              </div>
            ))}
            {awaiting.length === 0 && (
              <p className="py-3 text-sm text-muted">All orders for this vendor and date are settled-ready. You can generate now.</p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!completeOrder} onClose={() => setCompleteOrder(null)}
        onConfirm={() => completeOrder && complete.mutate(completeOrder.id)}
        loading={complete.isPending} confirmLabel="Mark completed"
        title="Mark Order Administratively Completed"
        message={`Mark ${completeOrder?.orderNumber ?? ''} (${completeOrder ? formatKobo(completeOrder.totalKobo) : ''}) as administratively completed? Only do this if the order was actually fulfilled — it makes the money settleable to the vendor.`}
      />
    </>
  );
}
