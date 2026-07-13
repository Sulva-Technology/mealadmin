'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, Store, UtensilsCrossed, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery, useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { INVENTORY_STATES, type InventoryRow } from '@/lib/types';
import { titleize, formatDate, formatClock } from '@/lib/format';
import { PageHeader, Card, Stat, AsyncBoundary } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FilterSelect, SearchInput, TextField, TextArea } from '@/components/ui/Inputs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, type Column } from '@/components/ui/DataTable';

/** Backend inventory state family for a given remaining count. */
function stateOf(remaining: number): 'sold_out' | 'low' | 'available' {
  if (remaining <= 0) return 'sold_out';
  if (remaining <= 5) return 'low';
  return 'available';
}

/** Worst state wins for a group rollup. */
function rollupState(outCount: number, lowCount: number): 'sold_out' | 'low' | 'available' {
  if (outCount > 0) return 'sold_out';
  if (lowCount > 0) return 'low';
  return 'available';
}

/**
 * Inline editor for a row's base total (quantity_total). Admins can set it
 * directly here — adjustments (the delta modal) only move quantity_adjusted.
 * Re-syncs the field when the row's total changes server-side (render-time
 * reset pattern) so a stale value can't clobber a fresh total.
 */
function TotalCell({ row }: { row: InventoryRow }) {
  const [qty, setQty] = useState(String(row.quantityTotal));
  const [prevTotal, setPrevTotal] = useState(row.quantityTotal);
  if (row.quantityTotal !== prevTotal) {
    setPrevTotal(row.quantityTotal);
    setQty(String(row.quantityTotal));
  }

  const save = useApiAction(
    () => api.updateInventory(row.id, { quantityTotal: Number(qty) }),
    { invalidate: [['inventory']], success: 'Total updated.' },
  );

  const n = Number(qty);
  const valid = qty.trim() !== '' && Number.isInteger(n) && n >= 0;
  const dirty = valid && n !== row.quantityTotal;

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        min={0}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20 px-2 py-1 rounded-lg bg-surface dark:bg-ink/50 border border-muted/20 text-sm text-right tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
      />
      <Button size="sm" variant="subtle" loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
        Save
      </Button>
    </div>
  );
}

type ItemGroup = {
  key: string;
  menuItemName: string;
  rows: InventoryRow[];
  remaining: number;
  outCount: number;
  lowCount: number;
};

type VendorGroup = {
  key: string;
  vendorId: string;
  vendorName: string;
  items: ItemGroup[];
  slotCount: number;
  remaining: number;
  outCount: number;
  lowCount: number;
};

export default function InventoryPage() {
  const { scopeCampusId, campuses } = useSession();
  const [date, setDate] = useState('');
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Adjustment modal state.
  const [target, setTarget] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const query = useApiQuery(
    ['inventory', scopeCampusId, date, state],
    () => api.getInventory({ campusId: scopeCampusId ?? undefined, date: date || undefined, state: state || undefined }),
  );

  // Inventory rows carry only vendorId; fetch the vendor list to resolve names.
  const vendorsQuery = useApiQuery(
    ['vendors', scopeCampusId],
    () => api.getVendors({ campusId: scopeCampusId ?? undefined }),
  );
  const vendorName = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of vendorsQuery.data?.data ?? []) map.set(v.id, v.displayName);
    return (id: string) => map.get(id) ?? `Vendor ${id.slice(0, 8)}`;
  }, [vendorsQuery.data]);

  // Inventory rows carry only deliverySlotId; hydrate slot names from the campus
  // config endpoints (IDs are globally unique, so maps merge across campuses).
  const slotQs = useQueries({
    queries: campuses.map((c) => ({
      queryKey: ['delivery-slots', c.id],
      queryFn: () => api.getDeliverySlots(c.id, { limit: 100 }),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const slots = slotQs.flatMap((q) => q.data?.data ?? []);
  const slotKey = slots.map((s) => s.id).join(',');
  const slotLabel = useMemo(() => {
    const map = new Map(slots.map((s) => [s.id, s]));
    return (id: string) => {
      const s = map.get(id);
      if (!s) return { name: `Slot ${id.slice(0, 8)}`, time: '' };
      return { name: s.name, time: formatClock(s.deliveryTime) };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey]);

  const adjust = useApiAction(
    () => api.adjustInventory(target!.id, { delta: Number(delta), reason }),
    {
      invalidate: [['inventory']],
      success: 'Adjustment recorded.',
      onSuccess: () => { setTarget(null); setDelta(''); setReason(''); },
    },
  );

  const rows = useMemo<InventoryRow[]>(() => query.data?.data ?? [], [query.data]);

  // Client-side search, then two-level grouping: vendor -> menu item -> slots.
  const groups = useMemo<VendorGroup[]>(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? rows.filter(
          (r) =>
            r.menuItemName.toLowerCase().includes(term) ||
            vendorName(r.vendorId).toLowerCase().includes(term),
        )
      : rows;

    const byVendor = new Map<string, VendorGroup>();
    for (const row of filtered) {
      let vg = byVendor.get(row.vendorId);
      if (!vg) {
        vg = {
          key: `v:${row.vendorId}`,
          vendorId: row.vendorId,
          vendorName: vendorName(row.vendorId),
          items: [],
          slotCount: 0,
          remaining: 0,
          outCount: 0,
          lowCount: 0,
        };
        byVendor.set(row.vendorId, vg);
      }

      const itemKey = `i:${row.vendorId}:${row.menuItemName}`;
      let ig = vg.items.find((g) => g.key === itemKey);
      if (!ig) {
        ig = { key: itemKey, menuItemName: row.menuItemName, rows: [], remaining: 0, outCount: 0, lowCount: 0 };
        vg.items.push(ig);
      }

      const s = stateOf(row.remainingQuantity);
      ig.rows.push(row);
      ig.remaining += row.remainingQuantity;
      vg.slotCount += 1;
      vg.remaining += row.remainingQuantity;
      if (s === 'sold_out') { ig.outCount += 1; vg.outCount += 1; }
      else if (s === 'low') { ig.lowCount += 1; vg.lowCount += 1; }
    }

    for (const vg of byVendor.values()) {
      vg.items.sort((a, b) => a.menuItemName.localeCompare(b.menuItemName));
      for (const ig of vg.items) {
        ig.rows.sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
      }
    }
    return Array.from(byVendor.values()).sort((a, b) => a.vendorName.localeCompare(b.vendorName));
  }, [rows, search, vendorName]);

  const totalOut = groups.reduce((n, g) => n + g.outCount, 0);
  const totalLow = groups.reduce((n, g) => n + g.lowCount, 0);
  const affectedItems = groups.reduce(
    (n, g) => n + g.items.filter((i) => i.outCount > 0 || i.lowCount > 0).length,
    0,
  );

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

  // Slot-level columns (vendor + item live in the section headers).
  const columns: Column<InventoryRow>[] = [
    {
      header: 'Slot',
      render: (r) => {
        const s = slotLabel(r.deliverySlotId);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-ink dark:text-white capitalize">{s.name}</span>
            {s.time && <span className="text-xs text-muted tabular-nums">{s.time}</span>}
          </div>
        );
      },
    },
    { header: 'Service Date', render: (r) => formatDate(r.serviceDate) },
    { header: 'Total', align: 'right', render: (r) => <TotalCell row={r} /> },
    { header: 'Reserved', align: 'right', render: (r) => r.quantityReserved },
    { header: 'Sold', align: 'right', render: (r) => r.quantitySold },
    { header: 'Remaining', align: 'right', render: (r) => <span className="font-bold">{r.remainingQuantity}</span> },
    { header: 'State', render: (r) => <StatusBadge status={stateOf(r.remainingQuantity)} /> },
    {
      header: '', align: 'right',
      render: (r) => <Button size="sm" variant="outline" onClick={() => setTarget(r)}>Adjust</Button>,
    },
  ];

  const validDelta = delta !== '' && Number.isInteger(Number(delta));

  return (
    <>
      <PageHeader title="Inventory Oversight" subtitle="Monitor stock by vendor and record audited adjustments." />

      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
        <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:w-44" />
        <FilterSelect value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All states</option>
          {INVENTORY_STATES.map((s) => <option key={s} value={s}>{titleize(s)}</option>)}
        </FilterSelect>
        <SearchInput
          placeholder="Search vendor or item…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <Stat label="Sold out" value={totalOut} hint="Slots at zero remaining" />
          <Stat label="Low stock" value={totalLow} hint="Slots at or below 5" />
          <Stat label="Affected items" value={affectedItems} hint="Items with a low/out slot" />
        </div>
      )}

      <Card className="overflow-hidden">
        <AsyncBoundary
          query={query}
          empty="No inventory rows for these filters."
          isEmpty={(d) => d.data.length === 0}
        >
          {() =>
            groups.length === 0 ? (
              <div className="p-12 text-center text-muted">No vendors or items match your search.</div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Layers className="w-4 h-4" />
                    <span>{groups.length} {groups.length === 1 ? 'vendor' : 'vendors'}</span>
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
                          {vg.items.length} {vg.items.length === 1 ? 'item' : 'items'} · {vg.slotCount} {vg.slotCount === 1 ? 'slot' : 'slots'}
                        </span>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-xs text-muted tabular-nums">{vg.remaining} remaining</span>
                          <StatusBadge status={rollupState(vg.outCount, vg.lowCount)} />
                        </div>
                      </button>

                      {!vCollapsed && (
                        <div className="border-t border-muted/20 divide-y divide-muted/10">
                          {vg.items.map((ig) => {
                            const iCollapsed = collapsed.has(ig.key);
                            return (
                              <div key={ig.key}>
                                <button
                                  type="button"
                                  onClick={() => toggle(ig.key)}
                                  className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-canvas/40 dark:hover:bg-ink/30 transition-colors"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${iCollapsed ? '-rotate-90' : ''}`} />
                                  <UtensilsCrossed className="w-3.5 h-3.5 text-muted shrink-0" />
                                  <span className="font-medium text-ink dark:text-white capitalize">{ig.menuItemName}</span>
                                  <span className="text-xs text-muted">{ig.rows.length} {ig.rows.length === 1 ? 'slot' : 'slots'}</span>
                                  <div className="ml-auto flex items-center gap-3">
                                    <span className="text-xs text-muted tabular-nums">{ig.remaining} remaining</span>
                                    <StatusBadge status={rollupState(ig.outCount, ig.lowCount)} />
                                  </div>
                                </button>
                                {!iCollapsed && (
                                  <div className="bg-canvas/30 dark:bg-ink/20">
                                    <DataTable columns={columns} rows={ig.rows} rowKey={(r) => r.id} />
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
            )
          }
        </AsyncBoundary>
      </Card>

      <Modal
        open={!!target} onClose={() => setTarget(null)} title="Record Inventory Adjustment"
        footer={<>
          <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
          <Button loading={adjust.isPending} disabled={!validDelta || reason.length < 3} onClick={() => adjust.mutate()}>Record</Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">{target?.menuItemName} · remaining {target?.remainingQuantity}</p>
          <TextField label="Delta (signed integer)" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} hint="Positive adds stock, negative removes." />
          <TextArea label="Reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
