"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createRoute, listSchools, updateRoute } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { RouteItem } from "@/lib/types";

const FORM_ID = "route-form-modal";

const schema = z.object({
  name: z.string().min(1, "Route name is required."),
  code: z.string().optional(),
  school_id: z.string().optional(),
  type: z.enum(["am", "pm", "midday", "activity", "sped", "charter"]),
  status: z.enum(["active", "inactive", "draft"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { label: "Morning (AM)", value: "am" },
  { label: "Afternoon (PM)", value: "pm" },
  { label: "Midday", value: "midday" },
  { label: "Activity", value: "activity" },
  { label: "Special education", value: "sped" },
  { label: "Charter / field trip", value: "charter" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Draft", value: "draft" },
];

const fieldClass = "fp-input";

export function RouteFormModal({
  open,
  onClose,
  route,
}: {
  open: boolean;
  onClose: () => void;
  route?: RouteItem | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(route);

  const { data: schools } = useQuery({
    queryKey: ["schools", "all"],
    queryFn: () => listSchools({ per_page: 100 }),
    enabled: open,
  });

  const schoolOptions = (schools?.data ?? []).map((s) => ({ label: s.name, value: s.id }));

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
      name: route?.name ?? "",
      code: route?.code ?? "",
      school_id: route?.school?.id ?? "",
      type: (route?.type as FormValues["type"]) ?? "am",
      status: (route?.status as FormValues["status"]) ?? "active",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, school_id: values.school_id || null };
      return isEdit && route ? updateRoute(route.id, payload) : createRoute(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess(isEdit ? "Route updated" : "Route created");
      reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save route.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? "Edit route" : "Add route"}
      description="Route identity, school assignment, and service type."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? "Save changes" : "Create route"}
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

        <FormSection title="Route details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message} required>
              <input className={fieldClass} {...register("name")} placeholder="Lincoln AM Route 1" />
            </Field>
            <Field label="Code" error={errors.code?.message}>
              <input className={fieldClass} {...register("code")} placeholder="LES-AM-01" />
            </Field>
            <Field label="School" error={errors.school_id?.message}>
              <SearchableSelect
                value={watch("school_id") ?? ""}
                onChange={(v) => setValue("school_id", v)}
                options={schoolOptions}
                placeholder="Select school"
              />
            </Field>
            <Field label="Type" error={errors.type?.message} required>
              <SearchableSelect
                value={watch("type")}
                onChange={(v) => setValue("type", v as FormValues["type"])}
                options={TYPE_OPTIONS}
                placeholder="Select type"
              />
            </Field>
            <Field label="Status" error={errors.status?.message} required>
              <SearchableSelect
                value={watch("status")}
                onChange={(v) => setValue("status", v as FormValues["status"])}
                options={STATUS_OPTIONS}
                placeholder="Select status"
              />
            </Field>
            <Field label="Description" error={errors.description?.message} className="sm:col-span-2">
              <textarea className={`${fieldClass} min-h-[80px]`} {...register("description")} />
            </Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
