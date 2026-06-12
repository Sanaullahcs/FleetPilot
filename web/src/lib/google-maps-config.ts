/** Browser Maps JavaScript API key — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local */
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

export function hasGoogleMapsKey() {
  return GOOGLE_MAPS_API_KEY.length > 0;
}
