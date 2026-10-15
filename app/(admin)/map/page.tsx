'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Store, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApiAction } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { canPerform } from '@/lib/rbac';
import {
  RIDER_REFRESH_MS,
  RIDER_STATE_COLOR,
  RIDER_STATE_LABEL,
  countByState,
  isPinned,
  lastSeenLabel,
  parseCoordinates,
  riderState,
  sortPoints,
  sortRiders,
} from '@/lib/map';
import type { MapPoint } from '@/lib/types';
import { Card, PageHeader } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// Leaflet touches `window` at import time, so the map only renders in the browser.
const LiveMap = dynamic(() => import('@/components/admin/map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-muted">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
});

type Tab = 'riders' | 'pins';

export default function LiveMapPage() {
  const { session, scopeCampusId, campusName } = useSession();
  const toast = useToast();
  const canPin = canPerform(session, 'map.pin');
  const [tab, setTab] = useState<Tab>('riders');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<MapPoint | null>(null);
  const [now, setNow] = useState(() => new Date());

  const ridersQ = useQuery({
    queryKey: ['map-riders', scopeCampusId],
    queryFn: () => api.getRiderPositions({ campusId: scopeCampusId ?? undefined }),
    refetchInterval: RIDER_REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
  const pointsQ = useQuery({
    queryKey: ['map-points', scopeCampusId],
    queryFn: () => api.getMapPoints(scopeCampusId as string),
    enabled: scopeCampusId !== null,
  });

  // Re-render relative "last seen" labels between refreshes.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  // Esc cancels pin placement.
  useEffect(() => {
    if (!placing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlacing(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placing]);

  const riders = useMemo(() => sortRiders(ridersQ.data?.data ?? []), [ridersQ.data]);
  const points = useMemo(() => sortPoints(pointsQ.data?.data ?? []), [pointsQ.data]);
  const counts = useMemo(() => countByState(riders), [riders]);
  const pinnedCount = points.filter(isPinned).length;

  const setPin = useApiAction(
    (args: { point: MapPoint; coords: { latitude: number; longitude: number } }) =>
      api.setMapPoint(args.point.kind, args.point.id, args.coords),
    {
      invalidate: [['map-points', scopeCampusId]],
      onSuccess: (res) => toast.success(`Pinned ${res.data.name}.`),
    },
  );
  const clearPin = useApiAction(
    (point: MapPoint) => api.clearMapPoint(point.kind, point.id),
    { invalidate: [['map-points', scopeCampusId]], success: 'Pin removed.' },
  );

  const onPlace = useCallback(
    (point: MapPoint, coords: { latitude: number; longitude: number }) => {
      setPlacing(null);
      setPin.mutate({ coords, point });
    },
    [setPin],
  );

  const ridersError = ridersQ.error instanceof ApiError ? ridersQ.error.message : null;

  return (
    <>
      <PageHeader
        title="Live Map"
        subtitle={
          scopeCampusId
            ? `Riders on shift or delivering at ${campusName(scopeCampusId)}. Refreshes every ${RIDER_REFRESH_MS / 1000}s.`
            : `Riders on shift or delivering across all campuses. Refreshes every ${RIDER_REFRESH_MS / 1000}s.`
        }
        actions={
          <div className="flex items-center gap-2 text-xs text-muted">
            {ridersQ.isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {ridersQ.dataUpdatedAt
              ? `Updated ${lastSeenLabel(new Date(ridersQ.dataUpdatedAt).toISOString(), now)}`
              : 'Loading…'}
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        {(['delivering', 'available', 'stale'] as const).map((state) => (
          <Card key={state} className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RIDER_STATE_COLOR[state] }} />
              {RIDER_STATE_LABEL[state]}
            </div>
            <div className="text-2xl font-space font-bold text-ink dark:text-white mt-1">{counts[state]}</div>
          </Card>
        ))}
      </div>

      {placing && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <span>
            Click the map where <strong>{placing.name}</strong> is. Press Esc to cancel.
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPlacing(null)}>
            <X className="w-4 h-4" /> Cancel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <Card className="h-[60vh] lg:h-[70vh] p-0 overflow-hidden">
          <LiveMap
            riders={riders}
            points={points}
            selectedRiderId={selectedRiderId}
            placing={placing}
            onPlace={onPlace}
            onSelectRider={(id) => {
              setSelectedRiderId(id);
              setTab('riders');
            }}
            fitKey={scopeCampusId ?? 'all'}
          />
        </Card>

        <Card className="p-4 lg:h-[70vh] flex flex-col min-h-0">
          <div className="flex gap-1 mb-3 p-1 rounded-xl bg-canvas dark:bg-ink/60">
            {(['riders', 'pins'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === value ? 'bg-surface dark:bg-ink shadow-sm text-ink dark:text-white' : 'text-muted'
                }`}
              >
                {value === 'riders' ? `Riders (${riders.length})` : `Pins (${pinnedCount}/${points.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
            {tab === 'riders' ? (
              <RiderList
                error={ridersError}
                loading={ridersQ.isLoading}
                now={now}
                riders={riders}
                selectedRiderId={selectedRiderId}
                onSelect={setSelectedRiderId}
              />
            ) : scopeCampusId === null ? (
              <p className="text-sm text-muted p-2">
                Choose a campus in the top bar to see and set its map pins.
              </p>
            ) : (
              <PinList
                canPin={canPin}
                clearing={clearPin.isPending}
                loading={pointsQ.isLoading}
                placingId={placing?.id ?? null}
                points={points}
                onClear={(point) => clearPin.mutate(point)}
                onPaste={(point, coords) => setPin.mutate({ coords, point })}
                onPlace={setPlacing}
              />
            )}
          </div>
        </Card>
      </div>

      <p className="text-xs text-muted mt-3">
        Riders appear only while on shift or delivering; their position is deleted when they go off duty.
        Pins drive delivery ETAs: places without a pin get no ETA.
      </p>
    </>
  );
}

function RiderList({
  riders, selectedRiderId, onSelect, loading, error, now,
}: {
  riders: ReturnType<typeof sortRiders>;
  selectedRiderId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
  now: Date;
}) {
  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-muted m-2" />;
  if (error) return <p className="text-sm text-danger p-2">{error}</p>;
  if (riders.length === 0) {
    return <p className="text-sm text-muted p-2">No riders are sharing their location right now.</p>;
  }
  return (
    <ul className="space-y-1">
      {riders.map((rider) => {
        const state = riderState(rider);
        const selected = rider.riderId === selectedRiderId;
        return (
          <li key={rider.riderId}>
            <button
              type="button"
              onClick={() => onSelect(rider.riderId)}
              className={`w-full text-left rounded-xl px-3 py-2 transition-all ${
                selected ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-canvas dark:hover:bg-ink/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RIDER_STATE_COLOR[state] }} />
                <span className="font-medium text-sm text-ink dark:text-white truncate">{rider.displayName}</span>
                <span className="ml-auto text-xs text-muted shrink-0">{lastSeenLabel(rider.recordedAt, now)}</span>
              </div>
              <div className="text-xs text-muted mt-0.5 pl-[18px]">
                {RIDER_STATE_LABEL[state]}
                {rider.openAssignmentCount > 0 && ` · ${rider.openAssignmentCount} open`}
                {rider.fleetPartnerName && ` · ${rider.fleetPartnerName}`}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PinList({
  points, canPin, placingId, onPlace, onPaste, onClear, loading, clearing,
}: {
  points: MapPoint[];
  canPin: boolean;
  placingId: string | null;
  onPlace: (point: MapPoint) => void;
  onPaste: (point: MapPoint, coords: { latitude: number; longitude: number }) => void;
  onClear: (point: MapPoint) => void;
  loading: boolean;
  clearing: boolean;
}) {
  const toast = useToast();
  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-muted m-2" />;
  if (points.length === 0) return <p className="text-sm text-muted p-2">This campus has no locations or vendors yet.</p>;

  const paste = (point: MapPoint) => {
    const text = window.prompt(
      `Paste coordinates for ${point.name} (e.g. "7.6235, 5.2214" from Google Maps):`,
    );
    if (text === null) return;
    const coords = parseCoordinates(text);
    if (!coords) {
      toast.error('Could not read those coordinates. Use "latitude, longitude".');
      return;
    }
    onPaste(point, coords);
  };

  return (
    <ul className="space-y-1">
      {points.map((point) => {
        const pinned = isPinned(point);
        const Icon = point.kind === 'vendor' ? Store : MapPin;
        return (
          <li
            key={`${point.kind}:${point.id}`}
            className={`rounded-xl px-3 py-2 ${placingId === point.id ? 'ring-2 ring-amber-400' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 shrink-0 ${point.kind === 'vendor' ? 'text-orange-600' : 'text-violet-600'}`} />
              <span className="text-sm font-medium text-ink dark:text-white truncate">{point.name}</span>
              <span className={`ml-auto text-xs shrink-0 ${pinned ? 'text-emerald-600' : 'text-amber-600'}`}>
                {pinned ? 'Pinned' : 'No pin'}
              </span>
            </div>
            {canPin && (
              <div className="flex gap-1.5 mt-1.5 pl-6">
                <Button size="sm" variant="outline" onClick={() => onPlace(point)}>
                  {pinned ? 'Move' : 'Place on map'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => paste(point)}>
                  Paste
                </Button>
                {pinned && (
                  <Button size="sm" variant="ghost" disabled={clearing} onClick={() => onClear(point)}>
                    Remove
                  </Button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
