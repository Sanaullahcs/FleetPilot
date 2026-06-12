"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function DotsIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" className={className} aria-hidden>
      <circle cx="9" cy="3.5" r="1.5" />
      <circle cx="9" cy="9" r="1.5" />
      <circle cx="9" cy="14.5" r="1.5" />
    </svg>
  );
}

export interface DropdownMenuItemDef {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  hidden?: boolean;
  icon?: React.ReactNode;
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  width = 200,
  ariaLabel = "Open menu",
}: {
  trigger?: React.ReactNode;
  items: DropdownMenuItemDef[];
  align?: "start" | "end";
  width?: number;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const visible = items.filter((i) => !i.hidden);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = align === "end" ? rect.right - width : rect.left;
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(left, window.innerWidth - width - 8)),
    });
  }, [align, width]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, updatePosition]);

  if (!visible.length) return null;

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            className="fp-dropdown-panel animate-dropdown-in"
            style={{ top: pos.top, left: pos.left, width, minWidth: width }}
          >
            {visible.map((item, index) => {
              const prev = visible[index - 1];
              const showDivider =
                item.variant === "danger" && prev && prev.variant !== "danger";
              return (
                <div key={item.label}>
                  {showDivider && <div className="my-1 border-t border-slate-100" role="separator" />}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      item.onClick();
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition",
                      item.variant === "danger" && "text-red-600 hover:bg-red-50",
                      item.variant === "warning" && "text-amber-700 hover:bg-amber-50",
                      (!item.variant || item.variant === "default") && "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition",
          "hover:bg-slate-100 hover:text-slate-800",
          open && "bg-slate-100 text-slate-800",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40",
        )}
      >
        {trigger ?? <DotsIcon />}
      </button>
      {panel}
    </>
  );
}

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
  meta?: string;
  searchText?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  allLabel = "All",
  showAllOption = true,
  disabled = false,
  className,
  emptyMessage = "No options available",
  searchable = true,
  unresolvedLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  allLabel?: string;
  showAllOption?: boolean;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
  searchable?: boolean;
  unresolvedLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const display =
    selected?.label ??
    (value ? (unresolvedLabel ?? placeholder) : showAllOption ? allLabel : placeholder);

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [o.label, o.sublabel, o.meta, o.searchText].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    updatePosition();
    const t = window.setTimeout(() => searchRef.current?.focus(), 50);
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, updatePosition]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="fp-dropdown-panel animate-dropdown-in overflow-hidden p-0"
            style={{ top: pos.top, left: pos.left, width: Math.max(pos.width, 220) }}
          >
            <div className={cn("border-b border-slate-100 p-2", !searchable && "hidden")}>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18.5 18.5l-4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20"
                />
              </div>
            </div>
            <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1.5 fp-dropdown-scroll">
              {showAllOption && !query && (
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === ""}
                    onClick={() => pick("")}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition",
                      value === ""
                        ? "bg-brand-accent-light font-semibold text-brand-accent-dark"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {allLabel}
                    {value === "" && <CheckIcon />}
                  </button>
                </li>
              )}
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-400">
                  {options.length === 0 ? emptyMessage : "No matches found"}
                </li>
              ) : (
                filtered.map((o) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === o.value}
                      onClick={() => pick(o.value)}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition",
                        value === o.value
                          ? "bg-brand-accent-light text-brand-accent-dark"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm", value === o.value ? "font-semibold" : "font-medium")}>
                          {o.label}
                        </span>
                        {o.sublabel && (
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{o.sublabel}</span>
                        )}
                        {o.meta && (
                          <span className="mt-0.5 block truncate text-xs text-slate-400">{o.meta}</span>
                        )}
                      </span>
                      {value === o.value && <CheckIcon />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "fp-select-trigger",
          open && "fp-select-trigger-open",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span className={cn("truncate", !selected && !value && showAllOption && "text-slate-500", !selected && value && "text-slate-500")}>
          {display}
        </span>
        <ChevronIcon open={open} />
      </button>
      {panel}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("shrink-0 text-slate-400 transition duration-200", open && "rotate-180 text-brand-accent")}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-brand-accent" aria-hidden>
      <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
