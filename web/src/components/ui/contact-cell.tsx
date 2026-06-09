"use client";

import { cn } from "@/lib/utils";

export function ContactCell({
  phone,
  email,
  className,
}: {
  phone?: string | null;
  email?: string | null;
  className?: string;
}) {
  if (!phone && !email) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {phone && (
        <a href={`tel:${phone.replace(/\D/g, "")}`} className="block text-sm text-slate-800 hover:text-brand-primary">
          {phone}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className="block truncate text-xs text-slate-500 hover:text-brand-primary">
          {email}
        </a>
      )}
    </div>
  );
}
