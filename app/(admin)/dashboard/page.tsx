'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo, todayISO } from '@/lib/format';
import { PageHeader, Stat, Card, AsyncBoundary } from '@/components/ui/Page';
import { TextField } from '@/components/ui/Inputs';

export default function DashboardPage() {
  const { scopeCampusId } = useSession();
  const [date, setDate] = useState(todayISO());

  const query = useApiQuery(
    ['dashboard', scopeCampusId, date],
    () => api.getDashboard({ campusId: scopeCampusId ?? undefined, date }),
  );

  return (
    <>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Live operational snapshot for the selected campus and service date."
        actions={<TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
      />
      <AsyncBoundary query={query}>
        {(env) => {
          const d = env.data;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Stat label="Orders" value={d.orders.total} hint={`${d.orders.paid} paid`} />
                <Stat label="Batches" value={d.batches.total} hint={`${d.batches.open} open`} />
                <Stat label="Payments" value={d.payments.total} hint={`${d.payments.failed} failed`} />
                <Stat label="Open Escalations" value={d.escalations.open} />
                <Stat label="Payable" value={formatKobo(d.settlements.payableKobo)} hint="draft + approved" />
                <Stat label="Service Date" value={d.date} />
              </div>

              <Card className="p-6">
                <h2 className="text-lg font-space font-bold text-ink dark:text-white mb-4">Operational Alerts</h2>
                {d.alerts.length === 0 ? (
                  <p className="text-sm text-muted">No active alerts for this date.</p>
                ) : (
                  <ul className="space-y-2">
                    {d.alerts.map((a, i) => (
                      <li key={i} className="text-sm text-ink dark:text-muted">{JSON.stringify(a)}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          );
        }}
      </AsyncBoundary>
    </>
  );
}
