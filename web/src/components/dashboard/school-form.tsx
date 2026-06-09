"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createSchool, updateSchool } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { US_STATES } from "@/lib/us-states";
import type { School } from "@/lib/types";

const FORM_ID = "school-form-modal";

const schema = z.object({
  name: z.string().min(1, "School name is required."),
  code: z.string().optional(),
  district: z.string().optional(),
  grade_levels: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email("Invalid email.").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  principal_name: z.string().optional(),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass = "fp-input";

export function SchoolFormModal({
  open,
  onClose,
  school,
}: {
  open: boolean;
  onClose: () => void;
  school?: School | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(school);

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
      name: school?.name ?? "",
      code: school?.code ?? "",
      district: school?.district ?? "",
      grade_levels: school?.grade_levels ?? "",
      address: school?.address ?? "",
      city: school?.city ?? "",
      state: school?.state ?? "",
      zip: school?.zip ?? "",
      phone: school?.phone ?? "",
      contact_name: school?.contact_name ?? "",
      contact_email: school?.contact_email ?? "",
      contact_phone: school?.contact_phone ?? "",
      principal_name: school?.principal_name ?? "",
      website: school?.website ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && school ? updateSchool(school.id, values) : createSchool(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["school-stats"] });
      queryClient.invalidateQueries({ queryKey: ["school-filter-options"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toastSuccess(isEdit ? "School updated" : "School created");
      reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save school.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit school" : "Add school"}
      description="Campus profile, district info, and transportation contacts."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={isEdit ? "Save changes" : "Create school"}
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

        <FormSection title="School profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message} required>
              <input className={fieldClass} {...register("name")} />
            </Field>
            <Field label="Code" error={errors.code?.message}>
              <input className={fieldClass} {...register("code")} placeholder="LES" />
            </Field>
            <Field label="District" error={errors.district?.message}>
              <input className={fieldClass} {...register("district")} />
            </Field>
            <Field label="Grade levels" error={errors.grade_levels?.message}>
              <input className={fieldClass} {...register("grade_levels")} placeholder="K–5" />
            </Field>
            <Field label="Principal" error={errors.principal_name?.message}>
              <input className={fieldClass} {...register("principal_name")} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input className={fieldClass} {...register("website")} placeholder="https://" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
              <input className={fieldClass} {...register("address")} />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <input className={fieldClass} {...register("city")} />
            </Field>
            <Field label="State" error={errors.state?.message}>
              <SearchableSelect
                value={watch("state") ?? ""}
                onChange={(v) => setValue("state", v)}
                options={US_STATES}
                placeholder="Select state"
              />
            </Field>
            <Field label="ZIP" error={errors.zip?.message}>
              <input className={fieldClass} {...register("zip")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input className={fieldClass} {...register("phone")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Transportation contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name" error={errors.contact_name?.message}>
              <input className={fieldClass} {...register("contact_name")} />
            </Field>
            <Field label="Contact phone" error={errors.contact_phone?.message}>
              <input className={fieldClass} {...register("contact_phone")} />
            </Field>
            <Field label="Contact email" error={errors.contact_email?.message} className="sm:col-span-2">
              <input className={fieldClass} type="email" {...register("contact_email")} />
            </Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
