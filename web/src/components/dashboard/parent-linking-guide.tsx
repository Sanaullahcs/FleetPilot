"use client";

import { useState } from "react";
import Link from "next/link";
import { usePermission } from "@/hooks/use-permission";

export function ParentLinkingGuide() {
  const can = usePermission();
  const [open, setOpen] = useState(true);

  if (!can("students.update")) return null;

  return (
    <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-brand-secondary">
          How to assign students to a parent
        </span>
        <span className="text-xs font-medium text-brand-primary">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ol className="list-decimal space-y-2 border-t border-brand-primary/10 px-4 py-3 pl-8 text-sm text-slate-600">
          <li>
            Create or approve a user with the <strong>Parent</strong> role under{" "}
            <Link href="/dashboard/users" className="font-medium text-brand-primary hover:underline">
              Users &amp; access
            </Link>
            .
          </li>
          <li>
            Open <strong>Students</strong> or <strong>Parents</strong>, use <strong>Manage parents</strong> or{" "}
            <strong>Assign students</strong> from the row menu.
          </li>
          <li>Select the parent account, set relationship (mother, father, guardian, etc.), and click{" "}
            <strong>Link parent</strong>.
          </li>
          <li>
            The parent signs in and sees only linked children on <strong>My children</strong>, including live bus
            tracking.
          </li>
        </ol>
      )}
    </div>
  );
}
