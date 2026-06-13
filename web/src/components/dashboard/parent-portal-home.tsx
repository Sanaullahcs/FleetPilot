"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/primitives";
import { CompactQuickActions } from "@/components/dashboard/quick-action-tile";
import {
  PortalAvatar,
  PortalSectionCard,
  PortalStatTile,
} from "@/components/dashboard/portal-action-card";
import { StudentsIcon, HeadsetIcon, RouteIcon, MessageIcon } from "@/components/dashboard/stat-icons";
import { PageState } from "@/components/ui/page-state";
import { StatusChip } from "@/components/dashboard/status-chip";
import { brand } from "@/lib/brand";
import { getDashboardWelcome } from "@/lib/portal";
import { getParentChildren, listMyComplaints } from "@/lib/resources";
import { useAuthStore } from "@/store/auth";

function RowArrow() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ParentPortalHome() {
  const user = useAuthStore((s) => s.user);
  const welcome = getDashboardWelcome(user?.role, user?.first_name ?? "");

  const childrenQuery = useQuery({ queryKey: ["parent-children"], queryFn: getParentChildren });
  const complaintsQuery = useQuery({
    queryKey: ["complaints", "mine", "parent-home"],
    queryFn: () => listMyComplaints(),
  });

  const children = childrenQuery.data ?? [];
  const complaints = complaintsQuery.data?.items ?? [];
  const openComplaints = complaints.filter((c) => !["closed", "resolved", "rejected"].includes(c.status)).length;
  const routesToday = children.reduce((sum, c) => sum + c.routes_today.reduce((r, route) => r + route.runs.length, 0), 0);
  const isLoading = childrenQuery.isLoading;

  const quickActions = [
    { href: "/dashboard/my-children", label: "My Children", accent: brand.primary },
    { href: "/dashboard/messages", label: "Messages", accent: brand.accent },
    { href: "/dashboard/complaints", label: "Complaints", accent: brand.orange },
    { href: "/dashboard/support", label: "Help", accent: brand.cyan },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        compact
        eyebrow="Parent Portal"
        title={welcome.title}
        description={welcome.description}
        action={
          <Link
            href="/dashboard/my-children"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition hover:text-brand-primary/80 hover:underline"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-brand-primary [&_svg]:h-4 [&_svg]:w-4">
              <StudentsIcon />
            </span>
            My Children
            <RowArrow />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Link href="/dashboard/my-children" className="block">
          <PortalStatTile
            label="Linked Children"
            value={isLoading ? "—" : children.length}
            hint="On your account"
            accent={brand.primary}
            icon={<StudentsIcon />}
          />
        </Link>
        <Link href="/dashboard/my-children" className="block">
          <PortalStatTile
            label="Runs Today"
            value={isLoading ? "—" : routesToday}
            hint="Scheduled Routes"
            accent={brand.cyan}
            icon={<RouteIcon />}
          />
        </Link>
        <Link href="/dashboard/complaints" className="block">
          <PortalStatTile
            label="Open Complaints"
            value={complaintsQuery.isLoading ? "—" : openComplaints}
            hint={`${complaints.length} total`}
            accent={brand.orange}
            icon={<HeadsetIcon />}
          />
        </Link>
        <Link href="/dashboard/messages" className="block">
          <PortalStatTile
            label="Messages"
            value="Open"
            hint="Dispatch & drivers"
            accent={brand.accent}
            icon={<MessageIcon />}
          />
        </Link>
      </div>

      <CompactQuickActions flat items={quickActions} />

      <PageState
        isLoading={childrenQuery.isLoading}
        isError={childrenQuery.isError}
        onRetry={() => void childrenQuery.refetch()}
        isEmpty={!childrenQuery.isLoading && children.length === 0}
        emptyMessage="No students are linked to your account yet. Ask your transportation administrator to assign your children to your parent profile."
      >
        <PortalSectionCard title="Your Children" description="Students linked to your parent account">
          <div className="divide-y divide-slate-100">
            {children.map((item) => {
              const fullName = `${item.student.first_name} ${item.student.last_name}`;
              const runCount = item.routes_today.reduce((sum, route) => sum + route.runs.length, 0);
              return (
                <Link
                  key={item.student.id}
                  href="/dashboard/my-children"
                  className="group flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-slate-50 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PortalAvatar name={fullName} accent={brand.primary} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-secondary">{fullName}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {item.school?.name ?? "School pending"}
                        {item.student.grade ? ` · Grade ${item.student.grade}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {runCount > 0 ? (
                      <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                        {runCount} run{runCount === 1 ? "" : "s"} today
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">No runs today</span>
                    )}
                    <StatusChip status={item.student.status} />
                    <RowArrow />
                  </div>
                </Link>
              );
            })}
          </div>
        </PortalSectionCard>
      </PageState>
    </div>
  );
}
