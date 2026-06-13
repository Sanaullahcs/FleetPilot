"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { getDashboardHomePath } from "@/lib/portal";

/** Auth-aware header actions: dashboard shortcut when signed in, sign-in/get-started otherwise. */
export function NavAuthCta() {
  const { token, user, hydrated } = useAuthStore();
  const signedIn = hydrated && !!token && !!user;

  if (signedIn) {
    return (
      <Link href={getDashboardHomePath(user?.role)} className="fp-mkt-btn-primary group">
        Open dashboard
        <ArrowIcon />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-brand-primary sm:block"
      >
        Sign In
      </Link>
      <Link href="/signup" className="fp-mkt-btn-primary group">
        Get started
        <ArrowIcon />
      </Link>
    </div>
  );
}

export function HeroAuthCta() {
  const { token, user, hydrated } = useAuthStore();
  const signedIn = hydrated && !!token && !!user;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={signedIn ? getDashboardHomePath(user?.role) : "/signup"}
        className="fp-mkt-btn-primary group !px-7 !py-3.5 !text-[15px]"
      >
        {signedIn ? "Open your dashboard" : "Start free pilot"}
        <ArrowIcon />
      </Link>
      <a href="#features" className="fp-mkt-btn-ghost">
        Explore the platform
      </a>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
