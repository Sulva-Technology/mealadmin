'use client';

import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { formatKobo } from '@/lib/format';
import { PageHeader, Stat, Card, AsyncBoundary } from '@/components/ui/Page';
import { TextField } from '@/components/ui/Inputs';
import type { AnalyticsInsights, AnalyticsHourBucket } from '@/lib/types';

const BRAND = 'var(--color-primary)';
const ACCENT = 'var(--color-accent)';
const GRID = 'color-mix(in srgb, var(--color-muted) 22%, transparent)';
const AXIS = 'var(--color-muted)';

function hourLabel(h: number): string {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

// Dark-mode-aware tooltip surface (CSS vars flip with the theme).
const tooltipStyle = {
  background: 'var(--color-surface, #fff)',
  border: '1px solid color-mix(in srgb, var(--color-muted) 30%, transparent)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--color-ink)',
};

export default function AnalyticsPage() {
  const { scopeCampusId } = useSession();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = { campusId: scopeCampusId ?? undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  const summary = useApiQuery(['analytics', scopeCampusId, dateFrom, dateTo], () => api.getAnalytics(params));
  const insights = useApiQuery(['analytics-insights', scopeCampusId, dateFrom, dateTo], () => api.getAnalyticsInsights(params));

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Top foods, peak times, revenue trend and customer behaviour for the selected campus and range."
        actions={
          <div className="flex gap-2">
            <TextField type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        }
      />

      <AsyncBoundary query={summary}>
        {(env) => {
          const a = env.data ?? {};
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Stat label="Orders" value={a.orderCount ?? 0} />
              <Stat label="Gross Sales" value={formatKobo(a.grossSalesKobo)} />
              <Stat label="Active Vendors" value={a.activeVendorCount ?? 0} />
            </div>
          );
        }}
      </AsyncBoundary>

      <AsyncBoundary query={insights}>
        {(env) => <Insights data={env.data} />}
      </AsyncBoundary>
    </>
  );
}

function Insights({ data }: { data: AnalyticsInsights }) {
  const c = data.customers;
  const peakHour = data.ordersByHour.reduce<AnalyticsHourBucket | null>(
    (max, b) => (!max || b.orders > max.orders ? b : max), null,
  );

  return (
    <div className="space-y-6">
      {/* Customer behaviour */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Customers" value={c.totalCustomers} />
        <Stat label="New" value={c.newCustomers} />
        <Stat label="Returning" value={c.returningCustomers} />
        <Stat label="Repeat rate" value={`${c.repeatRate}%`} />
        <Stat label="Avg order value" value={formatKobo(c.avgOrderValueKobo)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-selling foods */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-ink dark:text-white mb-1">Top-selling foods</h3>
          <p className="text-xs text-muted mb-4">By units sold. Revenue in tooltip.</p>
          {data.topItems.length === 0 ? (
            <Empty />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(180, data.topItems.length * 34)}>
                <BarChart layout="vertical" data={data.topItems} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke={GRID} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
                  <YAxis type="category" dataKey="itemName" width={120} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: GRID }}
                    formatter={(v, name) => (name === 'quantity' ? [Number(v), 'Units'] : [formatKobo(Number(v)), 'Revenue'])}
                  />
                  <Bar dataKey="quantity" fill={BRAND} radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <table className="sr-only">
                <caption>Top-selling foods</caption>
                <thead><tr><th>Item</th><th>Units</th><th>Revenue</th></tr></thead>
                <tbody>
                  {data.topItems.map((it) => (
                    <tr key={it.menuItemId}><td>{it.itemName}</td><td>{it.quantity}</td><td>{formatKobo(it.revenueKobo)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>

        {/* Peak order times */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-ink dark:text-white mb-1">Peak order times</h3>
          <p className="text-xs text-muted mb-4">
            Orders by hour paid (WAT).{peakHour ? ` Busiest: ${hourLabel(peakHour.hour)} (${peakHour.orders} orders).` : ''}
          </p>
          {data.ordersByHour.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.ordersByHour} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="hour" tickFormatter={(h) => hourLabel(Number(h))} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} width={28} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: GRID }}
                  labelFormatter={(h) => `${hourLabel(Number(h))} (WAT)`}
                  formatter={(v, name) => (name === 'orders' ? [Number(v), 'Orders'] : [formatKobo(Number(v)), 'Revenue'])}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} barSize={14}>
                  {data.ordersByHour.map((b) => (
                    <Cell key={b.hour} fill={peakHour && b.hour === peakHour.hour ? ACCENT : BRAND} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Revenue trend */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-ink dark:text-white mb-1">Revenue trend</h3>
        <p className="text-xs text-muted mb-4">Gross sales by service date.</p>
        {data.revenueByDay.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.revenueByDay} margin={{ left: 8, right: 16 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: AXIS }} stroke={GRID} width={64} tickFormatter={(v) => formatKobo(Number(v))} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => (name === 'revenueKobo' ? [formatKobo(Number(v)), 'Revenue'] : [Number(v), 'Orders'])}
              />
              <Area type="monotone" dataKey="revenueKobo" stroke={BRAND} strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top spenders */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-ink dark:text-white mb-4">Top spenders</h3>
        {c.topSpenders.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted border-b border-muted/20">
                  <th className="py-2 pr-4 font-semibold">Customer</th>
                  <th className="py-2 pr-4 font-semibold text-right">Orders</th>
                  <th className="py-2 font-semibold text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {c.topSpenders.map((s) => (
                  <tr key={s.customerId} className="border-b border-muted/10">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-ink dark:text-white">{s.displayName ?? 'Customer'}</div>
                      <div className="text-xs text-muted">{s.email ?? s.customerId}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{s.orders}</td>
                    <td className="py-2.5 text-right font-bold">{formatKobo(s.spendKobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted py-8 text-center">No data for this campus and range.</p>;
}
