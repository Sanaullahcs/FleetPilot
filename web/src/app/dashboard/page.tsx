"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import {
  getDashboardAnalytics,
  getDashboardStats,
  listSchools,
  type DashboardFilters,
} from "@/lib/resources";
import { PageHeader, Button } from "@/components/ui/primitives";
import { ParentPortalHome } from "@/components/dashboard/parent-portal-home";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import {
  StudentsIcon,
  DriverIcon,
  VehicleIcon,
  SchoolIcon,
  RouteIcon,
  DispatchIcon,
  UserIcon,
  ShieldIcon,
  OrgIcon,
  CrownIcon,
} from "@/components/dashboard/stat-icons";
import { DashboardChartsSkeleton, DashboardStatsSkeleton } from "@/components/ui/skeleton";
import {
  FleetBarChart,
  RoutesByTypeChart,
} from "@/components/dashboard/charts";
import { FleetInsightsPanel } from "@/components/dashboard/fleet-insights-panel";
import {
  DashboardAnalyticsFilterBar,
  DashboardRefreshingSection,
} from "@/components/dashboard/dashboard-analytics-filter-bar";
import { QuickActionTile, QuickActionsPanel } from "@/components/dashboard/quick-action-tile";
import { DismissibleSection } from "@/components/dashboard/dismissible-section";
import { useDashboardDismiss } from "@/hooks/use-dashboard-dismiss";
import { brand } from "@/lib/brand";
import { getDashboardWelcome } from "@/lib/portal";
import type { UserRole } from "@/lib/types";

const OPS_ROLES: UserRole[] = ["admin", "dispatcher"];

const DEFAULT_FILTERS: DashboardFilters = { period: "all" };

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isParent = user?.role === "parent";
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isDispatcher = user?.role === "dispatcher";
  const isOpsViewer = user?.role ? OPS_ROLES.includes(user.role) : false;
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", filters],
    queryFn: () => getDashboardStats(filters),
    placeholderData: keepPreviousData,
  });

  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics", filters],
    queryFn: () => getDashboardAnalytics(filters),
    placeholderData: keepPreviousData,
  });

  const schoolsQuery = useQuery({
    queryKey: ["schools", "filter-options"],
    queryFn: () => listSchools({ per_page: 100 }),
    enabled: !isSuperAdmin,
  });

  const schoolOptions = (schoolsQuery.data?.data ?? []).map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const patchFilters = (patch: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    (filters.period && filters.period !== "all") ||
    Boolean(filters.school_id) ||
    Boolean(filters.route_type) ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const userId = user?.id ?? "anonymous";
  const adminBanner = useDashboardDismiss(userId, "admin-banner");
  const insightsPanel = useDashboardDismiss(userId, "insights-panel");
  const quickActions = useDashboardDismiss(userId, "quick-actions");

  const anyDismissed =
    adminBanner.ready &&
    (adminBanner.dismissed ||
      insightsPanel.dismissed ||
      quickActions.dismissed);

  const data = statsQuery.data;
  const analytics = analyticsQuery.data;

  const cards = [
    {
      label: "Students",
      value: data?.students?.total,
      hint: `${data?.students?.active ?? 0} active`,
      href: "/dashboard/students",
      accent: brand.primary,
      icon: <StudentsIcon />,
    },
    {
      label: "Drivers",
      value: data?.drivers?.total,
      hint: `${data?.drivers?.active ?? 0} active`,
      href: "/dashboard/drivers",
      accent: brand.cyan,
      icon: <DriverIcon />,
    },
    {
      label: "Vehicles",
      value: data?.vehicles?.total,
      hint: `${data?.vehicles?.active ?? 0} in service`,
      href: "/dashboard/vehicles",
      accent: brand.accent,
      icon: <VehicleIcon />,
    },
    {
      label: "Schools",
      value: data?.schools?.total,
      hint: "Served districts",
      href: "/dashboard/schools",
      accent: brand.orange,
      icon: <SchoolIcon />,
    },
    {
      label: "Routes",
      value: data?.routes?.total,
      hint: `${data?.routes?.active ?? 0} active`,
      href: "/dashboard/routes",
      accent: brand.primaryDark,
      icon: <RouteIcon />,
    },
    {
      label: "Runs",
      value: data?.runs?.total,
      hint: "Scheduled services",
      href: "/dashboard/routes",
      accent: brand.chart[5],
      icon: <DispatchIcon />,
    },
  ];

  const welcome = getDashboardWelcome(user?.role, user?.first_name ?? "");

  const adminExtraCards = isAdmin && data?.users
    ? [
        {
          label: "Active users",
          value: data.users.total,
          hint: "Staff with portal access",
          href: "/dashboard/users",
          accent: brand.chart[6],
          icon: <UserIcon />,
        },
        {
          label: "Fleet health",
          value:
            analytics?.operations_radar?.length
              ? `${Math.round(
                  analytics.operations_radar.reduce((s, d) => s + d.score, 0) /
                    analytics.operations_radar.length,
                )}%`
              : "—",
          hint: "Operations score",
          href: "/dashboard",
          accent: brand.cyan,
          icon: <ShieldIcon />,
        },
      ]
    : [];

  const dispatcherExtraCards =
    isDispatcher && !isAdmin && analytics?.operations_radar?.length
      ? [
          {
            label: "Fleet health",
            value: `${Math.round(
              analytics.operations_radar.reduce((s, d) => s + d.score, 0) /
                analytics.operations_radar.length,
            )}%`,
            hint: "Operations score",
            href: "/dashboard",
            accent: brand.cyan,
            icon: <ShieldIcon />,
          },
        ]
      : [];

  const allStatCards = [...cards, ...adminExtraCards, ...dispatcherExtraCards];

  const statsInitialLoading = statsQuery.isLoading && !statsQuery.data;
  const analyticsInitialLoading = analyticsQuery.isLoading && !analyticsQuery.data;
  const analyticsRefreshing = statsQuery.isFetching || analyticsQuery.isFetching;
  const isError = statsQuery.isError || analyticsQuery.isError;

  if (isParent) {
    return <ParentPortalHome />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={welcome.title}
        description={`${welcome.description}${user?.organization ? ` · ${user.organization.name}` : ""}`}
      />

      {isError && (
        <div className="fp-card flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-brand-secondary">Unable to load dashboard data.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              statsQuery.refetch();
              analyticsQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!isError && (
      <>
        {isSuperAdmin && statsInitialLoading && (
          <DashboardStatsSkeleton count={3} />
        )}

        {isSuperAdmin && !statsInitialLoading && data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <DashboardStatTile label="Organizations" value={data.organizations?.total ?? 0} accent={brand.primary} icon={<OrgIcon />} />
              <DashboardStatTile label="Platform users" value={data.users?.total ?? 0} accent={brand.cyan} icon={<UserIcon />} />
              <DashboardStatTile label="Org admins" value={data.admins?.total ?? 0} accent={brand.orange} icon={<CrownIcon />} />
            </div>
            <div className="fp-card p-6">
              <h3 className="text-sm font-bold text-brand-secondary">Platform control</h3>
              <p className="mt-1 text-sm text-slate-600">
                As super admin you manage all transportation tenants and their administrator accounts.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/dashboard/organizations" className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent-dark">
                  Manage organizations
                </Link>
                <Link href="/dashboard/users" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-secondary hover:bg-slate-50">
                  All users
                </Link>
              </div>
            </div>
          </div>
        )}

        {!isSuperAdmin && isAdmin && adminBanner.ready && !adminBanner.dismissed && (
          <DismissibleSection
            visible
            onDismiss={adminBanner.dismiss}
            dismissLabel="Hide organization control center"
          >
            <div className="fp-card overflow-hidden pr-12">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Administrator</p>
                    <h3 className="mt-0.5 text-lg font-bold text-brand-secondary">Organization control center</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Manage users, roles, fleet data, and analytics for {user?.organization?.name ?? "your organization"}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/dashboard/users"
                      className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-accent-dark"
                    >
                      Users & access
                    </Link>
                    <Link
                      href="/dashboard/roles"
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-secondary hover:bg-slate-50"
                    >
                      Roles & permissions
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </DismissibleSection>
        )}

        {!isSuperAdmin && isDispatcher && !isAdmin && (
          <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-cyan">Dispatch operations</p>
            <p className="mt-1 text-sm text-slate-700">
              Assign today&apos;s runs to approved drivers, then monitor live fleet on the radar map.
            </p>
            <Link
              href="/dashboard/dispatch"
              className="mt-3 inline-flex items-center text-sm font-semibold text-brand-primary hover:underline"
            >
              Open dispatch board →
            </Link>
          </div>
        )}

        {!isSuperAdmin && (
          <DashboardAnalyticsFilterBar
            filters={filters}
            onChange={patchFilters}
            onClear={clearFilters}
            schoolOptions={schoolOptions}
            isRefreshing={analyticsRefreshing && !statsInitialLoading}
            hasActive={hasActiveFilters}
          />
        )}

        {!isSuperAdmin && (
        statsInitialLoading ? (
          <DashboardStatsSkeleton count={allStatCards.length || 8} />
        ) : (
        <DashboardRefreshingSection refreshing={statsQuery.isFetching && !statsInitialLoading}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {allStatCards.map((card) => (
            <Link key={card.label} href={card.href} className="block">
              <DashboardStatTile
                label={card.label}
                value={card.value ?? 0}
                hint={card.hint}
                accent={card.accent}
                icon={card.icon}
              />
            </Link>
          ))}
        </div>
        </DashboardRefreshingSection>
        )
        )}

        {!isSuperAdmin && analyticsInitialLoading && <DashboardChartsSkeleton />}

        {!isSuperAdmin && !analyticsInitialLoading && analytics && (
          <DashboardRefreshingSection refreshing={analyticsQuery.isFetching && !analyticsInitialLoading}>
            <div className="space-y-3">
            <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:items-stretch">
              <FleetBarChart data={analytics.fleet_overview} />
              <RoutesByTypeChart data={analytics.routes_by_type} />
            </div>

            {isOpsViewer && insightsPanel.ready && !insightsPanel.dismissed && (
              <FleetInsightsPanel
                analytics={analytics}
                onDismiss={insightsPanel.dismiss}
                showPeopleCharts
              />
            )}
            </div>
            </DashboardRefreshingSection>
        )}

        {!isSuperAdmin && isAdmin && quickActions.ready && !quickActions.dismissed && (
          <DismissibleSection
            visible
            onDismiss={quickActions.dismiss}
            dismissLabel="Hide quick actions"
          >
            <div className="pr-10">
              <QuickActionsPanel title="Quick actions" description="Common administration and fleet tasks">
                <QuickActionTile href="/dashboard/dispatch" label="Today's dispatch" description="Assign drivers & vehicles to runs" accent={brand.primary} />
                <QuickActionTile href="/dashboard/users" label="Users & access" description="Accounts, roles, passwords" accent={brand.orange} />
                <QuickActionTile href="/dashboard/roles" label="Roles & permissions" description="RBAC and access control" accent={brand.cyan} />
                <QuickActionTile href="/dashboard/routes" label="Manage routes" description="Routes and scheduled runs" accent={brand.accent} />
              </QuickActionsPanel>
            </div>
          </DismissibleSection>
        )}

        {!isSuperAdmin && isDispatcher && !isAdmin && quickActions.ready && !quickActions.dismissed && (
          <DismissibleSection
            visible
            onDismiss={quickActions.dismiss}
            dismissLabel="Hide quick actions"
          >
            <div className="pr-10">
              <QuickActionsPanel title="Quick actions" description="Jump to common dispatch tasks">
                <QuickActionTile href="/dashboard/dispatch" label="Today's dispatch" description="Assign drivers & vehicles to runs" accent={brand.primary} />
                <QuickActionTile href="/dashboard/radar" label="Live radar" description="Track fleet GPS in real time" accent={brand.cyan} />
                <QuickActionTile href="/dashboard/routes" label="Manage routes" description="View and edit daily runs" accent={brand.orange} />
                <QuickActionTile href="/dashboard/drivers" label="Driver roster" description="Licenses and compliance" accent={brand.accent} />
              </QuickActionsPanel>
            </div>
          </DismissibleSection>
        )}

        {anyDismissed && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                adminBanner.restore();
                insightsPanel.restore();
                quickActions.restore();
              }}
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Restore hidden dashboard sections
            </button>
          </div>
        )}

        {!isSuperAdmin && !isOpsViewer && (
          <div className="fp-card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Your access</h3>
            <p className="mt-1 text-xs text-slate-500">Permissions from your assigned roles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(user?.permissions ?? []).map((perm) => (
                <span
                  key={perm}
                  className="rounded-full bg-brand-accent-light px-3 py-1 text-xs font-medium text-brand-accent-dark"
                >
                  {perm}
                </span>
              ))}
              {!user?.permissions?.length && (
                <span className="text-sm text-slate-400">No granular permissions assigned.</span>
              )}
            </div>
          </div>
        )}
      </>
      )}
    </div>
  );
}
