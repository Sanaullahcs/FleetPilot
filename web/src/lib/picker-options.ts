import type { Driver, Vehicle } from "@/lib/types";
import type { RichPickerOption } from "@/lib/assignment-picker-store";

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
