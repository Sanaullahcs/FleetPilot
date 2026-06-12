/** Fleet radar poll interval while live tracking is enabled (ms). */
export const RADAR_LIVE_POLL_MS = 8_000;

/** How long a paused snapshot stays fresh before a background refetch on focus (ms). */
export const RADAR_SNAPSHOT_STALE_MS = 5 * 60 * 1000;

export const RADAR_LIVE_PREF_KEY = "fleetpilot-radar-live-tracking";

export function readRadarLivePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(RADAR_LIVE_PREF_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeRadarLivePreference(enabled: boolean) {
  try {
    window.localStorage.setItem(RADAR_LIVE_PREF_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}
