"use client";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NavProgress } from "@/components/ui/nav-progress";
import type { AuthUser } from "@/lib/types";

export function DashboardTopBar({
  title,
  onMenuOpen,
  showNotifications,
  user,
  onLogout,
}: {
  title: string;
  onMenuOpen: () => void;
  showNotifications: boolean;
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/70 bg-[#f8f9fc]/95 backdrop-blur-sm">
      <div className="relative mx-auto w-full max-w-[1680px] px-4 sm:px-5 lg:px-6">
        <NavProgress />
        <div className="flex min-h-[52px] items-center gap-3 py-1.5 sm:gap-4">
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-brand-primary md:hidden"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showNotifications ? (
              <>
                <div className="shrink-0 pr-0.5">
                  <NotificationBell userId={user.id} role={user.role} />
                </div>
                <span className="hidden h-7 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
              </>
            ) : null}
            <div className="shrink-0">
              <UserMenu user={user} onLogout={onLogout} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
