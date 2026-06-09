"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { RichPickerOption } from "@/lib/assignment-picker-store";

export function RichSelectList({
  options,
  value,
  onChange,
  emptyLabel = "— None —",
  searchPlaceholder = "Search…",
  allowEmpty = true,
}: {
  options: RichPickerOption[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  searchPlaceholder?: string;
  allowEmpty?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = [o.label, o.sublabel, o.meta, o.searchText].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const items: Array<{ id: string; option: RichPickerOption | null }> = [
    ...(allowEmpty ? [{ id: "", option: null as RichPickerOption | null }] : []),
    ...filtered.map((o) => ({ id: o.id, option: o })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-2.5">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18.5 18.5l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
      </div>

      <ul role="listbox" className="max-h-64 overflow-y-auto py-1.5 fp-dropdown-scroll">
        {items.length === 1 && query ? (
          <li className="px-3 py-8 text-center text-sm text-slate-400">No matches found</li>
        ) : (
          items.map(({ id, option }) => {
            const selected = value === id;
            return (
              <li key={id || "__none__"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition",
                    selected ? "bg-brand-accent-light" : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition",
                      selected ? "border-brand-primary bg-brand-primary" : "border-slate-300 bg-white",
                    )}
                  >
                    {selected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    {option ? (
                      <>
                        <span className={cn("block text-sm font-semibold", selected ? "text-brand-accent-dark" : "text-slate-900")}>
                          {option.label}
                        </span>
                        {option.sublabel && (
                          <span className="mt-0.5 block text-xs text-slate-500">{option.sublabel}</span>
                        )}
                        {option.meta && (
                          <span className="mt-0.5 block truncate text-xs text-slate-400">{option.meta}</span>
                        )}
                      </>
                    ) : (
                      <span className={cn("block text-sm font-medium", selected ? "text-brand-accent-dark" : "text-slate-600")}>
                        {emptyLabel}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
