"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/modal";
import { RichSelectList } from "@/components/ui/rich-select-list";
import {
  cancelAssignmentPicker,
  confirmAssignmentPicker,
  getAssignmentPickerState,
  subscribeAssignmentPicker,
} from "@/lib/assignment-picker-store";

export function AssignmentPickerHost() {
  const { open, config } = useSyncExternalStore(subscribeAssignmentPicker, getAssignmentPickerState, getAssignmentPickerState);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (open && config) {
      setSelected(config.currentId ?? "");
    }
  }, [open, config?.currentId]);

  if (!open || !config) return null;

  return (
    <Modal
      open={open}
      onClose={() => cancelAssignmentPicker()}
      title={config.title}
      description={config.description}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => cancelAssignmentPicker()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => confirmAssignmentPicker(selected || null)}
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-primary/25 transition hover:bg-brand-dark"
          >
            {config.confirmLabel ?? "Save assignment"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <RichSelectList
          options={config.options}
          value={selected}
          onChange={setSelected}
          emptyLabel={config.emptyLabel ?? "— None —"}
          allowEmpty={config.allowEmpty !== false}
          searchPlaceholder="Search by name, ID, email, or phone…"
        />
        {config.hint && <p className="text-xs text-slate-400">{config.hint}</p>}
      </div>
    </Modal>
  );
}
