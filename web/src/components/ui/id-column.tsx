"use client";

import type { Column } from "@/components/ui/data-table";

export function idColumn<T>(fieldKey: string, getValue: (row: T) => string | null | undefined): Column<T> {
  return {
    key: fieldKey,
    header: "ID",
    sortable: true,
    sortValue: getValue,
    hideOnMobile: true,
    render: (row) => (
      <span className="font-mono text-xs font-semibold tracking-wide text-slate-600">
        {getValue(row) ?? "—"}
      </span>
    ),
  };
}
