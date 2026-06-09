"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AuthUser } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className={cn("shrink-0 text-slate-400 transition", open && "rotate-180 text-brand-accent")}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserMenu({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const width = 260;
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    });
  }, []);

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

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            className="fp-dropdown-panel animate-dropdown-in overflow-hidden p-0"
            style={{ top: pos.top, left: pos.left, width, minWidth: width }}
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-brand-primary/8 via-brand-accent/5 to-transparent px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-sm font-bold text-white shadow-sm shadow-brand-accent/30">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{user.full_name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-brand-accent-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-accent-dark">
                    {titleCase(user.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="py-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/profile");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <UserIcon />
                My profile
              </button>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                Dashboard
              </Link>
            </div>

            <div className="border-t border-slate-100 py-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogoutIcon />
                Sign out
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-transparent py-1 pl-1 pr-2 transition",
          "hover:border-slate-200 hover:bg-slate-50",
          open && "border-slate-200 bg-slate-50",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40",
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent-light text-sm font-semibold text-brand-accent-dark ring-2 ring-brand-accent/20">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[120px] truncate text-sm font-medium text-slate-900 lg:max-w-[160px]">
            {user.first_name}
          </p>
          <p className="text-[11px] capitalize text-slate-500">{user.role.replace(/_/g, " ")}</p>
        </div>
        <ChevronDown open={open} />
      </button>
      {panel}
    </>
  );
}
