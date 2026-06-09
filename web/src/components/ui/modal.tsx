"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizes;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop — full-screen blur */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md backdrop-saturate-150 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/10",
          "rounded-t-2xl sm:rounded-2xl animate-modal-in",
          sizes[size],
        )}
      >
        <div className="shrink-0 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-brand-accent-light/50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-white shadow-md shadow-brand-accent/30">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 6h6M7 10h6M7 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="modal-title" className="text-xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white/90 p-2 text-slate-400 shadow-sm transition hover:bg-white hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
              aria-label="Close dialog"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white px-6 py-5 fp-dropdown-scroll">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50/95 px-6 py-4 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ModalFooter({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel,
  submitForm,
  pending,
  disabled,
}: {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: string;
  submitForm?: string;
  pending?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={submitForm}
        disabled={pending || disabled}
        className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-primary/25 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

export function ModalCloseFooter({ onClose, label = "Close" }: { onClose: () => void; label?: string }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {label}
      </button>
    </div>
  );
}
