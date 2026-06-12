"use client";

import { cn } from "@/lib/utils";
import { Button, SearchInput } from "@/components/ui/primitives";
import { SearchableSelect } from "@/components/ui/dropdown-menu";

export interface FilterOption {
  label: string;
  value: string;
  sublabel?: string;
}

export interface FilterField {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  onClear?: () => void;
  resultCount?: number;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = [],
  onClear,
  resultCount,
}: FilterBarProps) {
  const hasActiveFilters = search || filters.some((f) => f.value);

  return (
    <div className="fp-card p-4">
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          filters.length > 0 && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
        )}
      >
        <div className={cn("min-w-0", filters.length > 0 && "sm:col-span-2 xl:col-span-2")}>
          <label className="fp-label mb-1.5 block">
            Search
          </label>
          <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />
        </div>

        {filters.map((f) => (
          <div key={f.key} className="min-w-0">
            <label className="fp-label mb-1.5 block">
              {f.label}
            </label>
            <SearchableSelect
              value={f.value}
              onChange={f.onChange}
              options={f.options}
              allLabel="All"
              searchPlaceholder={`Search ${f.label.toLowerCase()}…`}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        {resultCount !== undefined && (
          <span className="text-xs font-medium text-brand-accent">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </span>
        )}
        {hasActiveFilters && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function ActiveFilterPills({
  items,
  onRemove,
}: {
  items: { key: string; label: string }[];
  onRemove: (key: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onRemove(item.key)}
          className="inline-flex items-center gap-1 rounded-full bg-brand-accent-light px-3 py-1 text-xs font-semibold text-brand-accent-dark transition hover:bg-brand-accent/20"
        >
          {item.label}
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  );
}
