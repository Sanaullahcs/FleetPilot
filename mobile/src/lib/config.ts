import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** Expo Go exposes the dev machine IP via hostUri / debuggerHost. */
function resolveDevMachineHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const host = value.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
}

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // Android emulator reaches the host machine via 10.0.2.2, not LAN IP.
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:8000/api/v1';
  }

  const devHost = resolveDevMachineHost();

  // Physical device / Expo Go: use the same LAN IP as the Metro bundler.
  if (devHost) {
    return `http://${devHost}:8000/api/v1`;
  }

  // Standalone release builds on a physical device must not use the emulator loopback.
  if (Platform.OS === 'android' && Device.isDevice) {
    return 'http://192.168.100.212:8000/api/v1';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return 'http://127.0.0.1:8000/api/v1';
}

/**
 * Base URL for the FleetPilot API.
 * Auto-detects your PC's LAN IP when running in Expo Go on a phone.
 */
export const API_URL = resolveApiUrl();
