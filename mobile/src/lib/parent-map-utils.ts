import type { ParentTrackItem } from '@/lib/mobile-types';

export const DEFAULT_MAP_REGION = {
  latitude: 39.7817,
  longitude: -89.6501,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

export function isValidCoord(lat?: number | null, lng?: number | null): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function regionForTracks(
  tracks: ParentTrackItem[],
  focusTrack?: ParentTrackItem | null,
  center?: { lat: number; lng: number },
) {
  const active = focusTrack ?? tracks[0];
  const points: Array<{ latitude: number; longitude: number }> = [];

  for (const track of tracks) {
    if (track.vehicle && isValidCoord(track.vehicle.latitude, track.vehicle.longitude)) {
      points.push({ latitude: track.vehicle.latitude, longitude: track.vehicle.longitude });
    }
    if (track.school && isValidCoord(track.school.latitude, track.school.longitude)) {
      points.push({ latitude: track.school.latitude!, longitude: track.school.longitude! });
    }
  }

  if (center && isValidCoord(center.lat, center.lng)) {
    points.push({ latitude: center.lat, longitude: center.lng });
  }

  if (points.length === 0) {
    return DEFAULT_MAP_REGION;
  }

  if (points.length === 1) {
    return {
      ...points[0],
      latitudeDelta: 0.035,
      longitudeDelta: 0.035,
    };
  }

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.012;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, active ? 0.025 : 0.04),
    longitudeDelta: Math.max(maxLng - minLng + pad, active ? 0.025 : 0.04),
  };
}

export function routePolyline(track?: ParentTrackItem | null) {
  if (!track?.vehicle || !track.school) return [];
  const bus = track.vehicle;
  if (!isValidCoord(bus.latitude, bus.longitude)) return [];
  if (!isValidCoord(track.school.latitude, track.school.longitude)) return [];
  return [
    { latitude: track.school.latitude!, longitude: track.school.longitude! },
    { latitude: bus.latitude, longitude: bus.longitude },
  ];
}
