"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FormSection } from "@/components/ui/form-section";
import { updateProfile, type UpdateProfilePayload } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { AuthUser } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required."),
    last_name: z.string().min(1, "Last name is required."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2).optional(),
    zip: z.string().optional(),
    job_title: z.string().optional(),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password && !data.password_confirmation) return true;
      return data.password === data.password_confirmation && (data.password?.length ?? 0) >= 8;
    },
    { message: "Passwords must match and be at least 8 characters.", path: ["password_confirmation"] },
  );

type FormValues = z.infer<typeof schema>;

const inputClass = "fp-input w-full";

export function ProfileEditForm({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);
  const showJobTitle = ["admin", "dispatcher", "school_contact", "super_admin"].includes(user.role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      zip: user.zip ?? "",
      job_title: user.job_title ?? "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? "",
      address: user.address ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      zip: user.zip ?? "",
      job_title: user.job_title ?? "",
      password: "",
      password_confirmation: "",
    });
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.setQueryData(["auth-me"], updated);
      toastSuccess("Profile updated.");
      setServerError(null);
      reset({
        ...updated,
        phone: updated.phone ?? "",
        address: updated.address ?? "",
        city: updated.city ?? "",
        state: updated.state ?? "",
        zip: updated.zip ?? "",
        job_title: updated.job_title ?? "",
        password: "",
        password_confirmation: "",
      });
    },
    onError: (err) => {
      const message = getApiErrorMessage(err);
      setServerError(message);
      toastError(message);
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: UpdateProfilePayload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      zip: values.zip || null,
    };

    if (showJobTitle) {
      payload.job_title = values.job_title || null;
    }

    if (values.password) {
      payload.password = values.password;
      payload.password_confirmation = values.password_confirmation;
    }

    mutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="fp-card p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-brand-secondary">Edit profile</h2>
        <p className="mt-0.5 text-xs text-slate-500">Update your account details and password</p>
      </div>

      {serverError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="space-y-8">
        <FormSection title="Personal information" description="Name and contact details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required error={errors.first_name?.message}>
              <input className={inputClass} {...register("first_name")} />
            </Field>
            <Field label="Last name" required error={errors.last_name?.message}>
              <input className={inputClass} {...register("last_name")} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <input type="email" className={inputClass} {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input className={inputClass} {...register("phone")} placeholder="(555) 555-0100" />
            </Field>
            {showJobTitle ? (
              <Field label="Job title" error={errors.job_title?.message} className="sm:col-span-2">
                <input className={inputClass} {...register("job_title")} placeholder="Operations Manager" />
              </Field>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Address" description="Optional mailing address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Street address" error={errors.address?.message} className="sm:col-span-2">
              <input className={inputClass} {...register("address")} />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <input className={inputClass} {...register("city")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="State" error={errors.state?.message}>
                <input className={inputClass} maxLength={2} {...register("state")} placeholder="IL" />
              </Field>
              <Field label="ZIP" error={errors.zip?.message}>
                <input className={inputClass} {...register("zip")} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Change password" description="Leave blank to keep your current password">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" error={errors.password?.message}>
              <input type="password" className={inputClass} autoComplete="new-password" {...register("password")} />
            </Field>
            <Field label="Confirm password" error={errors.password_confirmation?.message}>
              <input
                type="password"
                className={inputClass}
                autoComplete="new-password"
                {...register("password_confirmation")}
              />
            </Field>
          </div>
        </FormSection>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={() => reset()}
          disabled={!isDirty || mutation.isPending}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
