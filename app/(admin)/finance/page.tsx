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
  type FinancePeriod,
  type PoolBreakdown,
} from '@/lib/finance';
import { PageHeader, AsyncBoundary } from '@/components/ui/Page';

const PERIODS: { key: FinancePeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

export default function FinancePage() {
  const { scopeCampusId } = useSession();
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const range = periodRange(period);
  const campusId = scopeCampusId ?? undefined;

  const query = useApiQuery(
    ['finance-pools', campusId ?? 'all', period],
    async () => {
      const [vendor, rider, analytics] = await Promise.all([
        fetchAllSettlements({ campusId, beneficiaryType: 'vendor' }),
        fetchAllSettlements({ campusId, beneficiaryType: 'rider' }),
        api.getAnalytics({ campusId, dateFrom: range.dateFrom, dateTo: range.dateTo }),
      ]);
      // Client-side date guard in case the backend ignores the range params.
      const collected = analytics.data?.grossSalesKobo;
      return computePools(
        vendor.filter((s) => inRange(s.settlementDate, range)),
        rider.filter((s) => inRange(s.settlementDate, range)),
        typeof collected === 'number' ? collected : null,
      );
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
        {(pools) => (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PoolCard
              icon={<Store className="w-5 h-5" />}
              tone="vendor"
              title="Vendor money"
              amount={formatKobo(pools.vendor.totalKobo)}
              breakdown={pools.vendor}
            />

            <PlatformCard platform={pools.platform} />

            <PoolCard
              icon={<Bike className="w-5 h-5" />}
              tone="rider"
              title="Rider money"
              amount={formatKobo(pools.rider.totalKobo)}
              breakdown={pools.rider}
            />
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

const TONE: Record<string, string> = {
  vendor: 'text-info bg-info/10',
  rider: 'text-primary bg-primary/10',
  platform: 'text-warning bg-warning/10',
};

function PoolCard({
  icon, tone, title, amount, breakdown, badge, footnote,
}: {
  icon: ReactNode;
  tone: keyof typeof TONE;
  title: string;
  amount: string;
  breakdown?: PoolBreakdown;
  badge?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col">
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

      {footnote && <div className="mt-4 text-xs text-muted">{footnote}</div>}
    </div>
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
        footnote="Unavailable — total collected not reported for this period. A backend finance endpoint is needed for a reliable figure."
      />
    );
  }

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
            <Row label="Collected" value={formatKobo(platform.collectedKobo)} />
            <Row label="− Vendor + rider" value={formatKobo((platform.collectedKobo ?? 0) - (platform.grossKobo ?? 0))} />
          </dl>
          {platform.negative && (
            <p className="flex items-start gap-1.5 text-danger">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Negative — payables exceed collected (likely settlements generated for
              orders paid in another period). Treat with caution.
            </p>
          )}
          <p>Derived, gross of Paystack fees — not a settled figure.</p>
        </div>
      }
    />
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={muted ? 'text-muted tabular-nums' : 'font-semibold text-ink dark:text-white tabular-nums'}>{value}</dd>
    </div>
  );
}
