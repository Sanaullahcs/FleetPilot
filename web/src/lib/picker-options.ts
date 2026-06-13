import type { SelectOption } from "@/components/ui/dropdown-menu";
import type { Driver, Vehicle } from "@/lib/types";
import type { RichPickerOption } from "@/lib/assignment-picker-store";
import { titleCase } from "@/lib/utils";

export function formatVehicleSelectLabel(vehicle: {
  vehicle_number: string;
  type: string;
  license_plate?: string | null;
}) {
  const typeLabel = titleCase(vehicle.type.replace(/_/g, " "));
  return vehicle.license_plate
    ? `${vehicle.vehicle_number} · ${typeLabel} · ${vehicle.license_plate}`
    : `${vehicle.vehicle_number} · ${typeLabel}`;
}

/** Ensures driver default vehicles appear in the vehicle dropdown with readable labels. */
export function buildVehicleSelectOptions(
  vehicles: Vehicle[],
  drivers: Driver[] = [],
  extras: Array<{ id: string; vehicle_number: string; type: string; license_plate?: string | null }> = [],
): SelectOption[] {
  const map = new Map<string, SelectOption>();

  for (const vehicle of vehicles) {
    map.set(vehicle.id, {
      label: formatVehicleSelectLabel(vehicle),
      value: vehicle.id,
      searchText: [vehicle.vehicle_number, vehicle.license_plate, vehicle.make, vehicle.model, vehicle.type]
        .filter(Boolean)
        .join(" "),
    });
  }

  for (const driver of drivers) {
    const dv = driver.default_vehicle;
    if (!dv?.id || map.has(dv.id)) continue;
    map.set(dv.id, {
      label: formatVehicleSelectLabel(dv),
      value: dv.id,
      sublabel: "Driver Default Vehicle",
      searchText: [dv.vehicle_number, dv.type, driver.first_name, driver.last_name].filter(Boolean).join(" "),
    });
  }

  for (const extra of extras) {
    if (!extra.id || map.has(extra.id)) continue;
    map.set(extra.id, {
      label: formatVehicleSelectLabel(extra),
      value: extra.id,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function buildDriverPickerOptions(drivers: Driver[]): RichPickerOption[] {
  return drivers.map((d) => {
    const name = `${d.first_name} ${d.last_name}`;
    const meta = [d.phone, d.email].filter(Boolean).join(" · ");
    const sublabel = [d.employee_id, d.default_vehicle?.vehicle_number].filter(Boolean).join(" · ");

    return {
      id: d.id,
      label: name,
      sublabel: sublabel || undefined,
      meta: meta || undefined,
      searchText: [name, d.employee_id, d.email, d.phone, d.license_number].filter(Boolean).join(" "),
    };
  });
}

export function buildVehiclePickerOptions(vehicles: Vehicle[]): RichPickerOption[] {
  return vehicles.map((v) => {
    const meta = [v.license_plate, v.make, v.model].filter(Boolean).join(" · ");
    const sublabel = [v.type.replace(/_/g, " "), v.capacity ? `${v.capacity} seats` : null].filter(Boolean).join(" · ");

    return {
      id: v.id,
      label: v.vehicle_number,
      sublabel: sublabel || undefined,
      meta: meta || undefined,
      searchText: [v.vehicle_number, v.license_plate, v.make, v.model, v.type].filter(Boolean).join(" "),
    };
  });
}
