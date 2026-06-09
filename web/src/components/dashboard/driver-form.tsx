"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createDriver, listVehicles, updateDriver } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { CDL_ENDORSEMENTS, LICENSE_CLASSES, US_STATES } from "@/lib/us-states";
import type { Driver } from "@/lib/types";

const FORM_ID = "driver-form-modal";

const schema = z.object({
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  employee_id: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  license_number: z.string().min(1, "License number is required."),
  license_class: z.string().min(1, "License class is required."),
  license_state: z.string().optional(),
  license_expiry: z.string().min(1, "License expiry is required."),
  endorsements: z.array(z.string()).optional(),
  hire_date: z.string().optional(),
  medical_cert_expiry: z.string().optional(),
  background_check_date: z.string().optional(),
  drug_test_date: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]),
  notes: z.string().optional(),
  vehicle_mode: z.enum(["none", "existing", "new"]),
  default_vehicle_id: z.string().optional(),
  new_vehicle_number: z.string().optional(),
  new_vehicle_type: z.enum(["bus", "van", "minivan", "sedan", "wheelchair_van"]).optional(),
  new_vehicle_capacity: z.string().optional(),
  new_vehicle_make: z.string().optional(),
  new_vehicle_model: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.vehicle_mode === "existing" && !data.default_vehicle_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a vehicle.", path: ["default_vehicle_id"] });
  }
  if (data.vehicle_mode === "new") {
    if (!data.new_vehicle_number?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vehicle number is required.", path: ["new_vehicle_number"] });
    }
    if (!data.new_vehicle_type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vehicle type is required.", path: ["new_vehicle_type"] });
    }
  }
});

type FormValues = z.infer<typeof schema>;

const fieldClass = "fp-input";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "On leave", value: "on_leave" },
  { label: "Terminated", value: "terminated" },
];

const VEHICLE_TYPE_OPTIONS = [
  { label: "Bus", value: "bus" },
  { label: "Van", value: "van" },
  { label: "Minivan", value: "minivan" },
  { label: "Sedan", value: "sedan" },
  { label: "Wheelchair van", value: "wheelchair_van" },
];

function emptyDate(v: string | null | undefined) {
  if (!v) return "";
  return v.slice(0, 10);
}

export function DriverFormModal({
  open,
  onClose,
  driver,
}: {
  open: boolean;
  onClose: () => void;
  driver?: Driver | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(driver);

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "for-driver-assign"],
    queryFn: () => listVehicles({ status: "active", per_page: 100 }),
    enabled: open,
  });

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
      first_name: driver?.first_name ?? "",
      last_name: driver?.last_name ?? "",
      employee_id: driver?.employee_id ?? "",
      email: driver?.email ?? "",
      phone: driver?.phone ?? "",
      date_of_birth: emptyDate(driver?.date_of_birth),
      address: driver?.address ?? "",
      license_number: driver?.license_number ?? "",
      license_class: driver?.license_class ?? "",
      license_state: driver?.license_state ?? "",
      license_expiry: emptyDate(driver?.license_expiry),
      endorsements: driver?.endorsements ?? [],
      hire_date: emptyDate(driver?.hire_date),
      medical_cert_expiry: emptyDate(driver?.medical_cert_expiry),
      background_check_date: emptyDate(driver?.background_check_date),
      drug_test_date: emptyDate(driver?.drug_test_date),
      emergency_contact_name: driver?.emergency_contact_name ?? "",
      emergency_contact_phone: driver?.emergency_contact_phone ?? "",
      status: (driver?.status as FormValues["status"]) ?? "active",
      notes: driver?.notes ?? "",
      vehicle_mode: driver?.default_vehicle_id ? "existing" : "none",
      default_vehicle_id: driver?.default_vehicle_id ?? driver?.default_vehicle?.id ?? "",
      new_vehicle_number: "",
      new_vehicle_type: "bus",
      new_vehicle_capacity: "",
      new_vehicle_make: "",
      new_vehicle_model: "",
    },
  });

  const vehicleMode = watch("vehicle_mode");
  const selectedVehicleId = watch("default_vehicle_id");
  const selectedVehicle = (vehicles?.data ?? []).find((v) => v.id === selectedVehicleId)
    ?? (driver?.default_vehicle?.id === selectedVehicleId ? driver?.default_vehicle : null);

  const endorsements = watch("endorsements") ?? [];

  const toggleEndorsement = (code: string) => {
    const next = endorsements.includes(code)
      ? endorsements.filter((c) => c !== code)
      : [...endorsements, code];
    setValue("endorsements", next);
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const {
        vehicle_mode,
        default_vehicle_id,
        new_vehicle_number,
        new_vehicle_type,
        new_vehicle_capacity,
        new_vehicle_make,
        new_vehicle_model,
        ...rest
      } = values;

      const payload: Parameters<typeof createDriver>[0] = {
        ...rest,
        email: values.email || undefined,
        endorsements: values.endorsements?.length ? values.endorsements : undefined,
      };

      if (vehicle_mode === "existing" && default_vehicle_id) {
        payload.default_vehicle_id = default_vehicle_id;
      } else if (vehicle_mode === "new" && new_vehicle_number && new_vehicle_type) {
        payload.vehicle = {
          vehicle_number: new_vehicle_number,
          type: new_vehicle_type,
          capacity: new_vehicle_capacity ? Number(new_vehicle_capacity) : undefined,
          make: new_vehicle_make || undefined,
          model: new_vehicle_model || undefined,
        };
      } else if (vehicle_mode === "none") {
        payload.default_vehicle_id = null;
      }

      return isEdit && driver ? updateDriver(driver.id, payload) : createDriver(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess(isEdit ? "Driver updated" : "Driver created");
      reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save driver.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit driver" : "Add driver"}
      description="Complete profile with license, vehicle assignment, and compliance."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? "Save changes" : "Create driver"}
          submitForm={FORM_ID}
          pending={isSubmitting || mutation.isPending}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <FormSection title="Personal information" description="Basic identity and contact details.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name" required error={errors.first_name?.message}>
              <input className={fieldClass} autoComplete="given-name" {...register("first_name")} />
            </Field>
            <Field label="Last name" required error={errors.last_name?.message}>
              <input className={fieldClass} autoComplete="family-name" {...register("last_name")} />
            </Field>
            <Field label="Employee ID" hint="Unique ID within your organization">
              <input className={fieldClass} placeholder="DRV-001" {...register("employee_id")} />
            </Field>
            <Field label="Date of birth">
              <input type="date" className={fieldClass} {...register("date_of_birth")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" className={fieldClass} autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Phone">
              <input type="tel" className={fieldClass} autoComplete="tel" placeholder="(555) 555-0100" {...register("phone")} />
            </Field>
            <Field label="Home address" className="sm:col-span-2">
              <input className={fieldClass} autoComplete="street-address" placeholder="123 Main St, City, ST" {...register("address")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Driver's license & CDL" description="Commercial license details required for route assignment.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="License number" required error={errors.license_number?.message}>
              <input className={fieldClass} placeholder="D1234567" autoComplete="off" {...register("license_number")} />
            </Field>
            <Field label="License class" required error={errors.license_class?.message}>
              <SearchableSelect
                value={watch("license_class")}
                onChange={(v) => setValue("license_class", v, { shouldValidate: true })}
                options={LICENSE_CLASSES}
                showAllOption={false}
                placeholder="Select class"
                searchPlaceholder="Search license class…"
              />
            </Field>
            <Field label="Issuing state">
              <SearchableSelect
                value={watch("license_state") ?? ""}
                onChange={(v) => setValue("license_state", v)}
                options={US_STATES}
                allLabel="— Not set —"
                placeholder="Select state"
                searchPlaceholder="Search state…"
              />
            </Field>
            <Field label="License expiry" required error={errors.license_expiry?.message}>
              <input type="date" className={fieldClass} {...register("license_expiry")} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">CDL endorsements</p>
              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                {CDL_ENDORSEMENTS.map((e) => (
                  <label
                    key={e.code}
                    className={
                      endorsements.includes(e.code)
                        ? "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-accent/40 bg-brand-accent-light px-3 py-1.5 text-xs font-semibold text-brand-accent-dark"
                        : "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={endorsements.includes(e.code)}
                      onChange={() => toggleEndorsement(e.code)}
                      className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
                    />
                    {e.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Vehicle assignment"
          description="Assign an existing fleet vehicle or register a new one for this driver."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "none" as const, label: "No vehicle" },
                { value: "existing" as const, label: "Existing vehicle" },
                { value: "new" as const, label: "Add new vehicle" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("vehicle_mode", opt.value)}
                  className={
                    vehicleMode === opt.value
                      ? "rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-4 py-2 text-sm font-semibold text-brand-primary"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {vehicleMode === "existing" && (
              <Field label="Fleet vehicle" required error={errors.default_vehicle_id?.message}>
                <SearchableSelect
                  value={selectedVehicleId ?? ""}
                  onChange={(v) => setValue("default_vehicle_id", v, { shouldValidate: true })}
                  options={(vehicles?.data ?? []).map((v) => ({
                    label: `${v.vehicle_number} · ${v.type.replace("_", " ")}`,
                    value: v.id,
                  }))}
                  showAllOption={false}
                  placeholder="Select vehicle"
                  searchPlaceholder="Search vehicles…"
                />
                {selectedVehicle && (
                  <p className="mt-1 text-xs text-slate-500">
                    {"capacity" in selectedVehicle && selectedVehicle.capacity != null
                      ? `Capacity ${selectedVehicle.capacity} · `
                      : ""}
                    Status {selectedVehicle.status}
                  </p>
                )}
              </Field>
            )}

            {vehicleMode === "new" && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-dashed border-brand-cyan/30 bg-brand-cyan/5 p-4 sm:grid-cols-2">
                <Field label="Vehicle number" required error={errors.new_vehicle_number?.message}>
                  <input className={fieldClass} placeholder="BUS-104" {...register("new_vehicle_number")} />
                </Field>
                <Field label="Type" required error={errors.new_vehicle_type?.message}>
                  <SearchableSelect
                    value={watch("new_vehicle_type") ?? "bus"}
                    onChange={(v) => setValue("new_vehicle_type", v as FormValues["new_vehicle_type"], { shouldValidate: true })}
                    options={VEHICLE_TYPE_OPTIONS}
                    showAllOption={false}
                    placeholder="Select type"
                    searchPlaceholder="Search type…"
                  />
                </Field>
                <Field label="Capacity">
                  <input type="number" className={fieldClass} min={1} {...register("new_vehicle_capacity")} />
                </Field>
                <Field label="Make">
                  <input className={fieldClass} {...register("new_vehicle_make")} />
                </Field>
                <Field label="Model" className="sm:col-span-2">
                  <input className={fieldClass} {...register("new_vehicle_model")} />
                </Field>
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Employment & compliance" description="Hire date, medical certification, and screening records.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hire date">
              <input type="date" className={fieldClass} {...register("hire_date")} />
            </Field>
            <Field label="Employment status">
              <SearchableSelect
                value={watch("status")}
                onChange={(v) => setValue("status", v as FormValues["status"])}
                options={STATUS_OPTIONS}
                showAllOption={false}
                placeholder="Select status"
                searchPlaceholder="Search status…"
              />
            </Field>
            <Field label="DOT medical cert expiry" hint="Required for CDL drivers">
              <input type="date" className={fieldClass} {...register("medical_cert_expiry")} />
            </Field>
            <Field label="Background check date">
              <input type="date" className={fieldClass} {...register("background_check_date")} />
            </Field>
            <Field label="Last drug test date">
              <input type="date" className={fieldClass} {...register("drug_test_date")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Emergency contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name">
              <input className={fieldClass} autoComplete="name" {...register("emergency_contact_name")} />
            </Field>
            <Field label="Contact phone">
              <input type="tel" className={fieldClass} autoComplete="tel" {...register("emergency_contact_phone")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Internal notes">
          <Field label="Notes" hint="Dispatch-only notes — not visible to drivers">
            <textarea
              className={`${fieldClass} min-h-[88px] resize-y`}
              rows={3}
              placeholder="Special accommodations, route preferences, training reminders…"
              {...register("notes")}
            />
          </Field>
        </FormSection>

        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Modal>
  );
}
