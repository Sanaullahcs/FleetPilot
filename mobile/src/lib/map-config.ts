import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

/** Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env for Google tiles in dev/standalone builds. */
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

export function hasGoogleMapsKey() {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

/**
 * Google MapView tiles (not the static illustration).
 * In Expo Go we use the default provider — forcing PROVIDER_GOOGLE with a custom key causes a black map.
 */
export function shouldUseNativeMapView() {
  return hasGoogleMapsKey() || isExpoGo();
}

/** Google tile provider — only in dev/standalone builds where app.config injects the native key. */
export function canUseGoogleMapTiles() {
  return hasGoogleMapsKey() && !isExpoGo();
}

export function getMapProvider() {
  if (canUseGoogleMapTiles() && (Platform.OS === 'android' || Platform.OS === 'ios')) {
    return PROVIDER_GOOGLE;
  }
  return PROVIDER_DEFAULT;
}

export function getMapModeLabel(): string | null {
  if (!shouldUseNativeMapView()) return 'Minnesota preview';
  if (isExpoGo()) return 'Device maps (Expo Go)';
  if (canUseGoogleMapTiles()) return 'Google Maps';
  return null;
}

export function getMapSetupHint(): string | null {
  if (isExpoGo() && hasGoogleMapsKey()) {
    return 'Expo Go uses device maps. Build the FleetPilot APK for Google Maps with your API key.';
  }
  if (canUseGoogleMapTiles()) {
    return 'If the map is blank, enable billing and Maps SDK for Android/iOS on your Google Cloud key.';
  }
  if (!hasGoogleMapsKey()) {
    return 'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to mobile/.env for live Google map tiles.';
  }
  return null;
}

/** Quick health check — Static Maps uses the same billing/API gate as native tiles. */
export async function verifyGoogleMapsKey(): Promise<{ ok: boolean; message: string }> {
  if (!GOOGLE_MAPS_API_KEY) {
    return { ok: false, message: 'No Google Maps API key in mobile/.env.' };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=44.9778,-93.2650&zoom=10&size=64x64&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;
    const res = await fetch(url);
    if (res.ok) {
      return { ok: true, message: 'Google Maps API key is valid.' };
    }
    const body = await res.text();
    if (body.includes('billing') || body.includes('Billing')) {
      return {
        ok: false,
        message: 'Google Maps billing is not enabled. Turn on billing in Google Cloud Console.',
      };
    }
    if (body.includes('API key') || body.includes('referer') || body.includes('restriction')) {
      return {
        ok: false,
        message: 'Google Maps API key was rejected. Check API restrictions and enabled Maps SDKs.',
      };
    }
    return { ok: false, message: 'Google Maps API key could not load map tiles.' };
  } catch {
    return { ok: false, message: 'Could not reach Google Maps to verify your API key.' };
  }
}

export function getMapType(): 'standard' | 'none' {
  return 'standard';
}
