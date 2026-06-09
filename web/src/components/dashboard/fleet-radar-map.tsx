"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FleetLiveVehicle } from "@/lib/types";
import { vehicleMarkerSvg } from "@/components/dashboard/fleet-radar-icons";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/primitives";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function vehicleMarkerHtml(vehicle: FleetLiveVehicle, selected: boolean): string {
  const moving = vehicle.speed_mph >= 1;

  return `
    <div class="fp-vehicle-marker ${selected ? "fp-vehicle-marker--selected" : ""} ${moving ? "fp-vehicle-marker--moving" : ""}">
      <div class="fp-vehicle-marker__pin">
        <div class="fp-vehicle-marker__body" style="transform:rotate(${vehicle.heading}deg)">
          ${vehicleMarkerSvg(vehicle.type)}
        </div>
      </div>
      <div class="fp-vehicle-marker__label">${vehicle.vehicle_number}</div>
      ${moving ? `<div class="fp-vehicle-marker__speed">${Math.round(vehicle.speed_mph)} mph</div>` : ""}
    </div>
  `;
}

function buildIcon(vehicle: FleetLiveVehicle, selected: boolean) {
  return L.divIcon({
    className: "fp-radar-marker-wrap",
    iconSize: [72, 68],
    iconAnchor: [36, 34],
    html: vehicleMarkerHtml(vehicle, selected),
  });
}

export function FleetRadarMap({
  vehicles,
  center,
  selectedId,
  onSelect,
  fitKey,
  followSelected,
  showSweep,
  className,
}: {
  vehicles: FleetLiveVehicle[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (vehicle: FleetLiveVehicle) => void;
  fitKey: number;
  followSelected: boolean;
  showSweep: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  const didInitialFit = useRef(false);
  const mountedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  onSelectRef.current = onSelect;

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

    const shouldFit = fitKey > 0 || (!didInitialFit.current && vehicles.length > 0);
    if (!shouldFit && vehicles.length === 0 && !didInitialFit.current) {
      map.setView([center.lat, center.lng], 12);
      didInitialFit.current = true;
      return;
    }
    if (!shouldFit && fitKey === 0 && didInitialFit.current) return;

    if (vehicles.length === 0) {
      map.setView([center.lat, center.lng], 12, { animate: fitKey > 0 });
      didInitialFit.current = true;
      return;
    }

    didInitialFit.current = true;
    const bounds = L.latLngBounds(vehicles.map((v) => [v.latitude, v.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.14), { animate: fitKey > 0, maxZoom: 14 });
  }, [fitKey, vehicles, center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followSelected || !selectedId) return;
    const vehicle = vehicles.find((v) => v.id === selectedId);
    if (!vehicle) return;
    map.flyTo([vehicle.latitude, vehicle.longitude], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [followSelected, selectedId, vehicles]);

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
      const existing = markersRef.current.get(vehicle.id);

      if (existing) {
        existing.setLatLng([vehicle.latitude, vehicle.longitude]);
        existing.setIcon(buildIcon(vehicle, selected));
        existing.setZIndexOffset(selected ? 1000 : vehicle.speed_mph >= 1 ? 500 : 100);
        return;
      }

      const marker = L.marker([vehicle.latitude, vehicle.longitude], {
        icon: buildIcon(vehicle, selected),
        zIndexOffset: selected ? 1000 : vehicle.speed_mph >= 1 ? 500 : 100,
      });
      marker.on("click", () => onSelectRef.current(vehicle));
      marker.addTo(map);
      markersRef.current.set(vehicle.id, marker);
    });
  }, [vehicles, selectedId]);

  return (
    <div className={cn("relative h-full w-full min-h-[320px]", className)}>
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
