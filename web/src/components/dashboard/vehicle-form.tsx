"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createVehicle, updateVehicle } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { Vehicle } from "@/lib/types";

const FORM_ID = "vehicle-form-modal";

const schema = z.object({
  vehicle_number: z.string().min(1, "Vehicle number is required."),
  type: z.enum(["bus", "van", "minivan", "sedan", "wheelchair_van"]),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  capacity: z.string().optional(),
  wheelchair_capacity: z.string().optional(),
  license_plate: z.string().optional(),
  vin: z.string().max(17).optional(),
  status: z.enum(["active", "maintenance", "retired", "out_of_service"]),
  fuel_type: z.enum(["diesel", "gas", "electric", "hybrid"]).optional().or(z.literal("")),
  cost_per_mile: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { label: "Bus", value: "bus" },
  { label: "Van", value: "van" },
  { label: "Minivan", value: "minivan" },
  { label: "Sedan", value: "sedan" },
  { label: "Wheelchair van", value: "wheelchair_van" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Out of service", value: "out_of_service" },
  { label: "Retired", value: "retired" },
];

const FUEL_OPTIONS = [
  { label: "Diesel", value: "diesel" },
  { label: "Gas", value: "gas" },
  { label: "Electric", value: "electric" },
  { label: "Hybrid", value: "hybrid" },
];

const fieldClass = "fp-input";

export function VehicleFormModal({
  open,
  onClose,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(vehicle);

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
      vehicle_number: vehicle?.vehicle_number ?? "",
      type: (vehicle?.type as FormValues["type"]) ?? "bus",
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ? String(vehicle.year) : "",
      capacity: vehicle?.capacity != null ? String(vehicle.capacity) : "",
      wheelchair_capacity: vehicle?.wheelchair_capacity != null ? String(vehicle.wheelchair_capacity) : "0",
      license_plate: vehicle?.license_plate ?? "",
      vin: "",
      status: (vehicle?.status as FormValues["status"]) ?? "active",
      fuel_type: (vehicle?.fuel_type as FormValues["fuel_type"]) ?? "",
      cost_per_mile: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        year: values.year ? Number(values.year) : null,
        capacity: values.capacity ? Number(values.capacity) : null,
        wheelchair_capacity: values.wheelchair_capacity ? Number(values.wheelchair_capacity) : 0,
        fuel_type: values.fuel_type || null,
        cost_per_mile: values.cost_per_mile ? Number(values.cost_per_mile) : null,
      };
      return isEdit && vehicle ? updateVehicle(vehicle.id, payload) : createVehicle(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess(isEdit ? "Vehicle updated" : "Vehicle created");
      reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save vehicle.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit vehicle" : "Add vehicle"}
      description="Fleet unit details, capacity, and service status."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? "Save changes" : "Create vehicle"}
          submitForm={FORM_ID}
          pending={isSubmitting || mutation.isPending}
        />
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit((v) => { setServerError(null); mutation.mutate(v); })}
        className="space-y-6"
      >
        {serverError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}

        <FormSection title="Identification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle number" error={errors.vehicle_number?.message} required>
              <input className={fieldClass} {...register("vehicle_number")} placeholder="BUS-101" />
            </Field>
            <Field label="Type" error={errors.type?.message} required>
              <SearchableSelect
                value={watch("type")}
                onChange={(v) => setValue("type", v as FormValues["type"])}
                options={TYPE_OPTIONS}
                placeholder="Select type"
              />
            </Field>
            <Field label="License plate" error={errors.license_plate?.message}>
              <input className={fieldClass} {...register("license_plate")} />
            </Field>
            <Field label="VIN" error={errors.vin?.message}>
              <input className={fieldClass} {...register("vin")} maxLength={17} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Specifications">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make" error={errors.make?.message}>
              <input className={fieldClass} {...register("make")} />
            </Field>
            <Field label="Model" error={errors.model?.message}>
              <input className={fieldClass} {...register("model")} />
            </Field>
            <Field label="Year" error={errors.year?.message}>
              <input className={fieldClass} type="number" {...register("year")} />
            </Field>
            <Field label="Fuel type" error={errors.fuel_type?.message}>
              <SearchableSelect
                value={watch("fuel_type") ?? ""}
                onChange={(v) => setValue("fuel_type", v as FormValues["fuel_type"])}
                options={FUEL_OPTIONS}
                placeholder="Select fuel"
              />
            </Field>
            <Field label="Passenger capacity" error={errors.capacity?.message}>
              <input className={fieldClass} type="number" {...register("capacity")} />
            </Field>
            <Field label="Wheelchair capacity" error={errors.wheelchair_capacity?.message}>
              <input className={fieldClass} type="number" {...register("wheelchair_capacity")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status?.message} required>
              <SearchableSelect
                value={watch("status")}
                onChange={(v) => setValue("status", v as FormValues["status"])}
                options={STATUS_OPTIONS}
                placeholder="Select status"
              />
            </Field>
            <Field label="Cost per mile ($)" error={errors.cost_per_mile?.message}>
              <input className={fieldClass} type="number" step="0.01" {...register("cost_per_mile")} />
            </Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
