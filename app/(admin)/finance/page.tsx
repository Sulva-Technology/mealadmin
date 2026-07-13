'use client';

import { useState, type ReactNode } from 'react';
import { Store, Bike, Wallet, Info, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo } from '@/lib/format';
import {
  computePools,
  periodRange,
  inRange,
  fetchAllSettlements,
  fetchAllPayments,
  fetchAllRefunds,
  sumPaidCollected,
  sumSucceededRefunds,
  groupByBeneficiary,
  type FinancePeriod,
  type PoolBreakdown,
  type BeneficiaryEarning,
} from '@/lib/finance';
import { PageHeader, AsyncBoundary } from '@/components/ui/Page';
import { Modal } from '@/components/ui/Modal';

const PERIODS: { key: FinancePeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

export default function FinancePage() {
  const { scopeCampusId } = useSession();
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [modal, setModal] = useState<null | 'vendor' | 'rider'>(null);
  const range = periodRange(period);
  const campusId = scopeCampusId ?? undefined;
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  const query = useApiQuery(
    ['finance-pools', campusId ?? 'all', period],
    async () => {
      const [vendor, rider, payments, refunds, vendors, riders] = await Promise.all([
        fetchAllSettlements({ campusId, beneficiaryType: 'vendor' }),
        fetchAllSettlements({ campusId, beneficiaryType: 'rider' }),
        // Payments are filtered by date server-side; status is filtered client-side
        // by sumPaidCollected so partially_refunded payments still count as collected.
        fetchAllPayments({ campusId, from: range.dateFrom, to: range.dateTo }),
        fetchAllRefunds({ campusId, status: 'succeeded' }),
        api.getVendors({ campusId, limit: 100 }),
        api.getRiders({ campusId, limit: 100 }),
      ]);
      // Settlement endpoints ignore the range params, so guard client-side.
      const vendorInRange = vendor.filter((s) => inRange(s.settlementDate, range));
      const riderInRange = rider.filter((s) => inRange(s.settlementDate, range));

      // Real money only: expired/pending/failed orders never reach a paid payment.
      const collected = sumPaidCollected(payments);
      const refundsOut = sumSucceededRefunds(refunds, range);
      const pools = computePools(vendorInRange, riderInRange, collected, refundsOut);

      const names = new Map<string, string>();
      for (const v of vendors.data) names.set(v.id, v.displayName);
      for (const r of riders.data) names.set(r.id, r.displayName);

      return {
        pools,
        vendorEarnings: groupByBeneficiary(vendorInRange, 'vendor'),
        riderEarnings: groupByBeneficiary(riderInRange, 'rider'),
        names,
      };
    },
  );

  return (
    <>
      <PageHeader
        title="Money"
        subtitle="Vendor, platform & rider funds for the period — kept separate."
        actions={
          <div className="inline-flex rounded-xl bg-canvas dark:bg-ink/60 p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  period === p.key
                    ? 'bg-surface dark:bg-ink shadow-sm text-primary-strong'
                    : 'text-muted hover:text-primary-strong'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <AsyncBoundary query={query}>
        {({ pools, vendorEarnings, riderEarnings, names }) => (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <PoolCard
                icon={<Store className="w-5 h-5" />}
                tone="vendor"
                title="Vendor money"
                amount={formatKobo(pools.vendor.totalKobo)}
                breakdown={pools.vendor}
                onClick={pools.vendor.count > 0 ? () => setModal('vendor') : undefined}
              />

              <PlatformCard platform={pools.platform} />

              <PoolCard
                icon={<Bike className="w-5 h-5" />}
                tone="rider"
                title="Rider money"
                amount={formatKobo(pools.rider.totalKobo)}
                breakdown={pools.rider}
                onClick={pools.rider.count > 0 ? () => setModal('rider') : undefined}
              />
            </div>

            <EarningsModal
              open={modal === 'vendor'}
              onClose={() => setModal(null)}
              title={`Vendor earnings — ${periodLabel}`}
              earnings={vendorEarnings}
              names={names}
            />
            <EarningsModal
              open={modal === 'rider'}
              onClose={() => setModal(null)}
              title={`Rider earnings — ${periodLabel}`}
              earnings={riderEarnings}
              names={names}
            />
          </>
        )}
      </AsyncBoundary>
    </>
  );
}

function EarningsModal({
  open, onClose, title, earnings, names,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  earnings: BeneficiaryEarning[];
  names: Map<string, string>;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {earnings.length === 0 ? (
        <p className="text-sm text-muted">No earnings for this period.</p>
      ) : (
        <ul className="divide-y divide-muted/10">
          {earnings.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink dark:text-white">
                {names.get(e.id) ?? `Unknown (${e.id.slice(0, 8)})`}
              </span>
              <span className="font-semibold tabular-nums text-ink dark:text-white">
                {formatKobo(e.totalKobo)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

const TONE: Record<string, string> = {
  vendor: 'text-info bg-info/10',
  rider: 'text-primary bg-primary/10',
  platform: 'text-warning bg-warning/10',
};

function PoolCard({
  icon, tone, title, amount, breakdown, badge, footnote, onClick,
}: {
  icon: ReactNode;
  tone: keyof typeof TONE;
  title: string;
  amount: string;
  breakdown?: PoolBreakdown;
  badge?: ReactNode;
  footnote?: ReactNode;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      {...(clickable ? { onClick, type: 'button' as const } : {})}
      className={`glass-card rounded-3xl p-6 flex flex-col text-left w-full ${
        clickable
          ? 'cursor-pointer transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${TONE[tone]}`}>{icon}</div>
        {badge}
      </div>
      <h3 className="text-sm font-medium text-muted mt-4">{title}</h3>
      <p className="text-3xl font-space font-bold text-ink dark:text-white mt-1 tabular-nums">{amount}</p>

      {breakdown && (
        <dl className="mt-4 pt-4 border-t border-muted/15 space-y-2 text-sm">
          <Row label="Draft" value={formatKobo(breakdown.draftKobo)} />
          <Row label="Approved" value={formatKobo(breakdown.approvedKobo)} />
          <Row label="Paid" value={formatKobo(breakdown.paidKobo)} />
          <Row label="Settlements" value={String(breakdown.count)} muted />
        </dl>
      )}

      {clickable && <p className="mt-3 text-xs font-medium text-primary">View earnings →</p>}
      {footnote && <div className="mt-4 text-xs text-muted">{footnote}</div>}
    </Tag>
  );
}

function PlatformCard({ platform }: { platform: ReturnType<typeof computePools>['platform'] }) {
  const estimateBadge = (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2 py-1 rounded-full">
      <Info className="w-3 h-3" /> estimate
    </span>
  );

  if (!platform.available) {
    return (
      <PoolCard
        icon={<Wallet className="w-5 h-5" />}
        tone="platform"
        title="Platform money"
        amount="—"
        footnote="Unavailable — no paid payments reported for this period. A backend finance endpoint is needed for a reliable figure."
      />
    );
  }

  // collected − refunds − gross = vendor + rider payables.
  const payablesKobo = (platform.collectedKobo ?? 0) - platform.refundsKobo - (platform.grossKobo ?? 0);

  return (
    <PoolCard
      icon={<Wallet className="w-5 h-5" />}
      tone="platform"
      title="Platform money"
      amount={formatKobo(platform.grossKobo ?? 0)}
      badge={estimateBadge}
      footnote={
        <div className="space-y-2">
          <dl className="space-y-2">
            <Row label="Collected (paid only)" value={formatKobo(platform.collectedKobo)} />
            <Row label="− Refunds" value={formatKobo(platform.refundsKobo)} />
            <Row label="− Vendor + rider" value={formatKobo(payablesKobo)} />
            <Row label="− Est. Paystack fee" value={formatKobo(platform.estFeeKobo ?? 0)} />
            <div className="pt-2 border-t border-muted/15">
              <Row label="Net (est.)" value={formatKobo(platform.netEstKobo ?? 0)} emphasize />
            </div>
          </dl>
          {platform.negative && (
            <p className="flex items-start gap-1.5 text-danger">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Negative — payables exceed collected (likely settlements generated for
              orders paid in another period). Treat with caution.
            </p>
          )}
          <p>Real paid orders only, minus processed refunds. Fee &amp; net are estimates — not a settled figure.</p>
        </div>
      }
    />
  );
}

function Row({
  label, value, muted, emphasize,
}: { label: string; value: string; muted?: boolean; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasize ? 'font-medium text-ink dark:text-white' : 'text-muted'}>{label}</dt>
      <dd className={muted ? 'text-muted tabular-nums' : 'font-semibold text-ink dark:text-white tabular-nums'}>{value}</dd>
    </div>
  );
}
