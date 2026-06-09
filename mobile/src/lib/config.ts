/**
 * Base URL for the FleetPilot API.
 *
 * Note: on a physical device, `127.0.0.1` points at the device itself. Set
 * EXPO_PUBLIC_API_URL to your machine's LAN IP (e.g. http://192.168.1.20:8000/api/v1)
 * when testing on hardware. Android emulators can use http://10.0.2.2:8000/api/v1.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1';
