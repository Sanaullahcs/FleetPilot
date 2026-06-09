"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { logout as logoutApi } from "@/lib/auth-api";
import { confirmLogout, toastSuccess } from "@/lib/alerts";
import { getPageHeaderTitle, getRoleLabel } from "@/lib/portal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AssignmentPickerHost } from "@/components/dashboard/assignment-picker-host";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NavProgress } from "@/components/ui/nav-progress";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const clear = useAuthStore((s) => s.clear);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const headerTitle = user ? getPageHeaderTitle(pathname, user.role) : "FleetPilot";

  useEffect(() => {
    document.title = `FleetPilot — ${headerTitle}`;
  }, [headerTitle]);

  useEffect(() => {
    if (!user || user.role !== "parent") return;
    const blocked =
      pathname === "/dashboard" ||
      pathname === "/dashboard/students" ||
      pathname.startsWith("/dashboard/parents") ||
      pathname.startsWith("/dashboard/dispatch") ||
      pathname.startsWith("/dashboard/radar") ||
      pathname.startsWith("/dashboard/drivers") ||
      pathname.startsWith("/dashboard/vehicles") ||
      pathname.startsWith("/dashboard/schools") ||
      pathname.startsWith("/dashboard/routes") ||
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/roles");
    if (blocked) {
      router.replace("/dashboard/my-children");
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    const ok = await confirmLogout();
    if (!ok) return;
    await logoutApi();
    clear();
    toastSuccess("Signed out", "See you next time.");
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  const isHome = pathname === "/dashboard";
  const isRadar = pathname === "/dashboard/radar";
  const showNotifications = user.role !== "super_admin";

  return (
    <div className={cn("min-h-screen bg-[#f8f9fc]", isRadar && "h-dvh overflow-hidden")}>
      <Sidebar user={user} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div
        className={cn(
          "flex min-w-0 flex-col",
          isRadar ? "fixed inset-y-0 right-0 z-10 md:left-64" : "min-h-screen md:ml-64",
        )}
      >
        {!isRadar && (
          <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <NavProgress />
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
                  aria-label="Open menu"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{headerTitle}</h1>
                  {isHome && (
                    <p className="truncate text-xs text-slate-500">
                      {getRoleLabel(user.role)}
                      {user.organization ? ` · ${user.organization.name}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {showNotifications && <NotificationBell userId={user.id} />}
                <UserMenu user={user} onLogout={handleLogout} />
              </div>
            </div>
          </header>
        )}

        {isRadar && (
          <div className="absolute right-3 top-3 z-[800] flex items-center gap-2 sm:right-4 sm:top-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-lg ring-1 ring-slate-200/80 md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {showNotifications && (
              <div className="rounded-xl bg-white/95 p-0.5 shadow-lg ring-1 ring-slate-200/80">
                <NotificationBell userId={user.id} />
              </div>
            )}
            <div className="rounded-xl bg-white/95 shadow-lg ring-1 ring-slate-200/80">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <main
          className={cn(
            "min-w-0 flex-1",
            isRadar ? "h-dvh overflow-hidden" : "overflow-x-hidden p-4 sm:p-6",
          )}
        >
          {children}
        </main>
      </div>
      <AssignmentPickerHost />
    </div>
  );
}
