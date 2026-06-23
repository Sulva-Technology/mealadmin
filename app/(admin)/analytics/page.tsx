'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo } from '@/lib/format';
import { PageHeader, Stat, AsyncBoundary } from '@/components/ui/Page';
import { TextField } from '@/components/ui/Inputs';

export default function AnalyticsPage() {
  const { scopeCampusId } = useSession();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const query = useApiQuery(
    ['analytics', scopeCampusId, dateFrom, dateTo],
    () => api.getAnalytics({ campusId: scopeCampusId ?? undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
  );

  return (
    <>
      <PageHeader
        title="Operational Analytics"
        subtitle="Aggregate order performance for the selected campus and range."
        actions={
          <div className="flex gap-2">
            <TextField type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        }
      />
      <AsyncBoundary query={query}>
        {(env) => {
          const a = env.data ?? {};
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Stat label="Orders" value={a.orderCount ?? 0} />
              <Stat label="Gross Sales" value={formatKobo(a.grossSalesKobo)} />
              <Stat label="Active Vendors" value={a.activeVendorCount ?? 0} />
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
