"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardStatTile } from "@/components/dashboard/dashboard-stat-tile";
import {
  PortalActionCard,
  PortalAvatar,
  PortalSectionCard,
} from "@/components/dashboard/portal-action-card";
import { StudentsIcon, HeadsetIcon, RouteIcon, MessageIcon, ShieldIcon } from "@/components/dashboard/stat-icons";
import { PageState } from "@/components/ui/page-state";
import { StatusChip } from "@/components/dashboard/status-chip";
import { brand } from "@/lib/brand";
import { getParentChildren, listMyComplaints } from "@/lib/resources";

const QUICK_ACTIONS = [
  {
    href: "/dashboard/my-children",
    title: "My children",
    description: "Live bus tracking, assigned drivers, and today's routes.",
    accent: brand.primary,
    icon: <StudentsIcon />,
  },
  {
    href: "/dashboard/messages",
    title: "Messages",
    description: "Chat with drivers, schools, and the transportation office.",
    accent: brand.accent,
    icon: <MessageIcon />,
  },
  {
    href: "/dashboard/complaints",
    title: "Complaints",
    description: "Register and follow up on formal transportation issues.",
    accent: brand.orange,
    icon: <HeadsetIcon />,
  },
  {
    href: "/dashboard/support",
    title: "Help & support",
    description: "Contact dispatch, FAQs, and service channels.",
    accent: brand.cyan,
    icon: <ShieldIcon />,
  },
] as const;

export function ParentPortalHome() {
  const childrenQuery = useQuery({ queryKey: ["parent-children"], queryFn: getParentChildren });
  const complaintsQuery = useQuery({ queryKey: ["complaints", "mine", "parent-home"], queryFn: () => listMyComplaints() });

  const children = childrenQuery.data ?? [];
  const complaints = complaintsQuery.data?.items ?? [];
  const openComplaints = complaints.filter((c) => !["closed", "resolved", "rejected"].includes(c.status)).length;
  const routesToday = children.reduce((sum, c) => sum + c.routes_today.reduce((r, route) => r + route.runs.length, 0), 0);
  const isLoading = childrenQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 45%, ${brand.accent} 100%)`,
          }}
        />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Parent portal</p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Student transportation overview</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              Monitor routes and live bus status, communicate with drivers and schools, and stay informed about district transportation service.
            </p>
          </div>
          <Link
            href="/dashboard/my-children"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            View my children
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <Link href="/dashboard/my-children" className="block">
          <DashboardStatTile
            label="Linked children"
            value={isLoading ? "—" : children.length}
            hint="Students on your account"
            accent={brand.primary}
            icon={<StudentsIcon />}
          />
        </Link>
        <Link href="/dashboard/my-children" className="block">
          <DashboardStatTile
            label="Routes today"
            value={isLoading ? "—" : routesToday}
            hint="Scheduled runs"
            accent={brand.cyan}
            icon={<RouteIcon />}
          />
        </Link>
        <Link href="/dashboard/complaints" className="block">
          <DashboardStatTile
            label="Open complaints"
            value={complaintsQuery.isLoading ? "—" : openComplaints}
            hint={`${complaints.length} total registered`}
            accent={brand.orange}
            icon={<HeadsetIcon />}
          />
        </Link>
      </div>

      <div>
        <p className="mb-2.5 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <PortalActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      <PageState
        isLoading={childrenQuery.isLoading}
        isError={childrenQuery.isError}
        onRetry={() => void childrenQuery.refetch()}
        isEmpty={!childrenQuery.isLoading && children.length === 0}
        emptyMessage="No students are linked to your account yet. Ask your transportation administrator to assign your children to your parent profile."
      >
        <PortalSectionCard title="Your children" description="Students linked to your parent account">
          <div className="divide-y divide-slate-100">
            {children.map((item) => {
              const fullName = `${item.student.first_name} ${item.student.last_name}`;
              return (
                <div
                  key={item.student.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-brand-light/20 sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PortalAvatar name={fullName} accent={brand.primary} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{fullName}</p>
                      <p className="truncate text-sm text-slate-500">
                        {item.school?.name ?? "School pending"}
                        {item.student.grade ? ` · Grade ${item.student.grade}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip status={item.student.status} />
                    <Link
                      href="/dashboard/my-children"
                      className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-primary/20 transition hover:bg-brand-dark"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </PortalSectionCard>
      </PageState>
    </div>
  );
}
