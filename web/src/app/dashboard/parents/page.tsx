"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { ParentStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { ParentFormModal } from "@/components/dashboard/parent-form";
import { ParentStudentsModal } from "@/components/dashboard/parent-students-modal";
import { ContactCell } from "@/components/ui/contact-cell";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { deleteParent, listParents, updateParent } from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { ParentRecord } from "@/lib/types";

const ACTIVE_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const STUDENTS_OPTIONS = [
  { label: "Has Students", value: "with_students" },
  { label: "No Students", value: "without_students" },
];

export default function ParentsPage() {
  const can = usePermission();
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [studentsAssignment, setStudentsAssignment] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("last_name");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParentRecord | null>(null);
  const [assignParent, setAssignParent] = useState<ParentRecord | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parents", { search, isActive, studentsAssignment, page, sortKey, sortDir }],
    queryFn: () =>
      listParents({
        search,
        page,
        ...sortParams,
        ...(isActive === "true" ? { is_active: true } : isActive === "false" ? { is_active: false } : {}),
        ...(studentsAssignment ? { students_assignment: studentsAssignment as "with_students" | "without_students" } : {}),
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteParent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["parent-stats"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastSuccess("Parent deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete parent.")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (parent: ParentRecord) => {
      if (!parent.user) throw new Error("Missing user");
      return updateParent(parent.id, {
        email: parent.user.email,
        first_name: parent.user.first_name,
        last_name: parent.user.last_name,
        phone: parent.user.phone ?? undefined,
        relationship: parent.relationship ?? undefined,
        is_active: !parent.user.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      toastSuccess("Access updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update parent.")),
  });

  const clearFilters = () => {
    setSearch("");
    setIsActive("");
    setStudentsAssignment("");
    setPage(1);
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(isActive ? [{ key: "is_active", label: `Status: ${isActive === "true" ? "Active" : "Inactive"}` }] : []),
    ...(studentsAssignment
      ? [{ key: "students", label: studentsAssignment === "with_students" ? "Has students" : "No students" }]
      : []),
  ];

  const handleDelete = async (parent: ParentRecord) => {
    const name = parent.user ? `${parent.user.first_name} ${parent.user.last_name}` : "this parent";
    const ok = await confirmDelete(name);
    if (ok) removeMutation.mutate(parent.id);
  };

  const columns: Column<ParentRecord>[] = [
    idColumn("email", (p) => p.user?.email),
    {
      key: "name",
      header: "Name",
      primary: true,
      sortable: true,
      sortValue: (p) => `${p.user?.last_name ?? ""} ${p.user?.first_name ?? ""}`,
      render: (p) => (
        <div>
          <p className="font-medium text-slate-900">
            {p.user ? `${p.user.first_name} ${p.user.last_name}` : "—"}
          </p>
          {p.relationship && (
            <p className="text-xs text-slate-400">{titleCase(p.relationship)}</p>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      sortable: true,
      sortValue: (p) => p.user?.email ?? "",
      render: (p) =>
        p.user ? (
          <ContactCell email={p.user.email} phone={p.user.phone} />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "students",
      header: "Students",
      render: (p) => (
        <div>
          <p className="font-semibold tabular-nums text-slate-900">{p.students_count}</p>
          <p className="text-xs text-slate-400">linked</p>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Portal",
      sortable: true,
      sortValue: (p) => (p.user?.is_active ? "1" : "0"),
      render: (p) =>
        p.user?.is_active ? (
          <Badge className="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200">Active</Badge>
        ) : (
          <Badge className="bg-amber-50 text-amber-800 ring-1 ring-amber-200">Inactive</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Parents"
        description={
          isSchoolContact
            ? "Add and manage parent accounts, link students, and control portal access for families at your school."
            : "Manage parent accounts, portal access, and assign students they can view in My Children and live tracking."
        }
        action={
          can("students.create") && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Parent</Button>
          )
        }
      />

      <ParentStatRow />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email, or phone…"
        resultCount={data?.total}
        onClear={clearFilters}
        filters={[
          {
            key: "is_active",
            label: "Portal Access",
            value: isActive,
            onChange: (v) => { setIsActive(v); setPage(1); },
            options: ACTIVE_OPTIONS,
          },
          {
            key: "students",
            label: "Students",
            value: studentsAssignment,
            onChange: (v) => { setStudentsAssignment(v); setPage(1); },
            options: STUDENTS_OPTIONS,
          },
        ]}
      />

      <ActiveFilterPills
        items={activePills}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "is_active") setIsActive("");
          if (key === "students") setStudentsAssignment("");
          setPage(1);
        }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No parents match your filters."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(p) => p.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(p) => (
            <RowActions
              items={[
                {
                  label: "Assign Students",
                  onClick: () => setAssignParent(p),
                  hidden: !can("students.update"),
                },
                {
                  label: "Edit",
                  onClick: () => { setEditing(p); setModalOpen(true); },
                  hidden: !can("students.update"),
                },
                {
                  label: p.user?.is_active ? "Deactivate portal" : "Activate portal",
                  onClick: () => toggleActiveMutation.mutate(p),
                  hidden: !can("students.update"),
                },
                {
                  label: "Delete",
                  variant: "danger",
                  onClick: () => handleDelete(p),
                  hidden: !can("students.delete"),
                },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <ParentFormModal open={modalOpen} onClose={() => setModalOpen(false)} parent={editing} />
      <ParentStudentsModal
        open={!!assignParent}
        parent={assignParent}
        onClose={() => setAssignParent(null)}
      />
    </div>
  );
}
