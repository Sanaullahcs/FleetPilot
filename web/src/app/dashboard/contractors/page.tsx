"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Button, Badge, Spinner } from "@/components/ui/primitives";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { Modal } from "@/components/ui/modal";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import {
  addContractorAssignment,
  createContractor,
  deleteContractor,
  getContractor,
  getContractorOptions,
  getContractorStats,
  listContractors,
  removeContractorAssignment,
  updateContractor,
} from "@/lib/resources";
import { useTableSort } from "@/lib/table-utils";
import type { Contractor } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Pending / inactive" },
];

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`fp-card px-4 py-3 ${accent ? "ring-2 ring-brand-primary/20" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function statusBadge(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
}

const EMPTY_CREATE = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  business_type: "",
  tax_id: "",
  fleet_size: "",
  driver_count: "",
  vehicle_count: "",
  years_in_business: "",
  coverage_areas: "",
  service_radius_miles: "",
  insurance_carrier: "",
  insurance_policy_number: "",
  dot_number: "",
  mc_number: "",
  password: "",
  password_confirmation: "",
};

function CreateContractorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_CREATE });

  const mutation = useMutation({
    mutationFn: () =>
      createContractor({
        ...form,
        fleet_size: form.fleet_size ? Number(form.fleet_size) : undefined,
        driver_count: form.driver_count ? Number(form.driver_count) : undefined,
        vehicle_count: form.vehicle_count ? Number(form.vehicle_count) : undefined,
        years_in_business: form.years_in_business ? Number(form.years_in_business) : undefined,
        service_radius_miles: form.service_radius_miles ? Number(form.service_radius_miles) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-stats"] });
      toastSuccess("Contractor created", "They can sign in and operate the schools/routes you assign.");
      setForm({ ...EMPTY_CREATE });
      onClose();
    },
    onError: (e) => toastError("Create failed", getApiErrorMessage(e)),
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.password === form.password_confirmation;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Add Contractor"
      description="Create a contractor account. They sign in immediately and only see the schools/routes you assign."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create Contractor"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name *">
          <input className="fp-input" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} />
        </Field>
        <Field label="Last Name *">
          <input className="fp-input" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
        </Field>
        <Field label="Email *">
          <input type="email" className="fp-input" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input type="tel" className="fp-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Company Name" className="sm:col-span-2">
          <input className="fp-input" placeholder="Owens Transit LLC" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
        </Field>
        <Field label="Business Type">
          <input className="fp-input" placeholder="LLC, Corp…" value={form.business_type} onChange={(e) => set("business_type", e.target.value)} />
        </Field>
        <Field label="Tax ID / EIN">
          <input className="fp-input" value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} />
        </Field>
        <Field label="Fleet Size">
          <input type="number" min={0} className="fp-input" value={form.fleet_size} onChange={(e) => set("fleet_size", e.target.value)} />
        </Field>
        <Field label="Number of Drivers">
          <input type="number" min={0} className="fp-input" value={form.driver_count} onChange={(e) => set("driver_count", e.target.value)} />
        </Field>
        <Field label="Number of Vehicles">
          <input type="number" min={0} className="fp-input" value={form.vehicle_count} onChange={(e) => set("vehicle_count", e.target.value)} />
        </Field>
        <Field label="Years in Business">
          <input type="number" min={0} className="fp-input" value={form.years_in_business} onChange={(e) => set("years_in_business", e.target.value)} />
        </Field>
        <Field label="Service Radius (Miles)">
          <input type="number" min={0} className="fp-input" value={form.service_radius_miles} onChange={(e) => set("service_radius_miles", e.target.value)} />
        </Field>
        <Field label="Insurance Carrier">
          <input className="fp-input" value={form.insurance_carrier} onChange={(e) => set("insurance_carrier", e.target.value)} />
        </Field>
        <Field label="Insurance Policy #">
          <input className="fp-input" value={form.insurance_policy_number} onChange={(e) => set("insurance_policy_number", e.target.value)} />
        </Field>
        <Field label="DOT Number">
          <input className="fp-input" value={form.dot_number} onChange={(e) => set("dot_number", e.target.value)} />
        </Field>
        <Field label="MC Number">
          <input className="fp-input" value={form.mc_number} onChange={(e) => set("mc_number", e.target.value)} />
        </Field>
        <Field label="Coverage Areas" className="sm:col-span-2">
          <textarea className="fp-input min-h-[4rem] resize-y" placeholder="Counties, cities, or regions served" value={form.coverage_areas} onChange={(e) => set("coverage_areas", e.target.value)} />
        </Field>
        <Field label="Password *" hint="Minimum 8 characters">
          <input type="password" className="fp-input" value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="Confirm Password *">
          <input type="password" className="fp-input" value={form.password_confirmation} onChange={(e) => set("password_confirmation", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function ManageContractorModal({
  contractorId,
  open,
  onClose,
}: {
  contractorId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"school" | "route">("school");
  const [schoolId, setSchoolId] = useState("");
  const [routeId, setRouteId] = useState("");

  const detailQuery = useQuery({
    queryKey: ["contractor", contractorId],
    queryFn: () => getContractor(contractorId!),
    enabled: open && !!contractorId,
  });

  const optionsQuery = useQuery({
    queryKey: ["contractor-options", contractorId],
    queryFn: () => getContractorOptions(contractorId!),
    enabled: open && !!contractorId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["contractor", contractorId] });
    queryClient.invalidateQueries({ queryKey: ["contractor-options", contractorId] });
    queryClient.invalidateQueries({ queryKey: ["contractors"] });
    queryClient.invalidateQueries({ queryKey: ["contractor-stats"] });
  };

  const addMutation = useMutation({
    mutationFn: (payload: { type: "school" | "route"; school_id?: string; route_id?: string }) =>
      addContractorAssignment(contractorId!, payload),
    onSuccess: () => {
      invalidate();
      setSchoolId("");
      setRouteId("");
      toastSuccess("Assignment added");
    },
    onError: (e) => toastError("Could not add assignment", getApiErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: removeContractorAssignment,
    onSuccess: () => {
      invalidate();
      toastSuccess("Assignment removed");
    },
    onError: (e) => toastError("Could not remove", getApiErrorMessage(e)),
  });

  const schoolOptions = useMemo(
    () =>
      (optionsQuery.data?.schools ?? [])
        .filter((s) => !s.assigned)
        .map((s) => ({ value: s.id, label: s.code ? `${s.name} (${s.code})` : s.name })),
    [optionsQuery.data],
  );
  const routeOptions = useMemo(
    () =>
      (optionsQuery.data?.routes ?? [])
        .filter((r) => !r.assigned)
        .map((r) => ({ value: r.id, label: `${r.name}${r.school?.name ? ` · ${r.school.name}` : ""}` })),
    [optionsQuery.data],
  );

  const assignments = detailQuery.data?.contractor_assignments ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={detailQuery.data ? `${detailQuery.data.first_name} ${detailQuery.data.last_name}` : "Manage contractor"}
      description={detailQuery.data?.job_title ?? detailQuery.data?.email ?? "Assign schools and routes"}
    >
      {detailQuery.isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {detailQuery.data && (
        <div className="space-y-6">
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Delegate work</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("school")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === "school" ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Whole school
              </button>
              <button
                type="button"
                onClick={() => setTab("route")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === "route" ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Single route
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              {tab === "school" ? (
                <>
                  <div className="flex-1">
                    <SearchableSelect
                      value={schoolId}
                      onChange={setSchoolId}
                      options={schoolOptions}
                      placeholder={schoolOptions.length ? "Select a school" : "All schools assigned"}
                      showAllOption={false}
                    />
                  </div>
                  <Button
                    onClick={() => addMutation.mutate({ type: "school", school_id: schoolId })}
                    disabled={!schoolId || addMutation.isPending}
                  >
                    Assign school
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <SearchableSelect
                      value={routeId}
                      onChange={setRouteId}
                      options={routeOptions}
                      placeholder={routeOptions.length ? "Select a route" : "All routes assigned"}
                      showAllOption={false}
                    />
                  </div>
                  <Button
                    onClick={() => addMutation.mutate({ type: "route", route_id: routeId })}
                    disabled={!routeId || addMutation.isPending}
                  >
                    Assign route
                  </Button>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Assigning a school grants every route at that campus. Assign a single route for partial coverage.
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Current assignments ({assignments.length})
            </h4>
            {assignments.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No schools or routes assigned yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-150 bg-white px-4 py-2.5 shadow-sm"
                  >
                    <div className="min-w-0">
                      {a.school ? (
                        <>
                          <p className="truncate text-sm font-semibold text-slate-900">{a.school.name}</p>
                          <p className="text-xs text-slate-400">Whole school · all routes</p>
                        </>
                      ) : (
                        <>
                          <p className="truncate text-sm font-semibold text-slate-900">{a.route?.name}</p>
                          <p className="text-xs text-slate-400">
                            Route{a.route?.school?.name ? ` · ${a.route.school.name}` : ""}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={a.school ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "bg-violet-50 text-violet-700 ring-1 ring-violet-200"}>
                        {a.school ? "School" : "Route"}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(a.id)}
                        disabled={removeMutation.isPending}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove assignment"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function ContractorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("last_name", "asc");

  const statsQuery = useQuery({ queryKey: ["contractor-stats"], queryFn: getContractorStats });

  const listQuery = useQuery({
    queryKey: ["contractors", { search, status, page, sortKey, sortDir }],
    queryFn: () =>
      listContractors({
        search,
        is_active: status === "" ? undefined : status === "true",
        page,
        ...sortParams,
      }),
    placeholderData: keepPreviousData,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateContractor(id, { is_active }),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-stats"] });
      toastSuccess(v.is_active ? "Contractor activated" : "Contractor deactivated");
    },
    onError: (e) => toastError("Update failed", getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-stats"] });
      toastSuccess("Contractor removed");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e)),
  });

  const handleDelete = async (c: Contractor) => {
    const ok = await confirmDelete(`${c.first_name} ${c.last_name}`);
    if (ok) deleteMutation.mutate(c.id);
  };

  const columns: Column<Contractor>[] = [
    {
      key: "last_name",
      header: "Contractor",
      primary: true,
      sortable: true,
      sortValue: (c) => `${c.last_name} ${c.first_name}`,
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">
            {c.first_name} {c.last_name}
          </p>
          <p className="text-xs text-slate-400">{c.job_title || c.email}</p>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      sortValue: (c) => (c.is_active ? "1" : "0"),
      render: (c) => <Badge className={statusBadge(c.is_active)}>{c.is_active ? "Active" : "Pending"}</Badge>,
    },
    {
      key: "schools_count",
      header: "Schools",
      hideOnMobile: true,
      render: (c) => c.schools_count ?? 0,
    },
    {
      key: "routes_count",
      header: "Routes",
      hideOnMobile: true,
      render: (c) => c.routes_count ?? 0,
    },
    {
      key: "fleet",
      header: "Fleet",
      hideOnMobile: true,
      render: (c) => (
        <span className="text-slate-600">
          {c.owned_drivers_count ?? 0} drv · {c.owned_vehicles_count ?? 0} veh
        </span>
      ),
    },
  ];

  const stats = statsQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contractors"
        description="Delegate specific schools and routes to outside contractors. Schools always work through you, never directly with contractors."
        action={<Button onClick={() => setCreateOpen(true)}>Add Contractor</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={stats?.total ?? 0} />
        <StatCard label="Active" value={stats?.active ?? 0} accent={(stats?.active ?? 0) > 0} />
        <StatCard label="Pending" value={stats?.pending ?? 0} />
        <StatCard label="Schools Assigned" value={stats?.assigned_schools ?? 0} />
        <StatCard label="Routes Assigned" value={stats?.assigned_routes ?? 0} />
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search contractors…"
        resultCount={listQuery.data?.total}
        onClear={() => {
          setSearch("");
          setStatus("");
          setPage(1);
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            options: STATUS_OPTIONS,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
        ]}
      />

      <PageState
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        isEmpty={!listQuery.isLoading && !listQuery.isError && (listQuery.data?.data.length ?? 0) === 0}
        emptyMessage="No contractors yet. Add one or wait for a contractor to sign up."
        onRetry={() => listQuery.refetch()}
      >
        <DataTable
          columns={columns}
          rows={listQuery.data?.data ?? []}
          rowKey={(c) => c.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => {
            onSortChange(key, dir);
            setPage(1);
          }}
          actions={(c) => (
            <RowActions
              items={[
                { label: "Manage Assignments", onClick: () => setManageId(c.id) },
                {
                  label: c.is_active ? "Deactivate" : "Activate",
                  onClick: () => toggleMutation.mutate({ id: c.id, is_active: !c.is_active }),
                },
                { label: "Remove", onClick: () => handleDelete(c), variant: "danger" as const },
              ]}
            />
          )}
        />
      </PageState>

      {listQuery.data && listQuery.data.last_page > 1 && (
        <Pagination
          page={listQuery.data.current_page}
          lastPage={listQuery.data.last_page}
          total={listQuery.data.total}
          onPageChange={setPage}
        />
      )}

      <CreateContractorModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ManageContractorModal contractorId={manageId} open={!!manageId} onClose={() => setManageId(null)} />
    </div>
  );
}
