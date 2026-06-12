"use client";

import { useCallback, useEffect, useRef } from "react";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps-config";
import { RADAR_LIVE_POLL_MS } from "@/lib/radar-config";
import { useAnimatedVehiclePositions } from "@/hooks/use-animated-vehicle-positions";
import { vehicleMarkerHtml } from "@/components/dashboard/fleet-radar-markers";
import type { FleetRadarMapProps } from "@/components/dashboard/fleet-radar-map";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

function mapOptions(): google.maps.MapOptions {
  return {
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
  };
}

function VehicleMarker({
  vehicle,
  selected,
  heading,
  onSelect,
}: {
  vehicle: FleetRadarMapProps["vehicles"][number];
  selected: boolean;
  heading: number;
  onSelect: (vehicle: FleetRadarMapProps["vehicles"][number]) => void;
}) {
  return (
    <div
      className="fp-radar-marker-wrap cursor-pointer"
      dangerouslySetInnerHTML={{ __html: vehicleMarkerHtml(vehicle, selected, heading) }}
      onClick={() => onSelect(vehicle)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(vehicle);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${vehicle.vehicle_number}, ${Math.round(vehicle.speed_mph)} miles per hour`}
    />
  );
}

export function FleetRadarMapGoogle({
  vehicles,
  center,
  selectedId,
  onSelect,
  fitKey,
  followSelected,
  showSweep,
  liveTracking = false,
  className,
}: FleetRadarMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "fleetpilot-google-maps",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    preventGoogleFontsLoading: true,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const vehiclesRef = useRef(vehicles);
  const didInitialFit = useRef(false);
  const animated = useAnimatedVehiclePositions(vehicles, RADAR_LIVE_POLL_MS - 500, liveTracking);

  vehiclesRef.current = vehicles;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const list = vehiclesRef.current;
    const shouldFit = fitKey > 0 || (!didInitialFit.current && list.length > 0);
    if (!shouldFit && list.length === 0 && !didInitialFit.current) {
      map.setCenter(center);
      map.setZoom(12);
      didInitialFit.current = true;
      return;
    }
    if (!shouldFit && fitKey === 0 && didInitialFit.current) return;

    if (list.length === 0) {
      map.setCenter(center);
      map.setZoom(12);
      didInitialFit.current = true;
      return;
    }

    didInitialFit.current = true;
    const bounds = new google.maps.LatLngBounds();
    list.forEach((v) => bounds.extend({ lat: v.latitude, lng: v.longitude }));
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  }, [fitKey, center, vehicles.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveTracking || !followSelected || !selectedId) return;
    const pos = animated.get(selectedId);
    const vehicle = vehicles.find((v) => v.id === selectedId);
    if (!pos && !vehicle) return;
    const lat = pos?.lat ?? vehicle!.latitude;
    const lng = pos?.lng ?? vehicle!.longitude;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 12) < 15) map.setZoom(15);
  }, [liveTracking, followSelected, selectedId, vehicles, animated]);

  if (loadError) {
    return (
      <div className={cn("flex h-full min-h-[320px] items-center justify-center bg-slate-100 p-6 text-center", className)}>
        <p className="text-sm text-slate-600">Google Maps failed to load. Check your API key and referrer restrictions.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("relative flex h-full min-h-[320px] items-center justify-center bg-slate-100", className)}>
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full min-h-[320px] fp-radar-map", className)}>
      <GoogleMap
        mapContainerClassName="absolute inset-0"
        center={center}
        zoom={12}
        options={mapOptions()}
        onLoad={onLoad}
      >
        {vehicles.map((vehicle) => {
          const pos = animated.get(vehicle.id) ?? {
            lat: vehicle.latitude,
            lng: vehicle.longitude,
            heading: vehicle.heading,
          };
          const selected = vehicle.id === selectedId;

          return (
            <OverlayView
              key={vehicle.id}
              position={{ lat: pos.lat, lng: pos.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={() => ({ x: -36, y: -34 })}
            >
              <VehicleMarker
                vehicle={vehicle}
                selected={selected}
                heading={pos.heading}
                onSelect={onSelect}
              />
            </OverlayView>
          );
        })}
      </GoogleMap>
      {showSweep && (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
          <div className="fp-radar-sweep" />
          <div className="fp-radar-grid" />
        </div>
      )}
    </div>
  );
}
