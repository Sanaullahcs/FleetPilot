import { openAssignmentPicker, type RichPickerOption } from "@/lib/assignment-picker-store";

export type { RichPickerOption as PickerOption };

export async function promptAssignDriver(
  vehicleLabel: string,
  drivers: RichPickerOption[],
  currentDriverId?: string | null,
): Promise<string | null | false> {
  return openAssignmentPicker({
    title: "Assign driver",
    description: `Choose a driver for ${vehicleLabel}.`,
    hint: "Selecting none removes the current assignment.",
    options: drivers,
    currentId: currentDriverId,
    confirmLabel: "Save assignment",
  });
}

export async function promptAssignVehicle(
  driverLabel: string,
  vehicles: RichPickerOption[],
  currentVehicleId?: string | null,
): Promise<string | null | false> {
  return openAssignmentPicker({
    title: "Assign vehicle",
    description: `Choose a vehicle for ${driverLabel}.`,
    hint: "A vehicle can only be assigned to one driver at a time.",
    options: vehicles,
    currentId: currentVehicleId,
    confirmLabel: "Save assignment",
  });
}

export async function promptAssignStudentDriver(
  studentLabel: string,
  drivers: RichPickerOption[],
  currentDriverId?: string | null,
): Promise<string | null | false> {
  return openAssignmentPicker({
    title: "Assign driver to student",
    description: `Assign a driver for ${studentLabel}.`,
    options: drivers,
    currentId: currentDriverId,
    confirmLabel: "Save",
  });
}
