"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FleetRadarMapProps } from "@/components/dashboard/fleet-radar-map";
import { RADAR_LIVE_POLL_MS } from "@/lib/radar-config";
import { vehicleMarkerHtml } from "@/components/dashboard/fleet-radar-markers";
import { useAnimatedVehiclePositions } from "@/hooks/use-animated-vehicle-positions";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function buildIcon(vehicle: FleetRadarMapProps["vehicles"][number], selected: boolean, heading: number) {
  return L.divIcon({
    className: "fp-radar-marker-wrap",
    iconSize: [72, 68],
    iconAnchor: [36, 34],
    html: vehicleMarkerHtml(vehicle, selected, heading),
  });
}

export function FleetRadarMapLeaflet({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const vehiclesRef = useRef(vehicles);
  const didInitialFit = useRef(false);
  const mountedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const animated = useAnimatedVehiclePositions(vehicles, RADAR_LIVE_POLL_MS - 500, liveTracking);

  onSelectRef.current = onSelect;
  vehiclesRef.current = vehicles;

  useEffect(() => {
    if (!containerRef.current || mountedRef.current) return;
    mountedRef.current = true;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([center.lat, center.lng], 12);

    L.tileLayer(TILE_URL, { maxZoom: 20 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    setMapReady(true);

    const resize = () => map.invalidateSize();
    resize();
    const t1 = window.setTimeout(resize, 100);
    const t2 = window.setTimeout(resize, 400);
    window.addEventListener("resize", resize);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(containerRef.current);
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", resize);
      ro?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      mountedRef.current = false;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const list = vehiclesRef.current;
    const shouldFit = fitKey > 0 || (!didInitialFit.current && list.length > 0);
    if (!shouldFit && list.length === 0 && !didInitialFit.current) {
      map.setView([center.lat, center.lng], 12);
      didInitialFit.current = true;
      return;
    }
    if (!shouldFit && fitKey === 0 && didInitialFit.current) return;

    if (list.length === 0) {
      map.setView([center.lat, center.lng], 12, { animate: fitKey > 0 });
      didInitialFit.current = true;
      return;
    }

    didInitialFit.current = true;
    const bounds = L.latLngBounds(list.map((v) => [v.latitude, v.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.14), { animate: fitKey > 0, maxZoom: 14 });
  }, [fitKey, center.lat, center.lng, vehicles.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !liveTracking || !followSelected || !selectedId) return;
    const pos = animated.get(selectedId);
    const vehicle = vehicles.find((v) => v.id === selectedId);
    if (!pos && !vehicle) return;
    const lat = pos?.lat ?? vehicle!.latitude;
    const lng = pos?.lng ?? vehicle!.longitude;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [liveTracking, followSelected, selectedId, vehicles, animated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const liveIds = new Set(vehicles.map((v) => v.id));

    markersRef.current.forEach((marker, id) => {
      if (!liveIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    vehicles.forEach((vehicle) => {
      const selected = vehicle.id === selectedId;
      const pos = animated.get(vehicle.id) ?? {
        lat: vehicle.latitude,
        lng: vehicle.longitude,
        heading: vehicle.heading,
      };
      const existing = markersRef.current.get(vehicle.id);

      if (existing) {
        existing.setLatLng([pos.lat, pos.lng]);
        existing.setIcon(buildIcon(vehicle, selected, pos.heading));
        existing.setZIndexOffset(selected ? 1000 : vehicle.speed_mph >= 1 ? 500 : 100);
        return;
      }

      const marker = L.marker([pos.lat, pos.lng], {
        icon: buildIcon(vehicle, selected, pos.heading),
        zIndexOffset: selected ? 1000 : vehicle.speed_mph >= 1 ? 500 : 100,
      });
      marker.on("click", () => onSelectRef.current(vehicle));
      marker.addTo(map);
      markersRef.current.set(vehicle.id, marker);
    });
  }, [vehicles, selectedId, animated]);

  return (
    <div className={cn("relative h-full w-full min-h-[320px] fp-radar-map", className)}>
      <div ref={containerRef} className="absolute inset-0 z-0 bg-slate-200" />
      {!mapReady && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-slate-100">
          <Spinner className="h-8 w-8" />
        </div>
      )}
      {showSweep && (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
          <div className="fp-radar-sweep" />
          <div className="fp-radar-grid" />
        </div>
      )}
    </div>
  );
}
