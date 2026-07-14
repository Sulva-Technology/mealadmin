'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, Clock, Layers, RefreshCw, Store } from 'lucide-react';
import { api, type Query } from '@/lib/api';
import { useApiQuery, useDebounced } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { ORDER_STATUSES, type OrderListItem } from '@/lib/types';
import { formatKobo, formatDate, formatClock, titleize } from '@/lib/format';
import { useDispatchRef } from '@/lib/dispatch-ref';
import { PageHeader, Card, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { SearchInput, FilterSelect, TextField } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

/** Cursor-walk the orders list to exhaustion so grouping sees the full day. */
const MAX_PAGES = 20;
async function fetchAllOrders(params: Query): Promise<OrderListItem[]> {
  const out: OrderListItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const env = await api.getOrders({ ...params, limit: 100, cursor });
    out.push(...env.data);
    if (!env.pagination.hasMore || !env.pagination.nextCursor) break;
    cursor = env.pagination.nextCursor;
  }
  return out;
}

type SlotGroup = {
  key: string;
  slotId: string | null;
  orders: OrderListItem[];
  totalKobo: number;
};

type VendorGroup = {
  key: string;
  vendorId: string;
  vendorName: string;
  slots: SlotGroup[];
  orderCount: number;
  totalKobo: number;
  newCount: number; // paid, awaiting vendor action
};

export default function OrdersPage() {
  const { scopeCampusId, campuses } = useSession();
  const ref = useDispatchRef();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const debounced = useDebounced(search);

  const query = useApiQuery(
    ['orders', scopeCampusId, status, date, debounced],
    () => fetchAllOrders({
      campusId: scopeCampusId ?? undefined,
      status: status || undefined,
      date: date || undefined,
      search: debounced || undefined,
    }),
  );

  // Slot names/times come from the campus config endpoints (rows carry only
  // deliverySlotId). Query keys match the campus panels so the cache is shared.
  const slotQs = useQueries({
    queries: campuses.map((c) => ({
      queryKey: ['delivery-slots', c.id],
      queryFn: () => api.getDeliverySlots(c.id, { limit: 100 }),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const slots = slotQs.flatMap((q) => q.data?.data ?? []);
  const slotKey = slots.map((s) => s.id).join(',');
  const slotInfo = useMemo(() => {
    const map = new Map(slots.map((s) => [s.id, s]));
    return (id: string | null) => {
      if (!id) return { name: 'No delivery slot', time: '', sort: '99:99' };
      const s = map.get(id);
      if (!s) return { name: `Slot ${id.slice(0, 8)}`, time: '', sort: '98:98' };
      return { name: s.name, time: formatClock(s.deliveryTime), sort: s.deliveryTime };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  const orders = useMemo<OrderListItem[]>(() => query.data ?? [], [query.data]);

  // Two-level grouping: vendor -> delivery slot -> orders.
  const groups = useMemo<VendorGroup[]>(() => {
    const byVendor = new Map<string, VendorGroup>();
    for (const o of orders) {
      let vg = byVendor.get(o.vendorId);
      if (!vg) {
        vg = {
          key: `v:${o.vendorId}`,
          vendorId: o.vendorId,
          vendorName: o.vendorDisplayName,
          slots: [],
          orderCount: 0,
          totalKobo: 0,
          newCount: 0,
        };
        byVendor.set(o.vendorId, vg);
      }

      const slotId = o.deliverySlotId ?? null;
      const slotGroupKey = `s:${o.vendorId}:${slotId ?? 'none'}`;
      let sg = vg.slots.find((g) => g.key === slotGroupKey);
      if (!sg) {
        sg = { key: slotGroupKey, slotId, orders: [], totalKobo: 0 };
        vg.slots.push(sg);
      }

      sg.orders.push(o);
      sg.totalKobo += o.totalKobo;
      vg.orderCount += 1;
      vg.totalKobo += o.totalKobo;
      if (o.orderStatus === 'paid') vg.newCount += 1;
    }

    for (const vg of byVendor.values()) {
      vg.slots.sort((a, b) => slotInfo(a.slotId).sort.localeCompare(slotInfo(b.slotId).sort));
      for (const sg of vg.slots) {
        sg.orders.sort((a, b) => {
          const la = ref.locationLabel(a.locationId) ?? '';
          const lb = ref.locationLabel(b.locationId) ?? '';
          return la.localeCompare(lb) || a.orderNumber.localeCompare(b.orderNumber);
        });
      }
    }
    return Array.from(byVendor.values()).sort((a, b) => a.vendorName.localeCompare(b.vendorName));
  }, [orders, slotInfo, ref]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.key));
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.key)));

  // Order-level columns (vendor + slot live in the section headers).
  const columns: Column<OrderListItem>[] = [
    {
      header: 'Order',
      render: (o) => {
        const location = ref.locationLabel(o.locationId);
        return (
          <div>
            <div className="font-semibold text-ink dark:text-white">{location ?? o.orderNumber}</div>
            {typeof o.itemsSummary === 'string' && o.itemsSummary && (
              <div className="text-xs text-muted truncate max-w-[22rem]">{o.itemsSummary}</div>
            )}
            {o.roomNumber && <div className="text-xs text-muted">Room {o.roomNumber}</div>}
            {location && <div className="text-[11px] text-muted font-mono">{o.orderNumber}</div>}
          </div>
        );
      },
    },
    { header: 'Service Date', render: (o) => formatDate(o.serviceDate) },
    { header: 'Mode', render: (o) => titleize(o.deliveryMode) },
    { header: 'Status', render: (o) => <StatusBadge status={o.orderStatus} /> },
    { header: 'Total', align: 'right', render: (o) => <span className="font-bold">{formatKobo(o.totalKobo)}</span> },
  ];

  return (
    <>
      <PageHeader title="Orders" subtitle="Investigate and administer campus orders, grouped by vendor and delivery slot." />

      <div className="mb-4 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center flex-1">
          <SearchInput placeholder="Search order number…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
          </FilterSelect>
          <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
        </div>
        <Button size="sm" variant="outline" onClick={() => query.refetch()} disabled={query.isLoading}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden">
        <AsyncBoundary
          query={query}
          empty="No orders match these filters."
          isEmpty={(d) => d.length === 0}
        >
          {() => (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Layers className="w-4 h-4" />
                  <span>
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'} · {groups.length} {groups.length === 1 ? 'vendor' : 'vendors'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {allCollapsed ? 'Expand all' : 'Collapse all'}
                </button>
              </div>

              {groups.map((vg) => {
                const vCollapsed = collapsed.has(vg.key);
                return (
                  <div key={vg.key} className="rounded-2xl border border-muted/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggle(vg.key)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-canvas/60 dark:hover:bg-ink/40 transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${vCollapsed ? '-rotate-90' : ''}`} />
                      <Store className="w-4 h-4 text-muted shrink-0" />
                      <span className="font-semibold text-ink dark:text-white">{vg.vendorName}</span>
                      <span className="text-xs text-muted">
                        {vg.orderCount} {vg.orderCount === 1 ? 'order' : 'orders'} · {vg.slots.length} {vg.slots.length === 1 ? 'slot' : 'slots'}
                      </span>
                      <div className="ml-auto flex items-center gap-3">
                        {vg.newCount > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-warning/15 text-warning">
                            {vg.newCount} awaiting acceptance
                          </span>
                        )}
                        <span className="text-xs text-muted tabular-nums font-semibold">{formatKobo(vg.totalKobo)}</span>
                      </div>
                    </button>

                    {!vCollapsed && (
                      <div className="border-t border-muted/20 divide-y divide-muted/10">
                        {vg.slots.map((sg) => {
                          const sCollapsed = collapsed.has(sg.key);
                          const info = slotInfo(sg.slotId);
                          return (
                            <div key={sg.key}>
                              <button
                                type="button"
                                onClick={() => toggle(sg.key)}
                                className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-canvas/40 dark:hover:bg-ink/30 transition-colors"
                              >
                                <ChevronDown className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${sCollapsed ? '-rotate-90' : ''}`} />
                                <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                                <span className="font-medium text-ink dark:text-white capitalize">{info.name}</span>
                                {info.time && <span className="text-xs text-muted tabular-nums">{info.time}</span>}
                                <span className="text-xs text-muted">{sg.orders.length} {sg.orders.length === 1 ? 'order' : 'orders'}</span>
                                <span className="ml-auto text-xs text-muted tabular-nums">{formatKobo(sg.totalKobo)}</span>
                              </button>
                              {!sCollapsed && (
                                <div className="bg-canvas/30 dark:bg-ink/20">
                                  <DataTable
                                    columns={columns}
                                    rows={sg.orders}
                                    rowKey={(o) => o.id}
                                    rowHref={(o) => `/orders/${o.id}`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AsyncBoundary>
      </Card>
    </>
  );
}
