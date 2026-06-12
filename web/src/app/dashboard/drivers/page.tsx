"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { DriverStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { DriverFormModal } from "@/components/dashboard/driver-form";
import { StudentFormModal } from "@/components/dashboard/student-form";
import { AssignmentChip, PageTabs, formatVehicleType } from "@/components/dashboard/assignment-ui";
import { ContactCell } from "@/components/ui/contact-cell";
import { StatusChip } from "@/components/dashboard/status-chip";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { promptAssignStudentDriver, promptAssignVehicle } from "@/lib/assignment-alerts";
import { promptChangeStatus } from "@/lib/status-alerts";
import { DRIVER_STATUS_OPTIONS, STUDENT_STATUS_OPTIONS } from "@/lib/status-options";
import { getApiErrorMessage } from "@/lib/api";
import {
  assignDriverVehicle,
  assignStudentDriver,
  deleteDriver,
  getStudent,
  listDriverStudentAssignments,
  listDrivers,
  listSchools,
  listVehicles,
  updateDriverStatus,
  updateStudentStatus,
} from "@/lib/resources";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth";
import { titleCase } from "@/lib/utils";
import { idColumn, useTableSort } from "@/lib/table-utils";
import { buildDriverPickerOptions, buildVehiclePickerOptions } from "@/lib/picker-options";
import type { Driver, Student } from "@/lib/types";
import type { DriverStudentAssignment } from "@/lib/resources";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "On leave", value: "on_leave" },
  { label: "Terminated", value: "terminated" },
];

const LICENSE_CLASS_OPTIONS = [
  { label: "CDL-A", value: "CDL-A" },
  { label: "CDL-B", value: "CDL-B" },
  { label: "CDL-C", value: "CDL-C" },
  { label: "Standard", value: "Standard" },
];

const VEHICLE_ASSIGNMENT_OPTIONS = [
  { label: "Has vehicle", value: "assigned" },
  { label: "No vehicle", value: "unassigned" },
];

const STUDENTS_ASSIGNMENT_OPTIONS = [
  { label: "Has students", value: "with_students" },
  { label: "No students", value: "without_students" },
];

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: `Grade ${i + 1}`,
  value: String(i + 1),
}));

type TabId = "roster" | "students";

interface FlatStudentRow {
  id: string;
  studentNumber: string | null;
  studentName: string;
  grade: string | null;
  status: string;
  schoolName: string;
  driver: DriverStudentAssignment;
}

export default function DriversPage() {
  const can = usePermission();
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("roster");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [licenseClass, setLicenseClass] = useState("");
  const [vehicleAssignment, setVehicleAssignment] = useState("");
  const [studentsAssignment, setStudentsAssignment] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [studentStatus, setStudentStatus] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("employee_id");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  const canAssign = can("drivers.update") || can("vehicles.update");
  const canAssignStudents = can("students.update");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drivers", { search, status, licenseClass, vehicleAssignment, studentsAssignment, page, sortKey, sortDir }],
    queryFn: () =>
      listDrivers({
        search,
        status,
        license_class: licenseClass,
        vehicle_assignment: vehicleAssignment as "" | "assigned" | "unassigned",
        students_assignment: studentsAssignment as "" | "with_students" | "without_students",
        page,
        ...sortParams,
      }),
    enabled: tab === "roster",
  });

  const { data: assignments, isLoading: assignmentsLoading, isError: assignmentsError, refetch: refetchAssignments } = useQuery({
    queryKey: ["driver-student-assignments", { search, status, licenseClass, vehicleAssignment, studentsAssignment, driverFilter, schoolFilter, studentStatus, gradeFilter }],
    queryFn: () =>
      listDriverStudentAssignments({
        search,
        status,
        license_class: licenseClass,
        vehicle_assignment: vehicleAssignment as "" | "assigned" | "unassigned",
        students_assignment: studentsAssignment as "" | "with_students" | "without_students",
        driver_id: driverFilter,
        school_id: schoolFilter,
        student_status: studentStatus,
        grade: gradeFilter,
      }),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "all-for-assignment"],
    queryFn: () => listVehicles({ status: "active", per_page: 200 }),
  });

  const { data: allDrivers } = useQuery({
    queryKey: ["drivers", "picker"],
    queryFn: () => listDrivers({ status: "active", per_page: 200 }),
  });

  const { data: schoolsData } = useQuery({
    queryKey: ["schools", "filter-options-drivers"],
    queryFn: () => listSchools({ per_page: 200 }),
  });

  const vehicleOptions = useMemo(
    () => buildVehiclePickerOptions(vehiclesData?.data ?? []),
    [vehiclesData],
  );

  const driverPickerOptions = useMemo(
    () => buildDriverPickerOptions(allDrivers?.data ?? []),
    [allDrivers],
  );

  const schoolOptions = useMemo(
    () => (schoolsData?.data ?? []).map((s) => ({ label: s.name, value: s.id })),
    [schoolsData],
  );

  const driverFilterOptions = useMemo(
    () => (allDrivers?.data ?? []).map((d) => ({ label: `${d.first_name} ${d.last_name}`, value: d.id })),
    [allDrivers],
  );

  const flatStudentRows = useMemo<FlatStudentRow[]>(() => {
    if (!assignments) return [];
    const rows: FlatStudentRow[] = [];
    for (const driver of assignments) {
      for (const student of driver.students) {
        rows.push({
          id: student.id,
          studentNumber: student.student_number,
          studentName: `${student.first_name} ${student.last_name}`,
          grade: student.grade,
          status: student.status,
          schoolName: student.school?.name ?? "—",
          driver,
        });
      }
    }
    return rows;
  }, [assignments]);

  const studentTabCount = flatStudentRows.length;

  const vehicleAssignMutation = useMutation({
    mutationFn: ({ driverId, vehicleId }: { driverId: string; vehicleId: string | null }) =>
      assignDriverVehicle(driverId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toastSuccess("Vehicle assigned");
    },
    onError: (e) => toastError("Assignment failed", getApiErrorMessage(e, "Could not assign vehicle.")),
  });

  const studentAssignMutation = useMutation({
    mutationFn: ({ studentId, driverId }: { studentId: string; driverId: string | null }) =>
      assignStudentDriver(studentId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-student-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toastSuccess("Student assignment updated");
    },
    onError: (e) => toastError("Assignment failed", getApiErrorMessage(e, "Could not assign student.")),
  });

  const driverStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateDriverStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toastSuccess("Status updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update status.")),
  });

  const studentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStudentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-student-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toastSuccess("Status updated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e, "Could not update status.")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess("Driver deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete driver.")),
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setLicenseClass("");
    setVehicleAssignment("");
    setStudentsAssignment("");
    setDriverFilter("");
    setSchoolFilter("");
    setStudentStatus("");
    setGradeFilter("");
    setPage(1);
  };

  const handleDelete = async (driver: Driver) => {
    const ok = await confirmDelete(`${driver.first_name} ${driver.last_name}`);
    if (ok) removeMutation.mutate(driver.id);
  };

  const handleAssignVehicle = async (driver: Driver) => {
    if (!canAssign) return;
    const choice = await promptAssignVehicle(
      `${driver.first_name} ${driver.last_name}`,
      vehicleOptions,
      driver.default_vehicle?.id ?? driver.default_vehicle_id,
    );
    if (choice === false) return;
    vehicleAssignMutation.mutate({ driverId: driver.id, vehicleId: choice });
  };

  const handleReassignStudent = async (row: FlatStudentRow) => {
    if (!canAssignStudents) return;
    const choice = await promptAssignStudentDriver(row.studentName, driverPickerOptions, row.driver.id);
    if (choice === false) return;
    studentAssignMutation.mutate({ studentId: row.id, driverId: choice });
  };

  const handleDriverStatusChange = async (driver: Driver) => {
    if (!can("drivers.update")) return;
    const label = `${driver.first_name} ${driver.last_name}`;
    const choice = await promptChangeStatus(label, DRIVER_STATUS_OPTIONS, driver.status);
    if (choice === false || choice === driver.status) return;
    driverStatusMutation.mutate({ id: driver.id, status: choice });
  };

  const handleStudentStatusChange = async (row: FlatStudentRow) => {
    if (!can("students.update")) return;
    const choice = await promptChangeStatus(row.studentName, STUDENT_STATUS_OPTIONS, row.status);
    if (choice === false || choice === row.status) return;
    studentStatusMutation.mutate({ id: row.id, status: choice });
  };

  const handleViewStudent = async (studentId: string) => {
    try {
      const student = await getStudent(studentId);
      setViewingStudent(student);
      setStudentModalOpen(true);
    } catch (e) {
      toastError("Could not load student", getApiErrorMessage(e, "Student record unavailable."));
    }
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d.slice(0, 10)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const isExpiringSoon = (d: string | null | undefined) => {
    if (!d) return false;
    const diff = new Date(d.slice(0, 10)).getTime() - Date.now();
    return diff >= 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (d: string | null | undefined) => {
    if (!d) return false;
    return new Date(d.slice(0, 10)).getTime() < Date.now();
  };

  const rosterColumns: Column<Driver>[] = [
    idColumn("employee_id", (d) => d.employee_id),
    {
      key: "name",
      header: "Driver",
      primary: true,
      sortable: true,
      sortValue: (d) => `${d.last_name} ${d.first_name}`,
      render: (d) => (
        <div>
          <p className="font-medium text-slate-900">{d.first_name} {d.last_name}</p>
          <p className="text-xs text-slate-400">{d.license_class ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "license",
      header: "License",
      render: (d) => (
        <div>
          <p className="font-medium text-slate-800">{d.license_number ?? "—"}</p>
          <p className="text-xs text-slate-400">
            {[d.license_class, d.license_state].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      hideOnMobile: true,
      render: (d) => (
        <AssignmentChip
          label={d.default_vehicle?.vehicle_number ?? null}
          sublabel={d.default_vehicle ? formatVehicleType(d.default_vehicle.type) : undefined}
          emptyLabel="+ Assign vehicle"
          onClick={canAssign ? () => handleAssignVehicle(d) : undefined}
          disabled={vehicleAssignMutation.isPending}
        />
      ),
    },
    {
      key: "students",
      header: "Students",
      hideOnMobile: true,
      render: (d) => (
        <button
          type="button"
          onClick={() => { setTab("students"); setDriverFilter(d.id); }}
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          {d.students_count ?? 0} assigned
        </button>
      ),
    },
    { key: "phone", header: "Contact", hideOnMobile: true, render: (d) => <ContactCell phone={d.phone} email={d.email} /> },
    {
      key: "license_expiry",
      header: "License exp.",
      hideOnMobile: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{formatDate(d.license_expiry)}</span>
          {isExpired(d.license_expiry) && <Badge className="bg-red-50 text-red-700">Expired</Badge>}
          {!isExpired(d.license_expiry) && isExpiringSoon(d.license_expiry) && (
            <Badge className="bg-amber-50 text-amber-700">Soon</Badge>
          )}
        </div>
      ),
    },
    { key: "status", header: "Status", sortable: true, sortValue: (d) => d.status, render: (d) => (
      <StatusChip
        status={d.status}
        onClick={can("drivers.update") ? () => handleDriverStatusChange(d) : undefined}
        disabled={driverStatusMutation.isPending}
      />
    ) },
  ];

  const studentColumns: Column<FlatStudentRow>[] = [
    idColumn("student_number", (r) => r.studentNumber),
    {
      key: "driver",
      header: "Driver",
      primary: true,
      sortable: true,
      sortValue: (r) => `${r.driver.last_name} ${r.driver.first_name}`,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.driver.first_name} {r.driver.last_name}</p>
          <p className="text-xs text-slate-400">{r.driver.employee_id ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (r) =>
        r.driver.default_vehicle ? (
          <span className="text-sm text-slate-700">{r.driver.default_vehicle.vehicle_number}</span>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        ),
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      sortValue: (r) => r.studentName,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.studentName}</p>
          <p className="text-xs text-slate-400">{r.grade ? `Grade ${r.grade}` : "—"}</p>
        </div>
      ),
    },
    { key: "school", header: "School", hideOnMobile: true, render: (r) => r.schoolName },
    { key: "status", header: "Status", sortable: true, sortValue: (r) => r.status, render: (r) => (
      <StatusChip
        status={r.status}
        onClick={can("students.update") ? () => handleStudentStatusChange(r) : undefined}
        disabled={studentStatusMutation.isPending}
      />
    ) },
  ];

  const rosterFilters = [
    { key: "status", label: "Status", value: status, onChange: (v: string) => { setStatus(v); setPage(1); }, options: STATUS_OPTIONS },
    { key: "license_class", label: "License", value: licenseClass, onChange: (v: string) => { setLicenseClass(v); setPage(1); }, options: LICENSE_CLASS_OPTIONS },
    { key: "vehicle_assignment", label: "Vehicle", value: vehicleAssignment, onChange: (v: string) => { setVehicleAssignment(v); setPage(1); }, options: VEHICLE_ASSIGNMENT_OPTIONS },
    { key: "students_assignment", label: "Students", value: studentsAssignment, onChange: (v: string) => { setStudentsAssignment(v); setPage(1); }, options: STUDENTS_ASSIGNMENT_OPTIONS },
  ];

  const studentTabFilters = [
    { key: "driver_id", label: "Driver", value: driverFilter, onChange: setDriverFilter, options: driverFilterOptions },
    ...(isSchoolContact
      ? []
      : [{ key: "school_id", label: "School", value: schoolFilter, onChange: setSchoolFilter, options: schoolOptions }]),
    { key: "student_status", label: "Student status", value: studentStatus, onChange: setStudentStatus, options: STUDENT_STATUS_OPTIONS },
    { key: "grade", label: "Grade", value: gradeFilter, onChange: setGradeFilter, options: GRADE_OPTIONS },
    { key: "status", label: "Driver status", value: status, onChange: setStatus, options: STATUS_OPTIONS },
    { key: "vehicle_assignment", label: "Vehicle", value: vehicleAssignment, onChange: setVehicleAssignment, options: VEHICLE_ASSIGNMENT_OPTIONS },
    { key: "students_assignment", label: "Students", value: studentsAssignment, onChange: setStudentsAssignment, options: STUDENTS_ASSIGNMENT_OPTIONS },
    { key: "license_class", label: "License", value: licenseClass, onChange: setLicenseClass, options: LICENSE_CLASS_OPTIONS },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Drivers"
        description={
          isSchoolContact
            ? "Drivers assigned to your students and today's school runs — contact and license details."
            : "Manage drivers, vehicle assignments, student routes, licensing, and compliance."
        }
        action={can("drivers.create") && <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add driver</Button>}
      />

      <DriverStatRow />

      <PageTabs
        tabs={[
          { id: "roster", label: "Driver roster", count: data?.total },
          { id: "students", label: "Assigned students", count: studentTabCount },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={tab === "roster" ? "Search by name, ID, or email…" : "Search drivers or students…"}
        resultCount={tab === "roster" ? data?.total : studentTabCount}
        onClear={clearFilters}
        filters={tab === "roster" ? rosterFilters : studentTabFilters}
      />

      <ActiveFilterPills
        items={[
          ...(search ? [{ key: "search", label: `Search: ${search}` }] : []),
          ...(status ? [{ key: "status", label: `Driver status: ${titleCase(status)}` }] : []),
          ...(licenseClass ? [{ key: "license_class", label: `License: ${licenseClass}` }] : []),
          ...(vehicleAssignment ? [{ key: "vehicle_assignment", label: vehicleAssignment === "assigned" ? "Has vehicle" : "No vehicle" }] : []),
          ...(studentsAssignment ? [{ key: "students_assignment", label: studentsAssignment === "with_students" ? "Has students" : "No students" }] : []),
          ...(driverFilter ? [{ key: "driver_id", label: `Driver: ${driverFilterOptions.find((d) => d.value === driverFilter)?.label ?? "Selected"}` }] : []),
          ...(schoolFilter ? [{ key: "school_id", label: `School: ${schoolOptions.find((s) => s.value === schoolFilter)?.label ?? "Selected"}` }] : []),
          ...(studentStatus ? [{ key: "student_status", label: `Student: ${titleCase(studentStatus)}` }] : []),
          ...(gradeFilter ? [{ key: "grade", label: `Grade ${gradeFilter}` }] : []),
        ]}
        onRemove={(key) => {
          if (key === "search") setSearch("");
          if (key === "status") setStatus("");
          if (key === "license_class") setLicenseClass("");
          if (key === "vehicle_assignment") setVehicleAssignment("");
          if (key === "students_assignment") setStudentsAssignment("");
          if (key === "driver_id") setDriverFilter("");
          if (key === "school_id") setSchoolFilter("");
          if (key === "student_status") setStudentStatus("");
          if (key === "grade") setGradeFilter("");
          setPage(1);
        }}
      />

      {tab === "roster" && (
        <>
          <PageState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
            emptyMessage="No drivers match your filters."
          >
            <DataTable
              columns={rosterColumns}
              rows={data?.data ?? []}
              rowKey={(d) => d.id}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
              actions={(d) => (
                <RowActions
                  items={[
                    { label: "Assign vehicle", onClick: () => handleAssignVehicle(d), hidden: !canAssign },
                    { label: "Change status", onClick: () => handleDriverStatusChange(d), hidden: !can("drivers.update") },
                    { label: "View students", onClick: () => { setTab("students"); setDriverFilter(d.id); } },
                    { label: "Edit", onClick: () => { setEditing(d); setModalOpen(true); }, hidden: !can("drivers.update") },
                    { label: "Delete", variant: "danger" as const, onClick: () => handleDelete(d), hidden: !can("drivers.delete") },
                  ].filter((item) => !isSchoolContact || item.label === "View students")}
                />
              )}
            />
          </PageState>
          {data && data.last_page > 1 && (
            <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          )}
        </>
      )}

      {tab === "students" && (
        <PageState
          isLoading={assignmentsLoading}
          isError={assignmentsError}
          onRetry={() => refetchAssignments()}
          isEmpty={!assignmentsLoading && !assignmentsError && flatStudentRows.length === 0}
          emptyMessage="No student assignments match your filters."
        >
          <DataTable
            columns={studentColumns}
            rows={flatStudentRows}
            rowKey={(r) => r.id}
            defaultSortKey="student_number"
            actions={(r) => (
              <RowActions
                items={[
                  { label: "Change driver", onClick: () => handleReassignStudent(r), hidden: !canAssignStudents },
                  { label: "Change status", onClick: () => handleStudentStatusChange(r), hidden: !can("students.update") },
                  { label: "View student", onClick: () => handleViewStudent(r.id), hidden: !can("students.view") },
                ]}
              />
            )}
          />
          {!flatStudentRows.length && assignments?.length === 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">
              Assign students from the{" "}
              <Link href="/dashboard/students" className="font-semibold text-brand-primary hover:underline">Students</Link> page.
            </p>
          )}
        </PageState>
      )}

      <DriverFormModal open={modalOpen} onClose={() => setModalOpen(false)} driver={editing} />
      <StudentFormModal
        open={studentModalOpen}
        onClose={() => { setStudentModalOpen(false); setViewingStudent(null); }}
        student={viewingStudent}
      />
    </div>
  );
}
