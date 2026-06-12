"use client";

import { hasGoogleMapsKey } from "@/lib/google-maps-config";
import type { FleetLiveVehicle } from "@/lib/types";
import { FleetRadarMapGoogle } from "@/components/dashboard/fleet-radar-map-google";
import { FleetRadarMapLeaflet } from "@/components/dashboard/fleet-radar-map-leaflet";

export type FleetRadarMapProps = {
  vehicles: FleetLiveVehicle[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (vehicle: FleetLiveVehicle) => void;
  fitKey: number;
  followSelected: boolean;
  showSweep: boolean;
  /** When false, markers snap to last positions (no animation / fewer map updates). */
  liveTracking?: boolean;
  className?: string;
};

export function FleetRadarMap(props: FleetRadarMapProps) {
  if (hasGoogleMapsKey()) {
    return <FleetRadarMapGoogle {...props} />;
  }
  return <FleetRadarMapLeaflet {...props} />;
}
