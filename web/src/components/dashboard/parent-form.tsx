"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { createParent, updateParent } from "@/lib/resources";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { ParentRecord } from "@/lib/types";

const FORM_ID = "parent-form-modal";

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Guardian", value: "guardian" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Other", value: "other" },
];

const createSchema = z
  .object({
    email: z.string().email("Enter a valid email."),
    first_name: z.string().min(1, "First name is required."),
    last_name: z.string().min(1, "Last name is required."),
    phone: z.string().optional(),
    relationship: z.string().optional(),
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
  relationship: z.string().optional(),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
  is_active: z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const fieldClass = "fp-input";

export function ParentFormModal({
  open,
  onClose,
  parent,
}: {
  open: boolean;
  onClose: () => void;
  parent?: ParentRecord | null;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(parent?.id);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      relationship: "guardian",
      password: "",
      password_confirmation: "",
      is_active: true,
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      relationship: "guardian",
      password: "",
      password_confirmation: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    if (parent?.user) {
      editForm.reset({
        email: parent.user.email,
        first_name: parent.user.first_name,
        last_name: parent.user.last_name,
        phone: parent.user.phone ?? "",
        relationship: parent.relationship ?? "guardian",
        password: "",
        password_confirmation: "",
        is_active: parent.user.is_active,
      });
    } else {
      createForm.reset({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        relationship: "guardian",
        password: "",
        password_confirmation: "",
        is_active: true,
      });
    }
  }, [open, parent, createForm, editForm]);

  const saveMutation = useMutation({
    mutationFn: async (values: CreateValues | EditValues) => {
      if (isEdit && parent) {
        const payload = { ...values };
        if (!payload.password) {
          delete payload.password;
          delete payload.password_confirmation;
        }
        return updateParent(parent.id, payload as Parameters<typeof updateParent>[1]);
      }
      return createParent(values as CreateValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parents"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastSuccess(isEdit ? "Parent updated" : "Parent created");
      onClose();
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e, "Could not save parent.");
      setServerError(msg);
      toastError("Save failed", msg);
    },
  });

  const form = isEdit ? editForm : createForm;
  const editRelationship = useWatch({ control: editForm.control, name: "relationship" });
  const createRelationship = useWatch({ control: createForm.control, name: "relationship" });
  const relationship = (isEdit ? editRelationship : createRelationship) ?? "guardian";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit parent" : "Add parent"}
      description={
        isEdit
          ? "Update contact details and portal access for this parent account."
          : "Create a parent login and profile. Link students after saving from Assign students."
      }
      size="md"
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel={saveMutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create parent"}
          submitForm={FORM_ID}
          pending={saveMutation.isPending}
        />
      }
    >
      <form
        id={FORM_ID}
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
      >
        {serverError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </p>
        )}

        <FormSection title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={form.formState.errors.first_name?.message}>
              <input className={fieldClass} {...form.register("first_name")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.last_name?.message}>
              <input className={fieldClass} {...form.register("last_name")} />
            </Field>
          </div>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input type="email" className={fieldClass} {...form.register("email")} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <input type="tel" className={fieldClass} {...form.register("phone")} />
          </Field>
          <Field label="Relationship (default for new links)">
            <SearchableSelect
              value={relationship}
              onChange={(v) => form.setValue("relationship", v)}
              options={RELATIONSHIP_OPTIONS}
              showAllOption={false}
            />
          </Field>
        </FormSection>

        <FormSection title={isEdit ? "Portal access" : "Login credentials"}>
          {!isEdit && (
            <>
              <Field label="Password" error={form.formState.errors.password?.message}>
                <input type="password" className={fieldClass} autoComplete="new-password" {...form.register("password")} />
              </Field>
              <Field label="Confirm password" error={form.formState.errors.password_confirmation?.message}>
                <input
                  type="password"
                  className={fieldClass}
                  autoComplete="new-password"
                  {...form.register("password_confirmation")}
                />
              </Field>
            </>
          )}
          {isEdit && (
            <>
              <Field label="New password (optional)" error={form.formState.errors.password?.message}>
                <input type="password" className={fieldClass} autoComplete="new-password" {...form.register("password")} />
              </Field>
              <Field label="Confirm new password" error={form.formState.errors.password_confirmation?.message}>
                <input
                  type="password"
                  className={fieldClass}
                  autoComplete="new-password"
                  {...form.register("password_confirmation")}
                />
              </Field>
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded border-slate-300" {...form.register("is_active")} />
            Active — parent can sign in to the portal
          </label>
        </FormSection>
      </form>
    </Modal>
  );
}
