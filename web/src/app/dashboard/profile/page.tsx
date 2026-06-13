"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { fetchMe } from "@/lib/auth-api";
import { PageHeader, Badge, Button } from "@/components/ui/primitives";
import { PageState } from "@/components/ui/page-state";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { ParentProfileExtrasForm } from "@/components/dashboard/parent-profile-extras-form";
import { DriverProfileExtrasForm } from "@/components/dashboard/driver-profile-extras-form";
import { ContractorProfileExtrasForm } from "@/components/dashboard/contractor-profile-extras-form";
import {
  IdIcon,
  OrgIcon,
  PhoneIcon,
  ProfileMetaChip,
  ProfilePhotoAvatar,
  profileRoleLabel,
  roleAccent,
  ShieldIcon,
  UserIcon,
} from "@/components/dashboard/profile-photo-avatar";
import { getRoleLabel } from "@/lib/portal";
import { titleCase } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const PORTAL_ROLES: UserRole[] = ["parent", "driver", "contractor", "school_contact"];

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

  const isPortalUser = user ? PORTAL_ROLES.includes(user.role) : false;
  const accent = user ? roleAccent(user.role) : undefined;
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
        <div className="space-y-4">
          <PageHeader
            compact
            eyebrow={getRoleLabel(user.role)}
            title="My Profile"
            description="Account settings, contact details, and preferences."
            action={
              user.role === "admin" ? (
                <Link href="/dashboard/users">
                  <Button size="sm" variant="secondary">
                    Manage Users
                  </Button>
                </Link>
              ) : null
            }
          />

          <article className="fp-panel overflow-hidden">
            <div className="h-0.5" style={{ background: accent }} />
            <div className="relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{ background: `linear-gradient(135deg, ${accent} 0%, transparent 55%)` }}
              />
              <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <ProfilePhotoAvatar
                  name={user.full_name}
                  seed={user.id}
                  role={user.role}
                  gender={user.gender}
                  photoUrl={user.profile_photo_url}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-brand-secondary">{user.full_name}</h2>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ background: accent }}
                    >
                      {profileRoleLabel(user.role)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
                  {user.organization ? (
                    <p className="mt-1 truncate text-xs text-slate-400">{user.organization.name}</p>
                  ) : user.role === "super_admin" ? (
                    <p className="mt-1 text-xs text-slate-400">FleetPilot Platform</p>
                  ) : null}
                </div>
              </div>

              <div className="relative flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
                <ProfileMetaChip
                  icon={<PhoneIcon />}
                  label="Phone"
                  value={user.phone ?? "Not set"}
                  accent={accent}
                />
                <ProfileMetaChip
                  icon={<UserIcon />}
                  label="Primary Role"
                  value={profileRoleLabel(user.role)}
                  accent={accent}
                />
                {!isPortalUser ? (
                  <>
                    <ProfileMetaChip
                      icon={<ShieldIcon />}
                      label="RBAC Roles"
                      value={roleCount || "None assigned"}
                      accent={accent}
                    />
                    <ProfileMetaChip
                      icon={<IdIcon />}
                      label="Permissions"
                      value={permCount || "Full access"}
                      accent={accent}
                    />
                  </>
                ) : (
                  <>
                    <ProfileMetaChip
                      icon={<OrgIcon />}
                      label="Organization"
                      value={user.organization?.name ?? (user.role === "super_admin" ? "Platform" : "—")}
                      accent={accent}
                    />
                    <ProfileMetaChip
                      icon={<IdIcon />}
                      label="User ID"
                      value={`${user.id.slice(0, 8)}…`}
                      accent={accent}
                    />
                  </>
                )}
              </div>
            </div>
          </article>

          {!isPortalUser ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <article className="fp-panel overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
                  <h3 className="text-sm font-semibold text-brand-secondary">Account</h3>
                  <p className="text-[11px] text-slate-500">Sign-in identity</p>
                </div>
                <dl className="divide-y divide-slate-100">
                  {[
                    ["First Name", user.first_name],
                    ["Last Name", user.last_name],
                    ["Email", user.email],
                    ["Phone", user.phone ?? "—"],
                    ["User ID", user.id],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 px-4 py-2 sm:px-5">
                      <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </dt>
                      <dd className="truncate text-right text-xs font-medium text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>

              <article className="fp-panel overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-2.5 sm:px-5">
                  <h3 className="text-sm font-semibold text-brand-secondary">Organization</h3>
                  <p className="text-[11px] text-slate-500">
                    {user.role === "super_admin" ? "Platform administration" : "Your tenant"}
                  </p>
                </div>
                {user.organization ? (
                  <div className="space-y-2 px-4 py-3 sm:px-5">
                    <p className="text-sm font-semibold text-brand-secondary">{user.organization.name}</p>
                    <p className="text-[11px] text-slate-500">Slug · {user.organization.slug}</p>
                    <p className="font-mono text-[10px] text-slate-400">{user.organization.id}</p>
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center sm:px-5">
                    <p className="text-xs font-medium text-slate-700">FleetPilot Platform</p>
                    <p className="mt-1 text-[11px] text-slate-500">Super admin scope</p>
                    <Link
                      href="/dashboard/organizations"
                      className="mt-3 inline-block rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent-dark"
                    >
                      View organizations
                    </Link>
                  </div>
                )}
              </article>
            </div>
          ) : null}

          <ProfileEditForm user={user} />

          {user.role === "parent" ? <ParentProfileExtrasForm /> : null}
          {user.role === "driver" ? <DriverProfileExtrasForm /> : null}
          {user.role === "contractor" ? <ContractorProfileExtrasForm user={user} /> : null}

          {!isPortalUser ? (
            <article className="fp-panel overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-2.5 sm:px-5">
                <div>
                  <h3 className="text-sm font-semibold text-brand-secondary">Access & permissions</h3>
                  <p className="text-[11px] text-slate-500">Roles and API-resolved permissions</p>
                </div>
                {user.role === "admin" ? (
                  <Link
                    href="/dashboard/roles"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-brand-secondary hover:bg-slate-50"
                  >
                    Roles settings
                  </Link>
                ) : null}
              </div>

              <div className="space-y-3 px-4 py-3 sm:px-5">
                {user.roles?.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">RBAC roles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((r) => (
                        <Badge key={r} className="text-[10px]">
                          {titleCase(r)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {user.role === "admin" || user.role === "super_admin"
                      ? "Implicit full access"
                      : `Permissions (${permCount})`}
                  </p>
                  {user.role === "admin" || user.role === "super_admin" ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      Your role grants unrestricted access to all modules in your scope.
                    </p>
                  ) : user.permissions?.length ? (
                    <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                      {user.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No granular permissions assigned.</p>
                  )}
                </div>
              </div>
            </article>
          ) : null}
        </div>
      )}
    </PageState>
  );
}
