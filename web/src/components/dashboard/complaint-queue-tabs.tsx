"use client";

import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/dropdown-menu";

export type ComplaintRoleTab = "" | "parent" | "driver" | "school_contact";

export const COMPLAINT_ROLE_TABS: {
  id: ComplaintRoleTab;
  shortLabel: string;
  emptyMessage: string;
}[] = [
  { id: "", shortLabel: "All", emptyMessage: "No complaints in the queue yet." },
  { id: "parent", shortLabel: "Parents", emptyMessage: "No parent complaints yet." },
  { id: "driver", shortLabel: "Drivers", emptyMessage: "No driver complaints yet." },
  { id: "school_contact", shortLabel: "Schools", emptyMessage: "No school complaints yet." },
];

export function ComplaintQueueTabs({
  active,
  onChange,
  counts,
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  statusOptions,
  priorityOptions,
  showStaffFilters,
}: {
  active: ComplaintRoleTab;
  onChange: (tab: ComplaintRoleTab) => void;
  counts: Record<ComplaintRoleTab, number>;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  showStaffFilters: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COMPLAINT_ROLE_TABS.map((tab) => {
            const selected = tab.id === active;
            const total = counts[tab.id];
            return (
              <button
                key={tab.id || "all"}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition",
                  selected
                    ? "border-brand-primary bg-brand-primary text-white shadow-sm shadow-brand-primary/15"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-primary/30 hover:bg-brand-light/30",
                )}
              >
                <span className="text-xs font-semibold leading-none">{tab.shortLabel}</span>
                <span className={cn("text-[10px] tabular-nums", selected ? "text-white/70" : "text-slate-400")}>
                  {total}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full shrink-0 sm:w-52 lg:w-60">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search complaints…"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
          />
        </div>
      </div>

      {showStaffFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <SearchableSelect
              value={status}
              onChange={onStatusChange}
              options={statusOptions}
              allLabel="All statuses"
              searchPlaceholder="Filter status…"
              searchable={false}
              className="h-8 text-xs"
            />
          </div>
          <div className="w-40">
            <SearchableSelect
              value={priority}
              onChange={onPriorityChange}
              options={priorityOptions}
              allLabel="All priorities"
              searchPlaceholder="Filter priority…"
              searchable={false}
              className="h-8 text-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function countComplaintsByRole(
  items: { submitter_role: string }[],
): Record<ComplaintRoleTab, number> {
  const out: Record<ComplaintRoleTab, number> = {
    "": items.length,
    parent: 0,
    driver: 0,
    school_contact: 0,
  };
  for (const item of items) {
    if (item.submitter_role === "parent") out.parent += 1;
    if (item.submitter_role === "driver") out.driver += 1;
    if (item.submitter_role === "school_contact") out.school_contact += 1;
  }
  return out;
}
