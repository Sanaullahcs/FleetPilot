"use client";

import Link from "next/link";
import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createStudent, listDrivers, listSchools, updateStudent } from "@/lib/resources";
import { buildDriverPickerOptions } from "@/lib/picker-options";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { Student } from "@/lib/types";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";

const FORM_ID = "student-form-modal";

const schema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  student_number: z.string().optional(),
  grade: z.string().optional(),
  school_id: z.string().min(1, "Select the school this student attends."),
  assigned_driver_id: z.string().optional(),
  status: z.enum(["active", "inactive", "graduated", "transferred"]),
  has_iep: z.boolean().optional(),
  requires_wheelchair: z.boolean().optional(),
  requires_aide: z.boolean().optional(),
  emergency_contact_phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { label: "Active — receiving transportation", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Graduated", value: "graduated" },
  { label: "Transferred", value: "transferred" },
];

const fieldClass = "fp-input";

function schoolOptionLabel(name: string, code?: string | null, city?: string | null) {
  const meta = [code, city].filter(Boolean).join(" · ");
  return meta ? `${name} (${meta})` : name;
}

export function StudentFormModal({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(student);
  const user = useAuthStore((s) => s.user);
  const isSchoolContact = user?.role === "school_contact";
  const lockedSchoolId = isSchoolContact ? user?.school_id ?? "" : "";

  const schoolsQuery = useQuery({
    queryKey: ["schools", "picker"],
    queryFn: () => listSchools({ per_page: 200 }),
    enabled: open,
    staleTime: 30_000,
  });

  const driversQuery = useQuery({
    queryKey: ["drivers", "active-for-students"],
    queryFn: () => listDrivers({ status: "active", per_page: 200 }),
    enabled: open,
    staleTime: 30_000,
  });

  const schoolOptions = useMemo(() => {
    const schools = schoolsQuery.data?.data ?? [];
    const scoped = lockedSchoolId ? schools.filter((s) => s.id === lockedSchoolId) : schools;
    return scoped.map((s) => ({
      label: schoolOptionLabel(s.name, s.code, s.city),
      value: s.id,
    }));
  }, [schoolsQuery.data, lockedSchoolId]);

  const driverOptions = useMemo(
    () =>
      buildDriverPickerOptions(driversQuery.data?.data ?? []).map((d) => ({
        label: d.label,
        value: d.id,
        sublabel: d.sublabel,
        meta: d.meta,
        searchText: d.searchText,
      })),
    [driversQuery.data],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: student?.first_name ?? "",
      last_name: student?.last_name ?? "",
      student_number: student?.student_number ?? "",
      grade: student?.grade ?? "",
      school_id: student?.school?.id ?? lockedSchoolId ?? "",
      assigned_driver_id: student?.assigned_driver?.id ?? "",
      status: (student?.status as FormValues["status"]) ?? "active",
      has_iep: student?.has_iep ?? false,
      requires_wheelchair: student?.requires_wheelchair ?? false,
      requires_aide: student?.requires_aide ?? false,
      emergency_contact_phone: student?.emergency_contact_phone ?? "",
    },
  });

  const selectedSchoolId = watch("school_id");
  const selectedSchool = (schoolsQuery.data?.data ?? []).find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (open && lockedSchoolId) {
      setValue("school_id", lockedSchoolId, { shouldValidate: true });
    }
  }, [open, lockedSchoolId, setValue]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        assigned_driver_id: values.assigned_driver_id || null,
      };
      return isEdit && student ? updateStudent(student.id, payload) : createStudent(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver-student-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess(isEdit ? "Student updated" : "Student enrolled");
      reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save student.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  const schoolsLoading = schoolsQuery.isLoading;
  const schoolsEmpty = !schoolsLoading && !schoolsQuery.isError && schoolOptions.length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Student Enrollment" : "Enroll Student"}
      description="Register a student for school transportation — link them to their school, route driver, and special needs."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? "Save Changes" : "Enroll Student"}
          submitForm={FORM_ID}
          pending={isSubmitting || mutation.isPending}
          disabled={schoolsEmpty}
        />
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit((v) => { setServerError(null); mutation.mutate(v); })}
        className="space-y-6"
        noValidate
      >
        {/* School first — core to transportation workflow */}
        <FormSection
          title="Serving School"
          description="Which school does this student attend? Routes and bell times are organized by school."
        >
          {schoolsQuery.isError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Could not load schools.{" "}
              <button type="button" className="font-semibold underline" onClick={() => schoolsQuery.refetch()}>
                Retry
              </button>
            </div>
          )}

          {schoolsEmpty && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No schools in your organization yet.{" "}
              <Link href="/dashboard/schools" className="font-semibold text-brand-primary hover:underline" onClick={onClose}>
                Add a school first
              </Link>
              , then return to enroll students.
            </div>
          )}

          <Field label="School" required error={errors.school_id?.message}>
            <SearchableSelect
              value={watch("school_id") ?? ""}
              onChange={(v) => {
                setValue("school_id", v, { shouldValidate: true });
                setValue("assigned_driver_id", "");
              }}
              options={schoolOptions}
              showAllOption={false}
              placeholder={
                schoolsLoading
                  ? "Loading schools…"
                  : schoolsEmpty
                    ? "No schools available"
                    : "Select serving school"
              }
              searchPlaceholder="Search by name, code, or city…"
              emptyMessage="No schools found — add schools under Schools in the sidebar"
              disabled={schoolsLoading || schoolsEmpty || (!!lockedSchoolId && isSchoolContact)}
            />
            {isSchoolContact && lockedSchoolId ? (
              <p className="mt-2 text-xs text-slate-500">Students are enrolled at your assigned school.</p>
            ) : null}
            {selectedSchool && (
              <div className="mt-2 rounded-lg border border-brand-primary/15 bg-brand-primary/5 px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-brand-primary">{selectedSchool.name}</span>
                {[selectedSchool.district, selectedSchool.grade_levels].filter(Boolean).length > 0 && (
                  <span className="ml-1">
                    · {[selectedSchool.district, selectedSchool.grade_levels].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            )}
          </Field>
        </FormSection>

        <FormSection title="Student Profile" description="Identity and grade level for routing and manifests.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required error={errors.first_name?.message}>
              <input className={fieldClass} autoComplete="given-name" {...register("first_name")} />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <input className={fieldClass} autoComplete="family-name" {...register("last_name")} />
            </Field>
            <Field label="Student ID #" hint="District or internal student number">
              <input className={fieldClass} {...register("student_number")} />
            </Field>
            <Field label="Grade">
              <input className={fieldClass} placeholder="K, 1, 2…" {...register("grade")} />
            </Field>
            <Field label="Transportation Status">
              <SearchableSelect
                value={watch("status")}
                onChange={(v) => setValue("status", v as FormValues["status"])}
                options={STATUS_OPTIONS}
                showAllOption={false}
                placeholder="Select status"
                searchPlaceholder="Search status…"
              />
            </Field>
            <Field label="Emergency Contact phone" className="sm:col-span-2">
              <input type="tel" className={fieldClass} {...register("emergency_contact_phone")} />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Route Driver"
          description="Assign the driver who will transport this student. You can change this when routes are updated."
        >
          <Field
            label="Assigned Driver"
            hint={selectedSchoolId ? "Optional — assign now or later from the driver roster" : "Select a school first"}
            error={errors.assigned_driver_id?.message}
          >
            <SearchableSelect
              value={watch("assigned_driver_id") ?? ""}
              onChange={(v) => setValue("assigned_driver_id", v)}
              options={driverOptions}
              showAllOption
              allLabel="Not assigned yet"
              placeholder={
                !selectedSchoolId
                  ? "Select a school first"
                  : driversQuery.isLoading
                    ? "Loading drivers…"
                    : "Select route driver (optional)"
              }
              searchPlaceholder="Search drivers…"
              emptyMessage="No active drivers — add drivers under Drivers in the sidebar"
              disabled={!selectedSchoolId || driversQuery.isLoading}
            />
          </Field>
        </FormSection>

        <FormSection title="Special Transportation Needs" description="Accommodations for routing and vehicle assignment.">
          <div className="flex flex-wrap gap-3">
            {[
              { key: "has_iep" as const, label: "IEP on File" },
              { key: "requires_wheelchair" as const, label: "Wheelchair Lift Required" },
              { key: "requires_aide" as const, label: "Monitor / aide required" },
            ].map((item) => (
              <label
                key={item.key}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-700"
              >
                <input type="checkbox" {...register(item.key)} className="rounded border-slate-300 text-brand-accent" />
                {item.label}
              </label>
            ))}
          </div>
        </FormSection>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Modal>
  );
}
