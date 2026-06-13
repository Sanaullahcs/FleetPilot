import { titleCase } from "@/lib/utils";
import type { RichPickerOption } from "@/lib/assignment-picker-store";

export interface StatusOption {
  value: string;
  label: string;
}

export const DRIVER_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export const VEHICLE_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "retired", label: "Retired" },
];

export const STUDENT_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "transferred", label: "Transferred" },
];

export const ROUTE_STATUS_OPTIONS: StatusOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

export function toStatusPickerOptions(options: StatusOption[]): RichPickerOption[] {
  return options.map((o) => ({
    id: o.value,
    label: o.label,
    sublabel: titleCase(o.value.replace(/_/g, " ")),
    searchText: `${o.label} ${o.value}`,
  }));
}
