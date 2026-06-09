"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { fetchMe } from "@/lib/auth-api";
import { PageState } from "@/components/ui/page-state";
import { Badge } from "@/components/ui/primitives";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { ParentProfileExtrasForm } from "@/components/dashboard/parent-profile-extras-form";
import { brand } from "@/lib/brand";
import { titleCase } from "@/lib/utils";

function InfoTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/80 p-4 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const me = await fetchMe();
      setUser(me);
      return me;
    },
    initialData: storedUser ?? undefined,
  });

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "—";

  const permCount = user?.permissions?.length ?? 0;
  const roleCount = user?.roles?.length ?? 0;

  return (
    <PageState
      isLoading={isLoading && !user}
      isError={isError}
      errorMessage="Unable to load your profile."
      onRetry={() => refetch()}
    >
      {user && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 45%, ${brand.accent} 100%)`,
              }}
            />
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-brand-cyan/20 blur-3xl" />

            <div className="relative px-5 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white/30 bg-white/20 text-3xl font-bold text-white shadow-lg backdrop-blur-sm sm:h-28 sm:w-28">
                    {initials}
                  </div>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">{user.full_name}</h1>
                    <p className="mt-1 text-sm text-white/80">{user.email}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {titleCase(user.role)}
                      </span>
                      {user.organization && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                          {user.organization.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                  {user.role === "admin" && (
                    <Link
                      href="/dashboard/users"
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-white/95"
                    >
                      Manage users
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoTile label="Primary role" value={titleCase(user.role)} accent={brand.primary} />
            <InfoTile
              label="Organization"
              value={user.organization?.name ?? "Platform"}
              accent={brand.accent}
            />
            <InfoTile label="RBAC roles" value={roleCount || "—"} accent={brand.cyan} />
            <InfoTile label="Permissions" value={permCount || "Full access"} accent={brand.orange} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Account */}
            <div className="fp-card p-6">
              <h2 className="text-base font-bold text-brand-secondary">Account details</h2>
              <p className="mt-0.5 text-xs text-slate-500">Your sign-in identity and portal role</p>
              <dl className="mt-5 space-y-4">
                {[
                  ["First name", user.first_name],
                  ["Last name", user.last_name],
                  ["Email", user.email],
                  ["Phone", user.phone ?? "—"],
                  ["User ID", user.id],
                  ["Primary role", titleCase(user.role)],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 border-b border-slate-50 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="text-sm font-medium text-slate-800 break-all sm:text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Organization */}
            <div className="fp-card p-6">
              <h2 className="text-base font-bold text-brand-secondary">Organization</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {user.role === "super_admin"
                  ? "Platform-wide administration access"
                  : "Tenant you belong to"}
              </p>
              {user.organization ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 p-4">
                    <p className="text-lg font-bold text-brand-secondary">{user.organization.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Slug: {user.organization.slug}</p>
                  </div>
                  <dl className="space-y-3">
                    <div className="flex justify-between gap-4 text-sm">
                      <dt className="text-slate-500">Org ID</dt>
                      <dd className="font-mono text-xs text-slate-700">{user.organization.id.slice(0, 8)}…</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                  <p className="text-sm font-medium text-slate-700">FleetPilot Platform</p>
                  <p className="mt-1 text-xs text-slate-500">Super admin — manages all organizations</p>
                  <Link
                    href="/dashboard/organizations"
                    className="mt-4 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent-dark"
                  >
                    View organizations
                  </Link>
                </div>
              )}
            </div>
          </div>

          <ProfileEditForm user={user} />

          {user.role === "parent" ? <ParentProfileExtrasForm /> : null}

          {/* RBAC */}
          <div className="fp-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-brand-secondary">Access & permissions</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Roles and granular permissions resolved from the API
                </p>
              </div>
              {user.role === "admin" && (
                <Link
                  href="/dashboard/roles"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-secondary hover:bg-slate-50"
                >
                  Roles settings
                </Link>
              )}
            </div>

            {user.roles?.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">RBAC roles</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((r) => (
                    <Badge key={r} className="bg-brand-primary/10 text-brand-primary">
                      {titleCase(r)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {user.role === "admin" || user.role === "super_admin"
                  ? "Implicit full access"
                  : `Permissions (${permCount})`}
              </p>
              {user.role === "admin" || user.role === "super_admin" ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Your role grants unrestricted access to all modules in your scope.
                </p>
              ) : user.permissions?.length ? (
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  {user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No granular permissions assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageState>
  );
}
