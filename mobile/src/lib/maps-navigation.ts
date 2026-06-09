import { Linking, Platform } from 'react-native';

export type MapStop = {
  id?: string;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type NavigationAppId = 'apple' | 'google' | 'waze' | 'geo';

export type NavigationAppOption = {
  id: NavigationAppId;
  name: string;
  subtitle: string;
  icon: 'map' | 'navigate' | 'car';
};

export function getNextPendingStop<T extends { status?: string }>(stops: T[]): T | undefined {
  return stops.find((s) => s.status !== 'completed');
}

export function getStopCoordinates(stop: MapStop): { latitude: number; longitude: number } | null {
  const lat = stop.latitude;
  const lng = stop.longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

function buildDestinationQuery(stop: MapStop): string | null {
  const coords = getStopCoordinates(stop);
  if (coords) {
    return `${coords.latitude},${coords.longitude}`;
  }
  const address = stop.address?.trim();
  if (address) {
    return address;
  }
  return stop.name?.trim() || null;
}

function encodeDestination(stop: MapStop): string | null {
  const destination = buildDestinationQuery(stop);
  return destination ? encodeURIComponent(destination) : null;
}

export function haversineMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EXTERNAL_APPS: Array<{
  id: NavigationAppId;
  name: string;
  subtitle: string;
  icon: NavigationAppOption['icon'];
  platforms: Array<'ios' | 'android' | 'web'>;
  buildUrl: (encoded: string, stop: MapStop) => string;
  probeUrl?: (encoded: string, stop: MapStop) => string;
}> = [
  {
    id: 'apple',
    name: 'Apple Maps',
    subtitle: 'Turn-by-turn on iPhone',
    icon: 'map',
    platforms: ['ios'],
    buildUrl: (encoded) => `maps://?daddr=${encoded}&dirflg=d`,
    probeUrl: (encoded) => `maps://?daddr=${encoded}`,
  },
  {
    id: 'google',
    name: 'Google Maps',
    subtitle: 'Turn-by-turn directions',
    icon: 'navigate',
    platforms: ['ios', 'android'],
    buildUrl: (encoded, stop) => {
      const coords = getStopCoordinates(stop);
      if (Platform.OS === 'android' && coords) {
        return `google.navigation:q=${coords.latitude},${coords.longitude}`;
      }
      if (Platform.OS === 'ios') {
        return `comgooglemaps://?daddr=${encoded}&directionsmode=driving`;
      }
      return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
    },
    probeUrl: (encoded) =>
      Platform.OS === 'ios' ? `comgooglemaps://?daddr=${encoded}` : `google.navigation:q=${encoded}`,
  },
  {
    id: 'waze',
    name: 'Waze',
    subtitle: 'Community navigation',
    icon: 'car',
    platforms: ['ios', 'android'],
    buildUrl: (_encoded, stop) => {
      const coords = getStopCoordinates(stop);
      if (coords) {
        return `waze://?ll=${coords.latitude},${coords.longitude}&navigate=yes`;
      }
      return `waze://?q=${encodeURIComponent(stop.address ?? stop.name)}&navigate=yes`;
    },
    probeUrl: () => 'waze://',
  },
  {
    id: 'geo',
    name: 'Other navigation apps',
    subtitle: 'Choose from installed apps',
    icon: 'navigate',
    platforms: ['android'],
    buildUrl: (_encoded, stop) => {
      const coords = getStopCoordinates(stop);
      if (coords) {
        return `geo:${coords.latitude},${coords.longitude}?q=${coords.latitude},${coords.longitude}(${encodeURIComponent(stop.name)})`;
      }
      return `geo:0,0?q=${encodeURIComponent(stop.address ?? stop.name)}`;
    },
  },
];

export async function getAvailableExternalApps(stop: MapStop): Promise<NavigationAppOption[]> {
  const encoded = encodeDestination(stop);
  if (!encoded) {
    return [];
  }

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const options: NavigationAppOption[] = [];

  for (const app of EXTERNAL_APPS) {
    if (!app.platforms.includes(platform)) {
      continue;
    }

    if (app.probeUrl) {
      try {
        const canOpen = await Linking.canOpenURL(app.probeUrl(encoded, stop));
        if (!canOpen) {
          continue;
        }
      } catch {
        continue;
      }
    }

    options.push({
      id: app.id,
      name: app.name,
      subtitle: app.subtitle,
      icon: app.icon,
    });
  }

  return options;
}

/** Opens turn-by-turn navigation in a specific external app. */
export async function openExternalNavigation(appId: NavigationAppId, stop: MapStop): Promise<boolean> {
  const encoded = encodeDestination(stop);
  if (!encoded) {
    return false;
  }

  const app = EXTERNAL_APPS.find((item) => item.id === appId);
  if (!app) {
    return false;
  }

  const url = app.buildUrl(encoded, stop);
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    try {
      await Linking.openURL(fallback);
      return true;
    } catch {
      return false;
    }
  }
}

/** Opens the best available external navigation app (platform default). */
export async function openDefaultExternalNavigation(stop: MapStop): Promise<boolean> {
  const apps = await getAvailableExternalApps(stop);
  if (apps.length === 0) {
    const encoded = encodeDestination(stop);
    if (!encoded) {
      return false;
    }
    try {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`);
      return true;
    } catch {
      return false;
    }
  }

  return openExternalNavigation(apps[0].id, stop);
}
