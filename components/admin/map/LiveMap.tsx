'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  RIDER_STATE_COLOR,
  RIDER_STATE_LABEL,
  boundsOf,
  isPinned,
  lastSeenLabel,
  riderState,
  round6,
  type LatLngTuple,
} from '@/lib/map';
import type { MapPoint, RiderMapEntry } from '@/lib/types';

export type LiveMapProps = {
  riders: RiderMapEntry[];
  points: MapPoint[];
  selectedRiderId: string | null;
  /** While set, the next map click places this point's pin. */
  placing: MapPoint | null;
  onPlace: (point: MapPoint, coords: { latitude: number; longitude: number }) => void;
  onSelectRider: (riderId: string) => void;
  /** Changes when the campus changes, so the view re-fits once for the new data. */
  fitKey: string;
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

// Div icons are plain HTML/CSS: no marker image assets to wire through the bundler.
function riderIcon(rider: RiderMapEntry, selected: boolean): L.DivIcon {
  const color = RIDER_STATE_COLOR[riderState(rider)];
  const initial = escapeHtml(rider.displayName.trim().charAt(0).toUpperCase() || '?');
  const heading =
    rider.headingDegrees === null || rider.stale
      ? ''
      : `<span style="position:absolute;left:50%;top:-7px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:7px solid ${color};transform:translateX(-50%) rotate(${rider.headingDegrees}deg);transform-origin:50% 21px"></span>`;
  const ring = selected ? 'box-shadow:0 0 0 4px rgba(37,99,235,.35);' : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:28px">${heading}<div style="width:28px;height:28px;border-radius:9999px;background:${color};color:#fff;border:2px solid #fff;${ring}display:flex;align-items:center;justify-content:center;font:600 12px system-ui,sans-serif;opacity:${rider.stale ? 0.7 : 1}">${initial}</div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function pointIcon(point: MapPoint, placing: boolean): L.DivIcon {
  const color = point.kind === 'vendor' ? '#ea580c' : '#7c3aed';
  const glyph = point.kind === 'vendor' ? 'V' : 'D';
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:6px;background:${color};color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font:700 11px system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.3);opacity:${point.active ? 1 : 0.5};${placing ? 'outline:3px solid #facc15;' : ''}">${glyph}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

/** Fit the view to everything once per campus, not on every 10 s refresh. */
function FitOnce({ coords, fitKey }: { coords: LatLngTuple[]; fitKey: string }) {
  const map = useMap();
  const fittedFor = useRef<string | null>(null);
  useEffect(() => {
    if (fittedFor.current === fitKey) return;
    const bounds = boundsOf(coords);
    if (!bounds) return;
    fittedFor.current = fitKey;
    map.fitBounds(bounds, { maxZoom: 17, padding: [40, 40] });
  }, [coords, fitKey, map]);
  return null;
}

function FlyToSelected({ rider }: { rider: RiderMapEntry | undefined }) {
  const map = useMap();
  const riderId = rider?.riderId;
  useEffect(() => {
    if (!rider) return;
    map.flyTo([rider.latitude, rider.longitude], Math.max(map.getZoom(), 16), { duration: 0.6 });
    // Only when the selection changes, not when the selected rider moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderId, map]);
  return null;
}

function PlaceOnClick({
  placing,
  onPlace,
}: {
  placing: MapPoint | null;
  onPlace: LiveMapProps['onPlace'];
}) {
  const map = useMapEvents({
    click(event) {
      if (!placing) return;
      onPlace(placing, { latitude: round6(event.latlng.lat), longitude: round6(event.latlng.lng) });
    },
  });
  useEffect(() => {
    map.getContainer().style.cursor = placing ? 'crosshair' : '';
  }, [map, placing]);
  return null;
}

export default function LiveMap({
  riders,
  points,
  selectedRiderId,
  placing,
  onPlace,
  onSelectRider,
  fitKey,
}: LiveMapProps) {
  const pinned = useMemo(() => points.filter(isPinned), [points]);
  const coords = useMemo<LatLngTuple[]>(
    () => [
      ...pinned.map((p): LatLngTuple => [p.latitude, p.longitude]),
      ...riders.map((r): LatLngTuple => [r.latitude, r.longitude]),
    ],
    [pinned, riders],
  );
  const selected = riders.find((r) => r.riderId === selectedRiderId);
  const now = new Date();

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full rounded-3xl z-0"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <FitOnce coords={coords} fitKey={fitKey} />
      <FlyToSelected rider={selected} />
      <PlaceOnClick placing={placing} onPlace={onPlace} />

      {pinned.map((point) => (
        <Marker
          key={`${point.kind}:${point.id}`}
          position={[point.latitude, point.longitude]}
          icon={pointIcon(point, placing?.id === point.id)}
        >
          <Popup>
            <strong>{point.name}</strong>
            <br />
            {point.kind === 'vendor' ? 'Vendor pickup' : 'Drop-off point'}
            {!point.active && ' · inactive'}
          </Popup>
        </Marker>
      ))}

      {riders.map((rider) => {
        const state = riderState(rider);
        return (
          <Marker
            key={rider.riderId}
            position={[rider.latitude, rider.longitude]}
            icon={riderIcon(rider, rider.riderId === selectedRiderId)}
            zIndexOffset={rider.riderId === selectedRiderId ? 1000 : state === 'stale' ? -100 : 0}
            eventHandlers={{ click: () => onSelectRider(rider.riderId) }}
          >
            <Popup>
              <strong>{rider.displayName}</strong>
              <br />
              {RIDER_STATE_LABEL[state]}
              {rider.openAssignmentCount > 0 &&
                ` · ${rider.openAssignmentCount} open ${rider.openAssignmentCount === 1 ? 'delivery' : 'deliveries'}`}
              <br />
              {rider.fleetPartnerName ? `Fleet: ${rider.fleetPartnerName}` : 'Platform rider'}
              <br />
              Last seen {lastSeenLabel(rider.recordedAt, now)}
              {rider.accuracyMeters !== null && ` · ±${rider.accuracyMeters} m`}
              <br />
              <a href={`tel:${rider.phone.replace(/[^+\d]/g, '')}`}>{rider.phone}</a>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
