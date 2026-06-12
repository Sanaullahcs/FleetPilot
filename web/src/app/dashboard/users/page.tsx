"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { UserStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { UserFormModal } from "@/components/dashboard/user-form";
import {
  confirmBlock,
  confirmDelete,
  promptResetPassword,
  toastError,
  toastSuccess,
} from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  deleteUser,
  listUsers,
  resetUserPassword,
  toggleUserActive,
  USER_ROLES,
} from "@/lib/resources";
import { useAuthStore } from "@/store/auth";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { AdminUser } from "@/lib/types";

function AccountBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20"
      }
    >
      {active ? "Active" : "Blocked"}
    </span>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}

function UsersPageContent() {
  const authUser = useAuthStore((s) => s.user);
  const isSuperAdmin = authUser?.role === "super_admin";
  const searchParams = useSearchParams();
  const orgFilter = searchParams.get("organization_id") ?? "";

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("email");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const isActiveParam =
    activeFilter === "active" ? true : activeFilter === "blocked" ? false : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", { search, role, activeFilter, page, orgFilter, sortKey, sortDir }],
    queryFn: () => listUsers({
      search,
      role,
      is_active: isActiveParam,
      page,
      organization_id: orgFilter || undefined,
      ...sortParams,
    }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(id, password, password),
    onSuccess: () => {
      toastSuccess("Password updated", "The user can sign in with the new password.");
    },
    onError: (e) => toastError("Reset failed", getApiErrorMessage(e, "Could not reset password.")),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUserActive,
    onSuccess: (res) => {
      invalidate();
      toastSuccess(res.message);
    },
    onError: (e) => toastError("Action failed", getApiErrorMessage(e, "Could not update account status.")),
  });

  const removeMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      invalidate();
      toastSuccess("User deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete user.")),
  });

  const clearFilters = () => {
    setSearch("");
    setRole("");
    setActiveFilter("");
    setPage(1);
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(role ? [{ key: "role", label: `Role: ${titleCase(role)}` }] : []),
    ...(activeFilter ? [{ key: "active", label: activeFilter === "active" ? "Active only" : "Blocked only" }] : []),
  ];

  const handleResetPassword = async (user: AdminUser) => {
    const password = await promptResetPassword(`${user.first_name} ${user.last_name}`);
    if (password) resetPasswordMutation.mutate({ id: user.id, password });
  };

  const handleToggle = async (user: AdminUser) => {
    const ok = await confirmBlock(`${user.first_name} ${user.last_name}`, user.is_active);
    if (ok) toggleMutation.mutate(user.id);
  };

  const handleDelete = async (user: AdminUser) => {
    const ok = await confirmDelete(`${user.first_name} ${user.last_name} (${user.email})`);
    if (ok) removeMutation.mutate(user.id);
  };

  const columns: Column<AdminUser>[] = [
    idColumn("email", (u) => u.email),
    {
      key: "name",
      header: "User",
      primary: true,
      sortable: true,
      sortValue: (u) => `${u.last_name} ${u.first_name}`,
      render: (u) => (
        <div>
          <p className="font-medium text-slate-900">{u.first_name} {u.last_name}</p>
          <p className="text-xs text-slate-400">{u.phone ?? "—"}</p>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [{
          key: "organization",
          header: "Organization",
          render: (u: AdminUser) => u.organization?.name ?? "—",
        } as Column<AdminUser>]
      : []),
    {
      key: "role",
      header: "Role",
      render: (u) => <Badge className="bg-brand-accent-light text-brand-accent-dark">{titleCase(u.role)}</Badge>,
    },
    {
      key: "rbac",
      header: "RBAC",
      hideOnMobile: true,
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {(u.roles ?? []).map((r) => (
            <Badge key={r.id}>{r.name}</Badge>
          ))}
          {!u.roles?.length && <span className="text-xs text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      hideOnMobile: true,
      render: (u) => u.phone ?? "—",
    },
    {
      key: "status",
      header: "Account",
      render: (u) => <AccountBadge active={u.is_active} />,
    },
    {
      key: "last_login",
      header: "Last login",
      hideOnMobile: true,
      render: (u) =>
        u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={isSuperAdmin ? "All users" : "Users & access"}
        description={
          isSuperAdmin
            ? "Manage administrator and staff accounts across all organizations."
            : "Manage accounts, passwords, and block or activate users across your organization."
        }
        action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add user</Button>}
      />

      <UserStatRow />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or email…"
        resultCount={data?.total}
        onClear={clearFilters}
        filters={[
          {
            key: "role",
            label: "Role",
            value: role,
            onChange: (v) => { setRole(v); setPage(1); },
            options: USER_ROLES.filter((r) => r.value !== "super_admin").map((r) => ({ label: r.label, value: r.value })),
          },
          {
            key: "active",
            label: "Account status",
            value: activeFilter,
            onChange: (v) => { setActiveFilter(v); setPage(1); },
            options: [
              { label: "Active", value: "active" },
              { label: "Blocked", value: "blocked" },
            ],
          },
        ]}
      />

      <ActiveFilterPills
        items={activePills}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "role") setRole("");
          if (key === "active") setActiveFilter("");
          setPage(1);
        }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Unable to load users. Check your connection and try again."
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No users match your filters."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(u) => u.id}
          emptyMessage="No users found."
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(u) => (
            <RowActions
              items={[
                { label: "Edit", onClick: () => { setEditing(u); setModalOpen(true); } },
                { label: "Reset password", onClick: () => handleResetPassword(u) },
                {
                  label: u.is_active ? "Block user" : "Activate user",
                  variant: u.is_active ? "warning" : "default",
                  onClick: () => handleToggle(u),
                },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(u) },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination
          page={data.current_page}
          lastPage={data.last_page}
          total={data.total}
          onPageChange={setPage}
        />
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editing}
        organizationId={orgFilter || undefined}
      />
    </div>
  );
}
