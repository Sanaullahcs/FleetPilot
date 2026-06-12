import type { FleetLiveVehicle } from "@/lib/types";
import { vehicleMarkerSvg } from "@/components/dashboard/fleet-radar-icons";

export function vehicleMarkerHtml(vehicle: FleetLiveVehicle, selected: boolean, heading?: number): string {
  const moving = vehicle.speed_mph >= 1;
  const rotation = heading ?? vehicle.heading;

  return `
    <div class="fp-vehicle-marker ${selected ? "fp-vehicle-marker--selected" : ""} ${moving ? "fp-vehicle-marker--moving" : ""}">
      <div class="fp-vehicle-marker__pin">
        <div class="fp-vehicle-marker__body" style="transform:rotate(${rotation}deg)">
          ${vehicleMarkerSvg(vehicle.type)}
        </div>
      </div>
      <div class="fp-vehicle-marker__label">${vehicle.vehicle_number}</div>
      ${moving ? `<div class="fp-vehicle-marker__speed">${Math.round(vehicle.speed_mph)} mph</div>` : ""}
    </div>
  `;
}
