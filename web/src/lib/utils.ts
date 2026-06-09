export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  maintenance: "bg-amber-50 text-amber-700 ring-amber-600/20",
  out_of_service: "bg-red-50 text-red-700 ring-red-600/20",
  retired: "bg-slate-100 text-slate-500 ring-slate-500/20",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-600/20",
  terminated: "bg-red-50 text-red-700 ring-red-600/20",
  graduated: "bg-brand-light text-brand-primary ring-brand-primary/20",
  transferred: "bg-blue-50 text-blue-700 ring-blue-600/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function statusBadgeClass(status: string): string {
  return statusStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
