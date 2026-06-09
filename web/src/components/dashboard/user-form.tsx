"use client";

import { useEffect, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createUser, listOrganizations, listRoles, updateUser, USER_ROLES } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { AdminRole, AdminUser } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const EDIT_FORM_ID = "user-edit-form";
const CREATE_FORM_ID = "user-create-form";

const roleEnum = z.enum(["admin", "dispatcher", "driver", "contractor", "school_contact", "parent"]);

const createSchema = z
  .object({
    organization_id: z.string().optional(),
    email: z.string().email("Enter a valid email."),
    first_name: z.string().min(1, "First name is required."),
    last_name: z.string().min(1, "Last name is required."),
    phone: z.string().optional(),
    role: roleEnum,
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirmation: z.string(),
    is_active: z.boolean(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });

const editSchema = z.object({
  email: z.string().email("Enter a valid email."),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  phone: z.string().optional(),
  role: roleEnum,
  is_active: z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type SharedValues = Pick<CreateValues, "email" | "first_name" | "last_name" | "phone" | "role" | "is_active">;

const fieldClass = "fp-input";

function RoleCheckboxes({
  roles,
  selected,
  onChange,
}: {
  roles: AdminRole[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string, on: boolean) => {
    onChange(on ? [...selected, id] : selected.filter((x) => x !== id));
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      {roles.map((role) => (
        <label
          key={role.id}
          className={
            selected.includes(role.id)
              ? "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-accent/40 bg-brand-accent-light px-3 py-1.5 text-sm font-medium text-brand-accent-dark"
              : "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600"
          }
        >
          <input
            type="checkbox"
            checked={selected.includes(role.id)}
            onChange={(e) => toggle(role.id, e.target.checked)}
            className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
          />
          {role.name}
        </label>
      ))}
    </div>
  );
}

export function UserFormModal({
  open,
  onClose,
  user,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  user?: AdminUser | null;
  organizationId?: string;
}) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const isSuperAdmin = authUser?.role === "super_admin";
  const assignableRoles = USER_ROLES.filter((r) => r.value !== "super_admin");
  const [serverError, setServerError] = useState<string | null>(null);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const isEdit = Boolean(user);

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
    enabled: open && !isSuperAdmin,
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations", "all"],
    queryFn: () => listOrganizations({ per_page: 100 }),
    enabled: open && isSuperAdmin,
  });

  useEffect(() => {
    if (open) {
      setRoleIds(user?.roles?.map((r) => r.id) ?? []);
      setServerError(null);
    }
  }, [open, user]);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      organization_id: organizationId ?? "",
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "dispatcher",
      password: "",
      password_confirmation: "",
      is_active: true,
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      phone: user?.phone ?? "",
      role: (user?.role === "super_admin" ? "admin" : user?.role ?? "dispatcher") as EditValues["role"],
      is_active: user?.is_active ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateValues) =>
      createUser({
        ...values,
        phone: values.phone || null,
        role_ids: roleIds,
        organization_id: values.organization_id || organizationId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastSuccess("User created", "New account is ready to use.");
      createForm.reset();
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save user.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  const editMutation = useMutation({
    mutationFn: (values: EditValues) =>
      updateUser(user!.id, { ...values, phone: values.phone || null, role_ids: roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastSuccess("User updated", "Changes saved successfully.");
      onClose();
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error, "Unable to save user.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  if (isEdit) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = editForm;
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        title="Edit user"
        description="Update account details, role assignment, and access status."
        footer={
          <ModalFooter
            onCancel={onClose}
            submitLabel="Save changes"
            submitForm={EDIT_FORM_ID}
            pending={isSubmitting || editMutation.isPending}
          />
        }
      >
        <form id={EDIT_FORM_ID} onSubmit={handleSubmit((v) => editMutation.mutate(v))} className="space-y-6" noValidate>
          <UserFields
            register={register as unknown as UseFormRegister<SharedValues>}
            errors={errors}
            roles={roles}
            roleIds={roleIds}
            setRoleIds={setRoleIds}
          roleValue={editForm.watch("role")}
          onRoleChange={(v) => editForm.setValue("role", v as EditValues["role"])}
          roleOptions={assignableRoles.map((r) => ({ label: r.label, value: r.value }))}
        />
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
          )}
        </form>
      </Modal>
    );
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = createForm;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Create user"
      description="Add a new team member with login credentials and role permissions."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel="Create user"
          submitForm={CREATE_FORM_ID}
          pending={isSubmitting || createMutation.isPending}
        />
      }
    >
      <form id={CREATE_FORM_ID} onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-6" noValidate>
        <UserFields
          register={register as unknown as UseFormRegister<SharedValues>}
          errors={errors}
          roles={roles}
          roleIds={roleIds}
          setRoleIds={setRoleIds}
          roleValue={createForm.watch("role")}
          onRoleChange={(v) => createForm.setValue("role", v as CreateValues["role"])}
          isSuperAdmin={isSuperAdmin}
          organizationId={createForm.watch("organization_id") ?? organizationId ?? ""}
          onOrganizationChange={(v) => createForm.setValue("organization_id", v)}
          organizationOptions={(organizations?.data ?? []).map((o) => ({ label: o.name, value: o.id }))}
          roleOptions={assignableRoles.map((r) => ({ label: r.label, value: r.value }))}
        />
        <FormSection title="Login credentials">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Password" required error={errors.password?.message}>
              <input type="password" className={fieldClass} autoComplete="new-password" {...createForm.register("password")} />
            </Field>
            <Field label="Confirm password" required error={errors.password_confirmation?.message}>
              <input type="password" className={fieldClass} autoComplete="new-password" {...createForm.register("password_confirmation")} />
            </Field>
          </div>
        </FormSection>
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
        )}
      </form>
    </Modal>
  );
}

function UserFields({
  register,
  errors,
  roles,
  roleIds,
  setRoleIds,
  roleValue,
  onRoleChange,
  isSuperAdmin,
  organizationId,
  onOrganizationChange,
  organizationOptions,
  roleOptions,
}: {
  register: UseFormRegister<SharedValues>;
  errors: FieldErrors<SharedValues>;
  roles?: AdminRole[];
  roleIds: string[];
  setRoleIds: (ids: string[]) => void;
  roleValue: SharedValues["role"];
  onRoleChange: (value: string) => void;
  isSuperAdmin?: boolean;
  organizationId?: string;
  onOrganizationChange?: (value: string) => void;
  organizationOptions?: { label: string; value: string }[];
  roleOptions?: { label: string; value: string }[];
}) {
  const rolesList = roleOptions ?? USER_ROLES.filter((r) => r.value !== "super_admin").map((r) => ({ label: r.label, value: r.value }));

  return (
    <>
      <FormSection title="Profile">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isSuperAdmin && organizationOptions && onOrganizationChange && (
            <Field label="Organization" required className="sm:col-span-2">
              <SearchableSelect
                value={organizationId ?? ""}
                onChange={onOrganizationChange}
                options={organizationOptions}
                showAllOption={false}
                placeholder="Select organization"
              />
            </Field>
          )}
          <Field label="First name" required error={errors.first_name?.message}>
            <input className={fieldClass} autoComplete="given-name" {...register("first_name")} />
          </Field>
          <Field label="Last name" required error={errors.last_name?.message}>
            <input className={fieldClass} autoComplete="family-name" {...register("last_name")} />
          </Field>
          <Field label="Email" required error={errors.email?.message} className="sm:col-span-2">
            <input type="email" className={fieldClass} autoComplete="off" {...register("email")} />
          </Field>
          <Field label="Phone">
            <input type="tel" className={fieldClass} autoComplete="tel" {...register("phone")} />
          </Field>
          <Field label="Primary role">
            <SearchableSelect
              value={roleValue}
              onChange={onRoleChange}
              options={rolesList}
              showAllOption={false}
              placeholder="Select role"
              searchPlaceholder="Search roles…"
            />
          </Field>
        </div>
      </FormSection>

      {roles && roles.length > 0 && (
        <FormSection title="RBAC roles" description="Fine-grained permissions assigned to this account.">
          <RoleCheckboxes roles={roles} selected={roleIds} onChange={setRoleIds} />
        </FormSection>
      )}

      <FormSection title="Account status">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
          <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-slate-300 text-brand-accent focus:ring-brand-accent" />
          <span>
            <span className="font-medium text-slate-900">Active account</span>
            <span className="mt-0.5 block text-xs text-slate-500">User can sign in to FleetPilot when enabled.</span>
          </span>
        </label>
      </FormSection>
    </>
  );
}
