import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import {
  boundsOf,
  countByState,
  lastSeenLabel,
  parseCoordinates,
  riderState,
  sortPoints,
  sortRiders,
} from '@/lib/map';
import type { MapPoint, RiderMapEntry } from '@/lib/types';

const now = new Date('2026-10-15T12:00:00.000Z');

function rider(overrides: Partial<RiderMapEntry>): RiderMapEntry {
  return {
    accuracyMeters: 8,
    available: true,
    campusId: 'campus-1',
    displayName: 'Rider',
    fleetPartnerId: null,
    fleetPartnerName: null,
    headingDegrees: null,
    latitude: 7.62,
    longitude: 5.22,
    openAssignmentCount: 0,
    phone: '+2348000000000',
    recordedAt: now.toISOString(),
    riderId: 'rider-1',
    speedMps: null,
    stale: false,
    ...overrides,
  };
}

function point(overrides: Partial<MapPoint>): MapPoint {
  return {
    active: true,
    id: 'point-1',
    kind: 'location',
    latitude: null,
    longitude: null,
    name: 'Unity Hostel',
    zoneId: null,
    ...overrides,
  };
}

describe('live map helpers', () => {
  it('classifies riders: lost signal beats delivering beats available', () => {
    expect(riderState(rider({ stale: true, openAssignmentCount: 2 }))).toBe('stale');
    expect(riderState(rider({ openAssignmentCount: 1 }))).toBe('delivering');
    expect(riderState(rider({}))).toBe('available');
  });

  it('sorts delivering riders first and lost-signal riders last', () => {
    const sorted = sortRiders([
      rider({ displayName: 'Zed', riderId: 'z', stale: true }),
      rider({ displayName: 'Bola', riderId: 'b' }),
      rider({ displayName: 'Ada', riderId: 'a', openAssignmentCount: 1 }),
      rider({ displayName: 'Ayo', riderId: 'y' }),
    ]);
    expect(sorted.map((r) => r.riderId)).toEqual(['a', 'y', 'b', 'z']);
    expect(countByState(sorted)).toEqual({ available: 2, delivering: 1, stale: 1 });
  });

  it('describes how long ago a rider was seen', () => {
    expect(lastSeenLabel('2026-10-15T11:59:40.000Z', now)).toBe('just now');
    expect(lastSeenLabel('2026-10-15T11:56:00.000Z', now)).toBe('4 min ago');
    expect(lastSeenLabel('2026-10-15T10:00:00.000Z', now)).toBe('2 h ago');
    expect(lastSeenLabel('not a date', now)).toBe('—');
  });

  it('puts unpinned places first so they get attention', () => {
    const sorted = sortPoints([
      point({ id: 'pinned', latitude: 7.6, longitude: 5.2, name: 'A' }),
      point({ id: 'vendor', kind: 'vendor', name: 'B' }),
      point({ id: 'location', name: 'C' }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['location', 'vendor', 'pinned']);
  });

  it('computes bounds around all coordinates', () => {
    expect(boundsOf([])).toBeNull();
    expect(
      boundsOf([
        [7.6, 5.3],
        [7.7, 5.1],
        [7.65, 5.2],
      ]),
    ).toEqual([
      [7.6, 5.1],
      [7.7, 5.3],
    ]);
  });

  it('reads coordinates pasted from Google Maps', () => {
    expect(parseCoordinates('7.6235, 5.2214')).toEqual({ latitude: 7.6235, longitude: 5.2214 });
    expect(parseCoordinates(' -7.62351234 5.22141234 ')).toEqual({
      latitude: -7.623512,
      longitude: 5.221412,
    });
    expect(parseCoordinates('91, 5')).toBeNull();
    expect(parseCoordinates('7.6, 181')).toBeNull();
    expect(parseCoordinates('Unity Hostel')).toBeNull();
  });
});

describe('live map api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the admin map endpoints through the proxy', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ data: [] }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );

    await api.getRiderPositions({ campusId: 'campus-1' });
    await api.getMapPoints('campus-1');
    await api.setMapPoint('location', 'loc-1', { latitude: 7.6, longitude: 5.2 });
    await api.clearMapPoint('vendor', 'vendor-1');

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method ?? 'GET'])).toEqual([
      ['/api/proxy/admin/map/riders?campusId=campus-1', 'GET'],
      ['/api/proxy/admin/map/campuses/campus-1/points', 'GET'],
      ['/api/proxy/admin/map/locations/loc-1/coordinates', 'PUT'],
      ['/api/proxy/admin/map/vendors/vendor-1/coordinates', 'DELETE'],
    ]);
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit).body).toBe(
      JSON.stringify({ latitude: 7.6, longitude: 5.2 }),
    );
  });
});
