"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/lib/portal";
import { FleetPilotLogo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";
import { listDashboardChatConversations } from "@/lib/resources";

interface NavItem {
  label: string;
  href: string;
  permission?: string;
  excludeRoles?: UserRole[];
  roles?: UserRole[];
  icon: () => React.ReactNode;
}

const parentNav: NavItem[] = [
  { label: "My children", href: "/dashboard/my-children", icon: NavIconStudents },
];

const driverNav: NavItem[] = [
  { label: "My schedule", href: "/dashboard/my-schedule", icon: NavIconSchedule },
  { label: "Students", href: "/dashboard/students", permission: "students.view", icon: NavIconStudents },
];

const platformNav: NavItem[] = [
  { label: "Platform overview", href: "/dashboard", icon: NavIconGrid },
  { label: "Organizations", href: "/dashboard/organizations", icon: NavIconBuilding },
  { label: "All users", href: "/dashboard/users", icon: NavIconUsers },
];

const operationsNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: NavIconGrid, excludeRoles: ["parent"] },
  { label: "Dispatch", href: "/dashboard/dispatch", permission: "routes.view", icon: NavIconDispatch },
  { label: "Messages", href: "/dashboard/messages", roles: ["admin", "dispatcher", "school_contact"], icon: NavIconMessages },
  { label: "Live radar", href: "/dashboard/radar", permission: "vehicles.view", icon: NavIconRadar },
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

function NavSection({
  title,
  items,
  user,
  pathname,
  onNavigate,
  badges,
}: {
  title?: string;
  items: NavItem[];
  user: AuthUser;
  pathname: string;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}) {
  const visible = items.filter((item) => canSee(user, item));
  if (!visible.length) return null;

  return (
    <div className="space-y-0.5">
      {title && (
        <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {title}
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
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/5"
                : "text-slate-600 hover:bg-slate-100/90 hover:text-brand-secondary",
            )}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
                style={{ background: brand.primary }}
              />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                active
                  ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/25"
                  : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-brand-primary",
              )}
            >
              <Icon />
            </span>
            <span className="truncate">{item.label}</span>
            {badges?.[item.href] && badges[item.href] > 0 ? (
              <span className="ml-auto rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
                {badges[item.href] > 99 ? "99+" : badges[item.href]}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function Brand() {
  return (
    <FleetPilotLogo href="/dashboard" subtitle="Transportation ops" size={48} />
  );
}

function SidebarFooter({ orgLabel, roleLabel, isSuperAdmin }: { orgLabel: string; roleLabel: string; isSuperAdmin: boolean }) {
  return (
    <div
      className="shrink-0 rounded-2xl border border-slate-200/80 p-3.5"
      style={{ background: `linear-gradient(135deg, ${brand.primaryLight}80, white)` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ background: brand.primary }}
        >
          {orgLabel.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-secondary">{orgLabel}</p>
          {!isSuperAdmin && (
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary/70">{roleLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarInner({
  user,
  pathname,
  onNavigate,
}: {
  user: AuthUser;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isSuperAdmin = user.role === "super_admin";
  const isParent = user.role === "parent";
  const isDriver = user.role === "driver";
  const canUseChat = ["admin", "dispatcher", "school_contact"].includes(user.role);
  const chatQuery = useQuery({
    queryKey: ["dashboard-chat-conversations"],
    queryFn: listDashboardChatConversations,
    enabled: canUseChat,
    refetchInterval: canUseChat ? 8_000 : false,
  });
  const navBadges = useMemo(
    () => ({
      "/dashboard/messages": chatQuery.data?.unread_total ?? 0,
    }),
    [chatQuery.data?.unread_total],
  );
  const nav = isSuperAdmin ? (
    <NavSection title="Platform" items={platformNav} user={user} pathname={pathname} onNavigate={onNavigate} />
  ) : isParent ? (
    <NavSection items={parentNav} user={user} pathname={pathname} onNavigate={onNavigate} />
  ) : isDriver ? (
    <NavSection items={driverNav} user={user} pathname={pathname} onNavigate={onNavigate} />
  ) : (
    <>
      <NavSection
        items={operationsNav}
        user={user}
        pathname={pathname}
        onNavigate={onNavigate}
        badges={navBadges}
      />
      <NavSection title="Administration" items={adminNav} user={user} pathname={pathname} onNavigate={onNavigate} />
    </>
  );

  const orgLabel = isSuperAdmin ? "FleetPilot Platform" : (user.organization?.name ?? "FleetPilot");
  const roleLabel = getRoleLabel(user.role);

  return (
    <>
      <div className="mb-6 shrink-0 border-b border-slate-100 pb-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">{nav}</nav>
      <div className="mt-4 shrink-0">
        <SidebarFooter orgLabel={orgLabel} roleLabel={roleLabel} isSuperAdmin={isSuperAdmin} />
      </div>
    </>
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-slate-200/80 bg-white/95 p-4 shadow-[4px_0_24px_-12px_rgba(79,91,169,0.08)] backdrop-blur-xl md:flex">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
          style={{
            background: `radial-gradient(ellipse at 0% 0%, ${brand.primaryLight} 0%, transparent 70%)`,
          }}
        />
        <div className="relative flex h-full flex-col">
          <SidebarInner user={user} pathname={pathname} />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
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
            <div className="flex flex-1 flex-col overflow-hidden">
              <SidebarInner user={user} pathname={pathname} onNavigate={onClose} />
            </div>
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
