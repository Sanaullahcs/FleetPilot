"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Field,
  FormSection,
  ProfileFormPanel,
  profileInputClass,
  profileResetClass,
  profileSubmitClass,
} from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { updateProfile, type UpdateProfilePayload } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { US_STATES } from "@/lib/us-states";
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
    state: z.string().optional(),
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

export function ProfileEditForm({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);
  const showJobTitle = ["admin", "dispatcher", "school_contact", "super_admin"].includes(user.role);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
    <ProfileFormPanel
      title="Edit Profile"
      description="Update your account details and password."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={profileResetClass}
            onClick={() => reset()}
            disabled={!isDirty || mutation.isPending}
          >
            Reset
          </button>
          <button type="submit" form="profile-edit-form" className={profileSubmitClass} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      }
    >
      <form id="profile-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{serverError}</div>
        ) : null}

        <FormSection title="Personal Information" description="Name and contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First Name" required error={errors.first_name?.message}>
              <input className={profileInputClass} autoComplete="given-name" {...register("first_name")} />
            </Field>
            <Field label="Last Name" required error={errors.last_name?.message}>
              <input className={profileInputClass} autoComplete="family-name" {...register("last_name")} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <input type="email" className={profileInputClass} autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input className={profileInputClass} autoComplete="tel" {...register("phone")} placeholder="(555) 555-0100" />
            </Field>
            {showJobTitle ? (
              <Field label="Job Title" error={errors.job_title?.message} className="sm:col-span-2">
                <input className={profileInputClass} {...register("job_title")} placeholder="Operations Manager" />
              </Field>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Address" description="Optional mailing address">
          <div className="space-y-3">
            <Field label="Street Address" error={errors.address?.message}>
              <input className={profileInputClass} autoComplete="street-address" {...register("address")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="City" error={errors.city?.message}>
                <input className={profileInputClass} autoComplete="address-level2" {...register("city")} />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <SearchableSelect
                  value={watch("state") ?? ""}
                  onChange={(v) => setValue("state", v, { shouldDirty: true, shouldValidate: true })}
                  options={US_STATES}
                  showAllOption={false}
                  placeholder="Select state"
                  searchPlaceholder="Search state…"
                />
              </Field>
              <Field label="ZIP" error={errors.zip?.message}>
                <input className={profileInputClass} autoComplete="postal-code" placeholder="62701" {...register("zip")} />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection title="Change Password" description="Leave blank to keep current password">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="New Password" error={errors.password?.message}>
              <input type="password" className={profileInputClass} autoComplete="new-password" {...register("password")} />
            </Field>
            <Field label="Confirm Password" error={errors.password_confirmation?.message}>
              <input
                type="password"
                className={profileInputClass}
                autoComplete="new-password"
                {...register("password_confirmation")}
              />
            </Field>
          </div>
        </FormSection>
      </form>
    </ProfileFormPanel>
  );
}
