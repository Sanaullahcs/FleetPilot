import { openAssignmentPicker } from "@/lib/assignment-picker-store";
import type { StatusOption } from "@/lib/status-options";
import { toStatusPickerOptions } from "@/lib/status-options";

export async function promptChangeStatus(
  entityLabel: string,
  options: StatusOption[],
  currentStatus: string,
): Promise<string | false> {
  const result = await openAssignmentPicker({
    title: "Change status",
    description: `Update status for ${entityLabel}.`,
    options: toStatusPickerOptions(options),
    currentId: currentStatus,
    confirmLabel: "Save status",
    allowEmpty: false,
  });

  if (result === false || result === null) return false;
  return result;
}
