"use client";

import { cn, titleCase } from "@/lib/utils";

export function AssignmentChip({
  label,
  sublabel,
  emptyLabel = "Assign…",
  onClick,
  disabled,
}: {
  label?: string | null;
  sublabel?: string | null;
  emptyLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const assigned = Boolean(label);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        "group rounded-lg border px-2.5 py-1.5 text-left transition",
        onClick && !disabled && "cursor-pointer hover:border-brand-primary/30 hover:bg-brand-primary/5",
        assigned ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50/80",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {assigned ? (
        <>
          <p className="text-sm font-medium text-slate-900 group-hover:text-brand-primary">{label}</p>
          {sublabel && <p className="truncate text-xs text-slate-400">{sublabel}</p>}
        </>
      ) : (
        <p className="text-xs font-semibold text-brand-primary">{emptyLabel}</p>
      )}
    </button>
  );
}

export function PageTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-4",
              selected ? "bg-brand-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", selected ? "bg-white/20" : "bg-slate-100 text-slate-500")}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function formatVehicleType(type: string) {
  return titleCase(type.replace(/_/g, " "));
}
