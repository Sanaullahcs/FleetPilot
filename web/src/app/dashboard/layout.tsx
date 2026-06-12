"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuthStore } from "@/store/auth";
import { logout as logoutApi } from "@/lib/auth-api";
import { confirmLogout, toastSuccess } from "@/lib/alerts";
import { getPageHeaderTitle, isSchoolPortalPath } from "@/lib/portal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { AssignmentPickerHost } from "@/components/dashboard/assignment-picker-host";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { UserMenu } from "@/components/dashboard/user-menu";
import { PageTransition } from "@/components/ui/nav-progress";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useRequireAuth();
  const clear = useAuthStore((s) => s.clear);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const headerTitle = user ? getPageHeaderTitle(pathname) : "FleetPilot";

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
      pathname.startsWith("/dashboard/roles") ||
      pathname.startsWith("/dashboard/my-schedule");
    if (blocked) {
      router.replace("/dashboard/my-children");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user || user.role !== "driver") return;
    const blocked =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/parents") ||
      pathname.startsWith("/dashboard/dispatch") ||
      pathname.startsWith("/dashboard/radar") ||
      pathname.startsWith("/dashboard/drivers") ||
      pathname.startsWith("/dashboard/vehicles") ||
      pathname.startsWith("/dashboard/schools") ||
      pathname.startsWith("/dashboard/routes") ||
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/roles") ||
      pathname.startsWith("/dashboard/my-children") ||
      pathname.startsWith("/dashboard/my-school") ||
      pathname.startsWith("/dashboard/organizations");
    if (blocked) {
      router.replace("/dashboard/my-schedule");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user || user.role !== "school_contact") return;
    if (!isSchoolPortalPath(pathname)) {
      router.replace("/dashboard/my-school");
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

  const isRadar = pathname === "/dashboard/radar";
  const showNotifications = user.role !== "super_admin";

  return (
    <div className={cn("min-h-screen bg-[#f8f9fc]", isRadar && "h-dvh overflow-hidden")}>
      <Sidebar user={user} open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div
        className={cn(
          "flex min-w-0 flex-col",
          isRadar ? "fixed inset-y-0 right-0 z-10 md:left-60" : "min-h-screen md:ml-60",
        )}
      >
        {!isRadar && (
          <DashboardTopBar
            title={headerTitle}
            onMenuOpen={() => setDrawerOpen(true)}
            showNotifications={showNotifications}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {isRadar && (
          <div className="pointer-events-none absolute right-3 top-3 z-[800] flex items-center gap-3 sm:right-5 sm:top-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 text-slate-700 shadow-lg md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {showNotifications && (
              <div className="pointer-events-auto shrink-0 pr-0.5">
                <NotificationBell userId={user.id} />
              </div>
            )}
            <div className="pointer-events-auto shrink-0">
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <main
          className={cn(
            "min-w-0 flex-1",
            isRadar
              ? "h-dvh overflow-hidden"
              : "mx-auto w-full max-w-[1680px] overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 lg:px-6",
          )}
        >
          {isRadar ? children : <PageTransition>{children}</PageTransition>}
        </main>
      </div>
      <AssignmentPickerHost />
    </div>
  );
}
