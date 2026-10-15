import type { MapPoint, RiderMapEntry } from '@/lib/types';

export type LatLngTuple = [number, number];
export type RiderState = 'delivering' | 'available' | 'stale';

/** Roughly the middle of Nigeria, used before any rider or pin is known. */
export const DEFAULT_CENTER: LatLngTuple = [9.082, 8.6753];
export const DEFAULT_ZOOM = 6;

/** How often the map refetches rider positions. Riders report every 10-20 s. */
export const RIDER_REFRESH_MS = 10_000;

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** What to show for a rider: lost signal wins, then mid-delivery, else free. */
export function riderState(rider: RiderMapEntry): RiderState {
  if (rider.stale) return 'stale';
  if (rider.openAssignmentCount > 0) return 'delivering';
  return 'available';
}

export const RIDER_STATE_LABEL: Record<RiderState, string> = {
  delivering: 'Delivering',
  available: 'Available',
  stale: 'Signal lost',
};

export const RIDER_STATE_COLOR: Record<RiderState, string> = {
  delivering: '#2563eb',
  available: '#059669',
  stale: '#94a3b8',
};

const stateOrder: Record<RiderState, number> = { delivering: 0, available: 1, stale: 2 };

/** Delivering first, then available, lost signal last; alphabetical within each. */
export function sortRiders(riders: readonly RiderMapEntry[]): RiderMapEntry[] {
  return [...riders].sort(
    (a, b) =>
      stateOrder[riderState(a)] - stateOrder[riderState(b)] ||
      a.displayName.localeCompare(b.displayName),
  );
}

export function countByState(riders: readonly RiderMapEntry[]): Record<RiderState, number> {
  const counts: Record<RiderState, number> = { delivering: 0, available: 0, stale: 0 };
  for (const rider of riders) counts[riderState(rider)] += 1;
  return counts;
}

/** "just now", "4 min ago", "2 h ago" for a rider's last fix. */
export function lastSeenLabel(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function isPinned(point: MapPoint): point is MapPoint & { latitude: number; longitude: number } {
  return point.latitude !== null && point.longitude !== null;
}

/** Unpinned first (they need attention), then by kind and name. */
export function sortPoints(points: readonly MapPoint[]): MapPoint[] {
  return [...points].sort(
    (a, b) =>
      Number(isPinned(a)) - Number(isPinned(b)) ||
      a.kind.localeCompare(b.kind) ||
      a.name.localeCompare(b.name),
  );
}

/** South-west and north-east corners around everything worth showing, or null if nothing. */
export function boundsOf(coords: readonly LatLngTuple[]): [LatLngTuple, LatLngTuple] | null {
  if (coords.length === 0) return null;
  let [minLat, minLng] = coords[0]!;
  let [maxLat, maxLng] = coords[0]!;
  for (const [lat, lng] of coords) {
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * Read "lat, lng" as copied from Google Maps (long-press a spot). Accepts a comma or
 * whitespace separator and rejects anything outside valid ranges.
 */
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const match = text.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude: round6(latitude), longitude: round6(longitude) };
}

/** The backend stores six decimals (~0.1 m); round before sending so the echo matches. */
export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
