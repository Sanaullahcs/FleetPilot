"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { SchoolStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { SchoolDetailModal } from "@/components/dashboard/school-detail-modal";
import { SchoolFormModal } from "@/components/dashboard/school-form";
import { ContactCell } from "@/components/ui/contact-cell";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  deleteSchool,
  getSchoolFilterOptions,
  listSchools,
} from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { School } from "@/lib/types";

const ENROLLMENT_OPTIONS = [
  { label: "With enrolled students", value: "with_students" },
  { label: "No students yet", value: "without_students" },
];

export default function SchoolsPage() {
  const can = usePermission();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("code");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingName, setViewingName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);

  const filterOptionsQuery = useQuery({
    queryKey: ["school-filter-options"],
    queryFn: getSchoolFilterOptions,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["schools", { search, district, state, city, enrollment, page, sortKey, sortDir }],
    queryFn: () =>
      listSchools({
        search,
        district,
        state,
        city,
        enrollment: enrollment as "" | "with_students" | "without_students",
        page,
        ...sortParams,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["school-stats"] });
      queryClient.invalidateQueries({ queryKey: ["school-filter-options"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("School deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete school.")),
  });

  const filterOpts = filterOptionsQuery.data;

  const districtOptions = useMemo(
    () => (filterOpts?.districts ?? []).map((d) => ({ label: d, value: d })),
    [filterOpts?.districts],
  );
  const stateOptions = useMemo(
    () => (filterOpts?.states ?? []).map((s) => ({ label: s, value: s })),
    [filterOpts?.states],
  );
  const cityOptions = useMemo(
    () => (filterOpts?.cities ?? []).map((c) => ({ label: c, value: c })),
    [filterOpts?.cities],
  );

  const clearFilters = () => {
    setSearch("");
    setDistrict("");
    setState("");
    setCity("");
    setEnrollment("");
    setPage(1);
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(district ? [{ key: "district", label: `District: ${district}` }] : []),
    ...(state ? [{ key: "state", label: `State: ${state}` }] : []),
    ...(city ? [{ key: "city", label: `City: ${city}` }] : []),
    ...(enrollment
      ? [{
          key: "enrollment",
          label: enrollment === "with_students" ? "With students" : "No students",
        }]
      : []),
  ];

  const openDetail = (s: School) => {
    setViewingId(s.id);
    setViewingName(s.name);
  };

  const handleDelete = async (s: School) => {
    const ok = await confirmDelete(s.name);
    if (ok) removeMutation.mutate(s.id);
  };

  const columns: Column<School>[] = [
    idColumn("code", (s) => s.code),
    {
      key: "name",
      header: "School",
      primary: true,
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div>
          <p className="font-medium text-slate-900">{s.name}</p>
          <p className="text-xs text-slate-400">{s.grade_levels ?? "—"}</p>
        </div>
      ),
    },
    { key: "district", header: "District", hideOnMobile: true, render: (s) => s.district ?? "—" },
    { key: "city", header: "Location", render: (s) => [s.city, s.state].filter(Boolean).join(", ") || "—" },
    {
      key: "contact",
      header: "Contact",
      hideOnMobile: true,
      render: (s) => <ContactCell phone={s.phone} email={s.contact_email} />,
    },
    {
      key: "students_count",
      header: "Students",
      render: (s) => (
        <Badge className="bg-brand-accent-light text-brand-accent-dark">
          {s.active_students_count ?? s.students_count ?? 0}
        </Badge>
      ),
    },
    {
      key: "routes_count",
      header: "Routes",
      hideOnMobile: true,
      render: (s) => (
        <span className="text-sm text-slate-600">{s.active_routes_count ?? s.routes_count ?? 0}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="School transportation"
        title="Schools"
        description="Districts and campuses you serve — enrollment, routes, and contacts in one place."
        action={
          can("schools.create") && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add school</Button>
          )
        }
      />

      <SchoolStatRow />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search name, code, city, district…"
        resultCount={data?.total}
        onClear={clearFilters}
        filters={[
          {
            key: "district",
            label: "District",
            value: district,
            onChange: (v) => { setDistrict(v); setPage(1); },
            options: districtOptions,
          },
          {
            key: "state",
            label: "State",
            value: state,
            onChange: (v) => { setState(v); setPage(1); },
            options: stateOptions,
          },
          {
            key: "city",
            label: "City",
            value: city,
            onChange: (v) => { setCity(v); setPage(1); },
            options: cityOptions,
          },
          {
            key: "enrollment",
            label: "Enrollment",
            value: enrollment,
            onChange: (v) => { setEnrollment(v); setPage(1); },
            options: ENROLLMENT_OPTIONS,
          },
        ]}
      />

      <ActiveFilterPills
        items={activePills}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "district") setDistrict("");
          if (key === "state") setState("");
          if (key === "city") setCity("");
          if (key === "enrollment") setEnrollment("");
          setPage(1);
        }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No schools match your filters."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(s) => s.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(s) => (
            <RowActions
              items={[
                { label: "View details", onClick: () => openDetail(s) },
                { label: "Edit", onClick: () => { setEditing(s); setModalOpen(true); }, hidden: !can("schools.update") },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(s), hidden: !can("schools.delete") },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <SchoolDetailModal schoolId={viewingId} fallbackName={viewingName} onClose={() => setViewingId(null)} />
      <SchoolFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["school-stats"] });
          queryClient.invalidateQueries({ queryKey: ["school-filter-options"] });
        }}
        school={editing}
      />
    </div>
  );
}
