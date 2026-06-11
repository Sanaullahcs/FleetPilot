import { Platform } from 'react-native';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

/** Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env to switch from static map to live tiles. */
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export function hasGoogleMapsKey() {
  return GOOGLE_MAPS_API_KEY.length > 0;
}

export function getMapProvider() {
  if (Platform.OS === 'android' && hasGoogleMapsKey()) {
    return PROVIDER_GOOGLE;
  }
  return PROVIDER_DEFAULT;
}

export function getMapType(): 'standard' | 'none' {
  return 'standard';
}
