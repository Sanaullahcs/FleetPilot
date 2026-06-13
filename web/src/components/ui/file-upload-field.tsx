"use client";

import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

export function FileUploadField({
  label,
  hint,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  hint?: string;
  accept?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
        {required ? " *" : ""}
        {hint ? <span className="ml-1 font-normal normal-case text-slate-400">({hint})</span> : null}
      </label>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-dashed p-3 transition sm:flex-row sm:items-center sm:justify-between",
          error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50/60 hover:border-brand-primary/40",
        )}
      >
        <div className="min-w-0">
          {value ? (
            <>
              <p className="truncate text-sm font-medium text-slate-900">{value.name}</p>
              <p className="text-xs text-slate-500">{(value.size / 1024).toFixed(0)} KB · PDF or image</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Upload a clear scan or photo (PDF, JPG, PNG — max 10 MB)</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {value && (
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Replace" : "Choose file"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          onChange(file);
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
