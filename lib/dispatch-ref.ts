'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { formatClock } from '@/lib/format';
import type { CampusLocation, DeliverySlot, Zone } from '@/lib/types';

const FIVE_MIN = 5 * 60 * 1000;

/**
 * Resolves the dispatch reference IDs carried on order/batch list rows
 * (locationId, zoneId, deliverySlotId) into human-readable labels.
 *
 * List endpoints only return IDs, so we hydrate lookup maps from the campus
 * config endpoints. Query keys match the campus config panels
 * (['locations'|'zones'|'delivery-slots', campusId]) so the cache is shared.
 * IDs are globally unique, so maps merged across every visible campus resolve
 * rows correctly even under the "All Campuses" scope.
 */
export interface DispatchRef {
  /** locationId -> "Zone Code · Name" (e.g. "College B · 1"). */
  locationLabel: (id?: string | null) => string | null;
  /** zoneId -> zone name. */
  zoneLabel: (id?: string | null) => string | null;
  /** deliverySlotId -> "HH:MM" delivery time. */
  slotTime: (id?: string | null) => string | null;
}

export function useDispatchRef(): DispatchRef {
  const { campuses } = useSession();
  const ids = campuses.map((c) => c.id);

  const locationQs = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['locations', id],
      queryFn: () => api.getLocations(id, { limit: 100 }),
      staleTime: FIVE_MIN,
    })),
  });
  const zoneQs = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['zones', id],
      queryFn: () => api.getZones(id, { limit: 100 }),
      staleTime: FIVE_MIN,
    })),
  });
  const slotQs = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['delivery-slots', id],
      queryFn: () => api.getDeliverySlots(id, { limit: 100 }),
      staleTime: FIVE_MIN,
    })),
  });

  const locations = locationQs.flatMap((q) => q.data?.data ?? []);
  const zones = zoneQs.flatMap((q) => q.data?.data ?? []);
  const slots = slotQs.flatMap((q) => q.data?.data ?? []);

  const locationKey = locations.map((l) => l.id).join(',');
  const zoneKey = zones.map((z) => z.id).join(',');
  const slotKey = slots.map((s) => s.id).join(',');

  return useMemo<DispatchRef>(() => {
    const locMap = new Map<string, CampusLocation>(locations.map((l) => [l.id, l]));
    const zoneMap = new Map<string, Zone>(zones.map((z) => [z.id, z]));
    const slotMap = new Map<string, DeliverySlot>(slots.map((s) => [s.id, s]));
    return {
      locationLabel: (id) => {
        if (!id) return null;
        const l = locMap.get(id);
        if (!l) return null;
        return l.zoneCode ? `${l.zoneCode} · ${l.name}` : l.name;
      },
      zoneLabel: (id) => {
        if (!id) return null;
        return zoneMap.get(id)?.name ?? null;
      },
      slotTime: (id) => {
        if (!id) return null;
        const s = slotMap.get(id);
        return s ? formatClock(s.deliveryTime) : null;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey, zoneKey, slotKey]);
}
