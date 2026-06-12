"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FleetPilotLogoMark } from "@/components/brand/logo";
import { brand } from "@/lib/brand";
import { getPortalTitle, getDashboardHomePath } from "@/lib/portal";
import { listDashboardChatConversations, getComplaintStats, listMobileNotifications } from "@/lib/resources";
import { prefetchDashboardRoute } from "@/lib/nav-prefetch";
import { useNavLoading } from "@/hooks/use-nav-loading";

interface NavItem {
  label: string;
  href: string;
  permission?: string;
  excludeRoles?: UserRole[];
  roles?: UserRole[];
  icon: () => React.ReactNode;
}

const parentNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: NavIconGrid },
  { label: "My children", href: "/dashboard/my-children", icon: NavIconStudents },
  { label: "Messages", href: "/dashboard/messages", icon: NavIconMessages },
  { label: "Alerts", href: "/dashboard/alerts", icon: NavIconAlerts },
  { label: "Complaints", href: "/dashboard/complaints", icon: NavIconComplaints },
  { label: "Profile", href: "/dashboard/profile", icon: NavIconProfile },
];

const driverNav: NavItem[] = [
  { label: "Today's runs", href: "/dashboard/today", icon: NavIconToday },
  { label: "My schedule", href: "/dashboard/my-schedule", icon: NavIconSchedule },
  { label: "Messages", href: "/dashboard/messages", icon: NavIconMessages },
  { label: "Alerts", href: "/dashboard/alerts", icon: NavIconAlerts },
  { label: "Complaints", href: "/dashboard/complaints", icon: NavIconComplaints },
  { label: "Students", href: "/dashboard/students", permission: "students.view", icon: NavIconStudents },
  { label: "Profile", href: "/dashboard/profile", icon: NavIconProfile },
];

const schoolNav: NavItem[] = [
  { label: "My school", href: "/dashboard/my-school", icon: NavIconSchool },
  { label: "Today's runs", href: "/dashboard/dispatch", permission: "routes.view", icon: NavIconDispatch },
  { label: "Live radar", href: "/dashboard/radar", permission: "vehicles.view", icon: NavIconRadar },
  { label: "Students", href: "/dashboard/students", permission: "students.view", icon: NavIconStudents },
  { label: "Parents", href: "/dashboard/parents", permission: "students.view", icon: NavIconParent },
  { label: "Drivers", href: "/dashboard/drivers", permission: "drivers.view", icon: NavIconDriver },
  { label: "Routes", href: "/dashboard/routes", permission: "routes.view", icon: NavIconRoute },
  { label: "Messages", href: "/dashboard/messages", roles: ["school_contact"], icon: NavIconMessages },
  { label: "Complaints", href: "/dashboard/complaints", roles: ["school_contact"], icon: NavIconComplaints },
  { label: "Profile", href: "/dashboard/profile", roles: ["school_contact"], icon: NavIconProfile },
];

const portalSupportNav: NavItem[] = [
  { label: "Support", href: "/dashboard/support", icon: NavIconSupport },
];

const platformNav: NavItem[] = [
  { label: "Platform overview", href: "/dashboard", icon: NavIconGrid },
  { label: "Organizations", href: "/dashboard/organizations", icon: NavIconBuilding },
  { label: "Contact leads", href: "/dashboard/contact-leads", icon: NavIconMail },
  { label: "All users", href: "/dashboard/users", icon: NavIconUsers },
];

const operationsNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: NavIconGrid, excludeRoles: ["parent"] },
  { label: "Dispatch", href: "/dashboard/dispatch", permission: "routes.view", icon: NavIconDispatch },
  { label: "Live radar", href: "/dashboard/radar", permission: "vehicles.view", icon: NavIconRadar },
];

const supportNav: NavItem[] = [
  { label: "Complaint center", href: "/dashboard/complaints", permission: "complaints.view", icon: NavIconComplaints },
  { label: "Messages", href: "/dashboard/messages", roles: ["admin", "dispatcher", "school_contact"], icon: NavIconMessages },
];

const fleetNav: NavItem[] = [
  {
    label: "Students",
    href: "/dashboard/students",
    permission: "students.view",
    excludeRoles: ["parent"],
    icon: NavIconStudents,
  },
  {
    label: "Parents",
    href: "/dashboard/parents",
    permission: "students.view",
    excludeRoles: ["parent"],
    icon: NavIconParent,
  },
  { label: "Drivers", href: "/dashboard/drivers", permission: "drivers.view", icon: NavIconDriver },
  { label: "Vehicles", href: "/dashboard/vehicles", permission: "vehicles.view", icon: NavIconBus },
  { label: "Schools", href: "/dashboard/schools", permission: "schools.view", icon: NavIconSchool },
  { label: "Routes", href: "/dashboard/routes", permission: "routes.view", icon: NavIconRoute },
];

const adminNav: NavItem[] = [
  { label: "Users & access", href: "/dashboard/users", permission: "users.view", icon: NavIconUsers },
  { label: "Roles & permissions", href: "/dashboard/roles", permission: "users.view", icon: NavIconShield },
];

function canSee(user: AuthUser, item: NavItem): boolean {
  if (user.role === "super_admin") return true;
  if (item.roles?.length && !item.roles.includes(user.role) && user.role !== "admin") return false;
  if (item.excludeRoles?.includes(user.role)) return false;
  if (!item.permission) return true;
  if (user.role === "admin") return true;
  return user.permissions.includes(item.permission);
}

function navItemsForUser(user: AuthUser): NavItem[] {
  if (user.role === "super_admin") return platformNav;
  if (user.role === "parent") return parentNav;
  if (user.role === "driver") return driverNav;
  if (user.role === "school_contact") return schoolNav;
  return [...operationsNav, ...fleetNav, ...supportNav, ...adminNav];
}

function NavSection({
  title,
  items,
  user,
  pathname,
  onNavigate,
  badges,
  onPrefetch,
  onNavStart,
}: {
  title?: string;
  items: NavItem[];
  user: AuthUser;
  pathname: string;
  onNavigate?: () => void;
  badges?: Record<string, number>;
  onPrefetch?: (href: string) => void;
  onNavStart?: () => void;
}) {
  const visible = items.filter((item) => canSee(user, item));
  if (!visible.length) return null;

  return (
    <div className="space-y-1">
      {title && (
        <p className="flex items-center gap-2 px-2 pb-1.5 pt-2 text-xs font-medium text-slate-400">
          {title}
          <span className="h-px flex-1 bg-slate-200/80" aria-hidden />
        </p>
      )}
      {visible.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onMouseEnter={() => onPrefetch?.(item.href)}
            onFocus={() => onPrefetch?.(item.href)}
            onClick={() => {
              if (!active) onNavStart?.();
              onNavigate?.();
            }}
            className={cn(
              "group relative flex items-center gap-2 overflow-hidden rounded-lg px-2 py-2 text-[13px] font-medium transition-colors duration-150",
              active
                ? "text-white shadow-md shadow-brand-primary/30"
                : "text-slate-600 hover:bg-brand-light/60 hover:text-brand-primary",
            )}
            style={
              active
                ? { background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)` }
                : undefined
            }
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                active
                  ? "bg-white/15 text-white"
                  : "text-slate-400 group-hover:scale-105 group-hover:text-brand-primary",
              )}
            >
              <Icon />
            </span>
            <span className="truncate">{item.label}</span>
            {badges?.[item.href] && badges[item.href] > 0 ? (
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-brand-primary text-white",
                )}
              >
                {badges[item.href] > 99 ? "99+" : badges[item.href]}
              </span>
            ) : active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function Brand({ role }: { role: UserRole }) {
  const roleLabel = getPortalTitle(role);
  const homeHref = getDashboardHomePath(role);

  return (
    <Link href={homeHref} className="fp-sidebar-brand group">
      <span className="fp-sidebar-brand-mark">
        <FleetPilotLogoMark size={22} />
      </span>
      <span className="fp-sidebar-brand-copy">
        <span className="fp-sidebar-brand-name">FleetPilot</span>
        <span className="fp-sidebar-brand-role">{roleLabel}</span>
      </span>
    </Link>
  );
}

function SidebarInner({
  user,
  pathname,
  onNavigate,
  hideBrand = false,
}: {
  user: AuthUser;
  pathname: string;
  onNavigate?: () => void;
  hideBrand?: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startNav } = useNavLoading();

  const warmRoute = (href: string) => {
    router.prefetch(href);
    void prefetchDashboardRoute(queryClient, href);
  };

  const isSuperAdmin = user.role === "super_admin";
  const isParent = user.role === "parent";
  const isDriver = user.role === "driver";
  const isSchool = user.role === "school_contact";
  const isPortalSubRole = isParent || isDriver || isSchool;

  useEffect(() => {
    const items = [
      ...navItemsForUser(user).filter((item) => canSee(user, item)),
      ...(isPortalSubRole ? portalSupportNav : []),
    ];
    items.forEach((item) => warmRoute(item.href));
  }, [user, isPortalSubRole]);

  const isPortalUser = isParent || isDriver;
  const canUseChat = ["admin", "dispatcher", "school_contact", "parent", "driver"].includes(user.role);
  const canSeeComplaints = user.role === "admin" || user.role === "dispatcher";
  const chatQuery = useQuery({
    queryKey: ["dashboard-chat-conversations"],
    queryFn: listDashboardChatConversations,
    enabled: canUseChat,
    refetchInterval: canUseChat ? 30_000 : false,
  });
  const portalAlertsQuery = useQuery({
    queryKey: ["mobile-notifications", "sidebar"],
    queryFn: () => listMobileNotifications(false),
    enabled: isPortalUser,
    refetchInterval: isPortalUser ? 30_000 : false,
  });
  const complaintsStatsQuery = useQuery({
    queryKey: ["complaint-stats"],
    queryFn: getComplaintStats,
    enabled: canSeeComplaints,
    refetchInterval: 30_000,
  });
  const navBadges = useMemo(
    () => ({
      "/dashboard/messages": chatQuery.data?.unread_total ?? 0,
      "/dashboard/alerts": portalAlertsQuery.data?.unread ?? 0,
      "/dashboard/complaints": complaintsStatsQuery.data?.open ?? 0,
    }),
    [chatQuery.data?.unread_total, portalAlertsQuery.data?.unread, complaintsStatsQuery.data?.open],
  );
  const portalBadges = isPortalUser || isSchool ? navBadges : undefined;
  const staffBadges = !isParent && !isDriver && !isSchool ? navBadges : undefined;
  const nav = isSuperAdmin ? (
    <NavSection title="Platform" items={platformNav} user={user} pathname={pathname} onNavigate={onNavigate} onPrefetch={warmRoute} onNavStart={startNav} />
  ) : isParent ? (
    <NavSection title="Parent portal" items={parentNav} user={user} pathname={pathname} onNavigate={onNavigate} badges={portalBadges} onPrefetch={warmRoute} onNavStart={startNav} />
  ) : isDriver ? (
    <NavSection title="Driver portal" items={driverNav} user={user} pathname={pathname} onNavigate={onNavigate} badges={portalBadges} onPrefetch={warmRoute} onNavStart={startNav} />
  ) : isSchool ? (
    <NavSection title="School portal" items={schoolNav} user={user} pathname={pathname} onNavigate={onNavigate} badges={portalBadges} onPrefetch={warmRoute} onNavStart={startNav} />
  ) : (
    <>
      <NavSection title="Operations" items={operationsNav} user={user} pathname={pathname} onNavigate={onNavigate} onPrefetch={warmRoute} onNavStart={startNav} />
      <NavSection title="Fleet & schools" items={fleetNav} user={user} pathname={pathname} onNavigate={onNavigate} onPrefetch={warmRoute} onNavStart={startNav} />
      <NavSection
        title="Support"
        items={supportNav}
        user={user}
        pathname={pathname}
        onNavigate={onNavigate}
        badges={staffBadges}
        onPrefetch={warmRoute}
        onNavStart={startNav}
      />
      <NavSection title="Administration" items={adminNav} user={user} pathname={pathname} onNavigate={onNavigate} onPrefetch={warmRoute} onNavStart={startNav} />
    </>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      {!hideBrand && (
        <div className="mb-2.5 shrink-0 border-b border-slate-100 pb-2.5">
          <Brand role={user.role} />
        </div>
      )}
      <nav className="fp-sidebar-scroll -mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-2">{nav}</nav>
      {isPortalSubRole ? (
        <div className="mt-auto shrink-0 border-t border-slate-100 bg-white pt-2">
          <NavSection
            items={portalSupportNav}
            user={user}
            pathname={pathname}
            onNavigate={onNavigate}
            onPrefetch={warmRoute}
            onNavStart={startNav}
          />
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({
  user,
  open,
  onClose,
}: {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-60 flex flex-col overflow-hidden border-r border-slate-200/70 bg-white px-3 py-3 md:flex">
        <SidebarInner user={user} pathname={pathname} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <aside className="absolute left-0 top-0 flex h-full w-[17.5rem] flex-col border-r border-slate-200 bg-white px-3 py-4 shadow-2xl">
            <div className="mb-2.5 flex shrink-0 items-center justify-between border-b border-slate-100 pb-2.5">
              <Brand role={user.role} />
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SidebarInner user={user} pathname={pathname} onNavigate={onClose} hideBrand />
          </aside>
        </div>
      )}
    </>
  );
}

function NavIconParent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="5.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10.5" cy="5.5" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 13c0-2.21 1.79-4 3.5-4M8 13c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function NavIconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function NavIconStudents() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function NavIconDriver() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 13v-1.5a4 4 0 018 0V13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function NavIconBus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 4h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 10h10M5 13v1M11 13v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function NavIconSchool() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2L2 5.5 8 9l6-3.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 7v3.5L8 13l4-2.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function NavIconRoute() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 12c0-2 2-4 5-4s5 2 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function NavIconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 13c0-2.21 1.79-4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 13c0-1.657 1.12-3 2.5-3s2.5 1.343 2.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function NavIconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2l5 2v4c0 3.314-2.239 5.5-5 6.5-2.761-1-5-3.186-5-6.5V4l5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function NavIconBuilding() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 13V5l5-3 5 3v8H3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8h1M9 8h1M6 10.5h1M9 10.5h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function NavIconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 4.5L8 9l5.5-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function NavIconRadar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 8V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 8l3.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}
function NavIconDispatch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6h12M5 9h2M9 9h2M5 11.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function NavIconSchedule() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="3" width="11" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 2v2M11 2v2M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="5" y="8.5" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="9" y="8.5" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}
function NavIconMessages() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 4.5h11a1 1 0 011 1v5a1 1 0 01-1 1H5l-2.5 2v-2.5a1 1 0 01-1-1v-4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function NavIconComplaints() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5l5 2v4.5c0 2.8-1.9 4.7-5 5.5-3.1-.8-5-2.7-5-5.5V4.5l5-2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function NavIconAlerts() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5a3 3 0 00-3 3v1.5c0 .4-.2.8-.4 1.1L3.5 10.2A1 1 0 004.4 11.5h7.2a1 1 0 00.9-1.3l-1.1-2.1a1.5 1.5 0 01-.4-1.1V5.5a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 12a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function NavIconSupport() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5v.5M8 8v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function NavIconProfile() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.5 13c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function NavIconToday() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
