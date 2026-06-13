"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { StudentStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { StudentFormModal } from "@/components/dashboard/student-form";
import { ParentLinksModal } from "@/components/dashboard/parent-links-modal";
import { StatusChip } from "@/components/dashboard/status-chip";
import { ContactCell } from "@/components/ui/contact-cell";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { promptChangeStatus } from "@/lib/status-alerts";
import { STUDENT_STATUS_OPTIONS } from "@/lib/status-options";
import { getApiErrorMessage } from "@/lib/api";
import { downloadProfilePdf, safePdfFilename } from "@/lib/pdf/download-profile-pdf";
import { StudentProfilePdf } from "@/lib/pdf/student-profile-pdf";
import { deleteStudent, getStudent, listSchools, listStudents, updateStudentStatus } from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { Student } from "@/lib/types";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Graduated", value: "graduated" },
  { label: "Transferred", value: "transferred" },
];

const GRADE_OPTIONS = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((g) => ({
  label: g === "K" ? "Kindergarten" : g === "PK" ? "Pre-K" : `Grade ${g}`,
  value: g,
}));

const DRIVER_ASSIGNMENT_OPTIONS = [
  { label: "Has Driver", value: "assigned" },
  { label: "No Driver", value: "unassigned" },
];

export default function StudentsPage() {
  const can = usePermission();
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [schoolId, setSchoolId] = useState(isSchoolContact ? user?.school_id ?? "" : "");
  const [grade, setGrade] = useState("");
  const [assignment, setAssignment] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("student_number");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [parentLinksStudent, setParentLinksStudent] = useState<Student | null>(null);

  const { data: schoolsPage } = useQuery({
    queryKey: ["schools", "student-filter"],
    queryFn: () => listSchools({ per_page: 200, sort_by: "name", sort_dir: "asc" }),
  });

  const schoolOptions = useMemo(
    () => (schoolsPage?.data ?? []).map((s) => ({ label: s.name, value: s.id, sublabel: s.code ?? undefined })),
    [schoolsPage?.data],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["students", { search, status, schoolId, grade, assignment, page, sortKey, sortDir }],
    queryFn: () =>
      listStudents({
        search,
        status,
        school_id: schoolId || undefined,
        grade: grade || undefined,
        assignment: assignment as "" | "assigned" | "unassigned",
        page,
        ...sortParams,
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("Student deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete student.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStudentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["driver-student-assignments"] });
      toastSuccess("Status updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update status.")),
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSchoolId(isSchoolContact ? user?.school_id ?? "" : "");
    setGrade("");
    setAssignment("");
    setPage(1);
  };

  const activePills = [
    ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
    ...(status ? [{ key: "status", label: `Status: ${titleCase(status)}` }] : []),
    ...(schoolId
      ? [{ key: "school_id", label: `School: ${schoolOptions.find((s) => s.value === schoolId)?.label ?? schoolId}` }]
      : []),
    ...(grade ? [{ key: "grade", label: `Grade: ${grade}` }] : []),
    ...(assignment ? [{ key: "assignment", label: assignment === "assigned" ? "Has driver" : "No driver" }] : []),
  ];

  const handleDelete = async (student: Student) => {
    const ok = await confirmDelete(`${student.first_name} ${student.last_name}`);
    if (ok) removeMutation.mutate(student.id);
  };

  const handleDownloadPdf = async (student: Student) => {
    try {
      toastSuccess("Generating PDF…");
      const full = await getStudent(student.id);
      await downloadProfilePdf(
        <StudentProfilePdf student={full} parents={full.parents ?? []} />,
        safePdfFilename(`${student.first_name}-${student.last_name}-student-profile`),
      );
      toastSuccess("PDF downloaded");
    } catch (e) {
      toastError("PDF failed", getApiErrorMessage(e, "Could not generate profile PDF."));
    }
  };

  const handleStatusChange = async (student: Student) => {
    if (!can("students.update")) return;
    const label = `${student.first_name} ${student.last_name}`;
    const choice = await promptChangeStatus(label, STUDENT_STATUS_OPTIONS, student.status);
    if (choice === false || choice === student.status) return;
    statusMutation.mutate({ id: student.id, status: choice });
  };

  const columns: Column<Student>[] = [
    idColumn("student_number", (s) => s.student_number),
    {
      key: "name",
      header: "Name",
      primary: true,
      sortable: true,
      sortValue: (s) => `${s.last_name} ${s.first_name}`,
      render: (s) => (
        <div>
          <p className="font-medium text-slate-900">
            {s.first_name} {s.last_name}
          </p>
          <p className="text-xs text-slate-400">Grade {s.grade ?? "—"}</p>
        </div>
      ),
    },
    { key: "grade", header: "Grade", render: (s) => `Grade ${s.grade ?? "—"}` },
    { key: "school", header: "School", render: (s) => s.school?.name ?? "—" },
    {
      key: "driver",
      header: "Driver",
      hideOnMobile: true,
      render: (s) =>
        s.assigned_driver ? (
          <div>
            <p className="font-medium text-slate-800">
              {s.assigned_driver.first_name} {s.assigned_driver.last_name}
            </p>
            <p className="text-xs text-slate-400">{s.assigned_driver.employee_id ?? "—"}</p>
            <ContactCell phone={s.assigned_driver.phone} email={s.assigned_driver.email} className="mt-1" />
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: "needs",
      header: "Needs",
      hideOnMobile: true,
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.has_iep && <Badge>IEP</Badge>}
          {s.requires_wheelchair && <Badge className="bg-amber-50 text-amber-700">WC</Badge>}
          {s.requires_aide && <Badge className="bg-brand-accent-light text-brand-accent-dark">Aide</Badge>}
          {!s.has_iep && !s.requires_wheelchair && !s.requires_aide && (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    { key: "status", header: "Status", sortable: true, sortValue: (s) => s.status, render: (s) => (
      <StatusChip
        status={s.status}
        onClick={can("students.update") ? () => handleStatusChange(s) : undefined}
        disabled={statusMutation.isPending}
      />
    ) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Students"
        description={
          isSchoolContact
            ? "Enroll and manage students at your school, assign parents, and coordinate transportation access."
            : "Manage student records, school enrollment, driver assignments, and parent portal access."
        }
        action={
          can("students.create") && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Student</Button>
          )
        }
      />

      <StudentStatRow />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or student #…"
        resultCount={data?.total}
        onClear={clearFilters}
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: STATUS_OPTIONS,
          },
          ...(isSchoolContact
            ? []
            : [
                {
                  key: "school_id",
                  label: "School",
                  value: schoolId,
                  onChange: (v: string) => { setSchoolId(v); setPage(1); },
                  options: schoolOptions,
                },
              ]),
          {
            key: "grade",
            label: "Grade",
            value: grade,
            onChange: (v) => { setGrade(v); setPage(1); },
            options: GRADE_OPTIONS,
          },
          {
            key: "assignment",
            label: "Driver",
            value: assignment,
            onChange: (v) => { setAssignment(v); setPage(1); },
            options: DRIVER_ASSIGNMENT_OPTIONS,
          },
        ]}
      />

      <ActiveFilterPills items={activePills} onRemove={(key) => {
        if (key === "search") setSearch("");
        if (key === "status") setStatus("");
        if (key === "school_id") setSchoolId(isSchoolContact ? user?.school_id ?? "" : "");
        if (key === "grade") setGrade("");
        if (key === "assignment") setAssignment("");
        setPage(1);
      }} />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No students match your filters."
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
                { label: "Download Profile PDF", onClick: () => void handleDownloadPdf(s) },
                { label: "Manage Parents", onClick: () => setParentLinksStudent(s), hidden: !can("students.update") },
                { label: "Edit", onClick: () => { setEditing(s); setModalOpen(true); }, hidden: !can("students.update") },
                { label: "Change Status", onClick: () => handleStatusChange(s), hidden: !can("students.update") },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(s), hidden: !can("students.delete") },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <StudentFormModal open={modalOpen} onClose={() => setModalOpen(false)} student={editing} />
      <ParentLinksModal
        open={!!parentLinksStudent}
        student={parentLinksStudent}
        onClose={() => setParentLinksStudent(null)}
      />
    </div>
  );
}
