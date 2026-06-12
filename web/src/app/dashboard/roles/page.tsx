"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge, Spinner, SearchInput } from "@/components/ui/primitives";
import { RolesStatRow } from "@/components/dashboard/resource-stat-rows";
import { PageState } from "@/components/ui/page-state";
import { toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { listPermissionGroups, listRoles, updateRolePermissions } from "@/lib/resources";
import type { AdminRole } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const { data: roles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  const { data: groups, isLoading: loadingPerms, isError: permsError } = useQuery({
    queryKey: ["permissions"],
    queryFn: listPermissionGroups,
  });

  const selected = roles?.find((r) => r.id === selectedId) ?? null;

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles ?? [];
    return (roles ?? []).filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        titleCase(r.slug.replace(/_/g, " ")).toLowerCase().includes(q),
    );
  }, [roles, search]);

  useEffect(() => {
    if (roles?.length && !selectedId) setSelectedId(roles[0].id);
  }, [roles, selectedId]);

  useEffect(() => {
    if (selected) {
      setChecked(new Set((selected.permissions ?? []).map((p) => p.id)));
    }
  }, [selected?.id, selected?.permissions]);

  const saveMutation = useMutation({
    mutationFn: () => updateRolePermissions(selectedId!, Array.from(checked)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toastSuccess("Permissions saved", res.message);
    },
    onError: (e) => toastError("Save failed", getApiErrorMessage(e, "Could not update permissions.")),
  });

  const togglePerm = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleResource = (permIds: string[]) => {
    const allOn = permIds.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      permIds.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const permissionCount = useMemo(
    () => (groups ?? []).reduce((sum, g) => sum + (g.permissions?.length ?? 0), 0),
    [groups],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & permissions"
        description="Configure what each role can view, create, update, or delete across FleetPilot."
      />

      <RolesStatRow
        roleCount={roles?.length ?? 0}
        permissionCount={permissionCount}
        selectedPermissionCount={checked.size}
        groupCount={groups?.length ?? 0}
        isLoading={isLoading || loadingPerms}
      />

      <div className="fp-card p-4">
        <label className="fp-label mb-1.5 block">Search roles</label>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by role name…" />
      </div>

      <PageState
        isLoading={isLoading}
        isError={isError || permsError}
        errorMessage={getApiErrorMessage(error, "Unable to load roles. Please try again.")}
        onRetry={() => refetch()}
        emptyMessage="No roles configured for this organization."
        isEmpty={!isLoading && !isError && (roles?.length ?? 0) === 0}
      >
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Role list */}
          <div className="fp-card divide-y divide-slate-100 p-0 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p>
            </div>
            {filteredRoles.map((role) => (
              <RoleListItem
                key={role.id}
                role={role}
                active={role.id === selectedId}
                onClick={() => setSelectedId(role.id)}
              />
            ))}
          </div>

          {/* Permission matrix */}
          <div className="fp-card p-0 overflow-hidden">
            {!selected ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-500">
                Select a role to edit permissions.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selected.name}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {selected.description ?? "No description."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.is_system_role && (
                        <Badge className="bg-brand-accent-light text-brand-accent-dark">System role</Badge>
                      )}
                      <Badge>{selected.users_count ?? 0} users</Badge>
                      <Badge>{checked.size} permissions selected</Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending || selected.is_system_role && selected.slug === "admin"}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save permissions"}
                  </Button>
                </div>

                {selected.slug === "admin" ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-600">
                    The <strong>Admin</strong> role has implicit full access. Permissions are not editable.
                  </div>
                ) : loadingPerms ? (
                  <div className="flex justify-center py-16">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {groups?.map((group) => {
                      const ids = group.permissions.map((p) => p.id);
                      const onCount = ids.filter((id) => checked.has(id)).length;
                      return (
                        <div key={group.resource} className="px-5 py-4">
                          <div className="mb-3 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleResource(ids)}
                              className="text-sm font-semibold text-brand-secondary hover:text-brand-accent"
                            >
                              {titleCase(group.resource.replace(/_/g, " "))}
                            </button>
                            <span className="text-xs font-medium text-brand-accent">
                              {onCount}/{ids.length} enabled
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {group.permissions.map((perm) => (
                              <label
                                key={perm.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                                  checked.has(perm.id)
                                    ? "border-brand-accent/40 bg-brand-accent-light text-brand-accent-dark"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked.has(perm.id)}
                                  onChange={() => togglePerm(perm.id)}
                                  className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
                                />
                                {titleCase(perm.action)}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageState>
    </div>
  );
}

function RoleListItem({
  role,
  active,
  onClick,
}: {
  role: AdminRole;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start px-4 py-3 text-left transition",
        active ? "bg-brand-accent-light border-l-4 border-brand-accent" : "hover:bg-slate-50 border-l-4 border-transparent",
      )}
    >
      <span className="font-medium text-slate-900">{role.name}</span>
      <span className="text-xs text-slate-500">{role.users_count ?? 0} users · {role.permissions?.length ?? 0} perms</span>
    </button>
  );
}
