"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader, Button, Badge } from "@/components/ui/primitives";
import { OrganizationStatRow } from "@/components/dashboard/resource-stat-rows";
import { DataTable, Pagination, type Column } from "@/components/ui/data-table";
import { FilterBar, ActiveFilterPills } from "@/components/ui/filter-bar";
import { PageState } from "@/components/ui/page-state";
import { RowActions } from "@/components/ui/row-actions";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Field, FormSection } from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { confirmDelete, toastError, toastSuccess } from "@/lib/alerts";
import { getApiErrorMessage } from "@/lib/api";
import { createOrganization, deleteOrganization, listOrganizations } from "@/lib/resources";
import { idColumn, useTableSort } from "@/lib/table-utils";
import type { Organization } from "@/lib/types";

const FORM_ID = "org-form";

const schema = z.object({
  name: z.string().min(1, "Organization name is required."),
  slug: z.string().optional(),
  timezone: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
  phone: z.string().optional(),
  admin_email: z.string().email("Invalid admin email.").optional().or(z.literal("")),
  admin_first_name: z.string().optional(),
  admin_last_name: z.string().optional(),
  admin_password: z.string().min(8, "Min 8 characters.").optional().or(z.literal("")),
  admin_password_confirmation: z.string().optional(),
}).refine(
  (d) => !d.admin_password || d.admin_password === d.admin_password_confirmation,
  { message: "Passwords must match.", path: ["admin_password_confirmation"] },
);

type FormValues = z.infer<typeof schema>;

function OrgFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      timezone: "America/New_York",
      email: "",
      phone: "",
      admin_email: "",
      admin_first_name: "",
      admin_last_name: "",
      admin_password: "",
      admin_password_confirmation: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createOrganization(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toastSuccess("Organization created", "You can now manage admins for this tenant.");
      reset();
      onClose();
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e, "Unable to create organization.");
      setServerError(msg);
      toastError("Create failed", msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Add organization"
      description="Create a new tenant and optionally provision the first admin account."
      footer={
        <ModalFooter
          onCancel={onClose}
          submitLabel="Create organization"
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

        <FormSection title="Organization">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message} required>
              <input className="fp-input" {...register("name")} placeholder="Acme K-12 Transportation" />
            </Field>
            <Field label="Slug" error={errors.slug?.message} hint="Auto-generated if blank">
              <input className="fp-input" {...register("slug")} placeholder="acme-k12" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input className="fp-input" type="email" {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input className="fp-input" {...register("phone")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="First admin (optional)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admin email" error={errors.admin_email?.message}>
              <input className="fp-input" type="email" {...register("admin_email")} />
            </Field>
            <Field label="Admin first name" error={errors.admin_first_name?.message}>
              <input className="fp-input" {...register("admin_first_name")} />
            </Field>
            <Field label="Admin last name" error={errors.admin_last_name?.message}>
              <input className="fp-input" {...register("admin_last_name")} />
            </Field>
            <Field label="Password" error={errors.admin_password?.message}>
              <input className="fp-input" type="password" {...register("admin_password")} />
            </Field>
            <Field label="Confirm password" error={errors.admin_password_confirmation?.message}>
              <input className="fp-input" type="password" {...register("admin_password_confirmation")} />
            </Field>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}

export default function OrganizationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { sortKey, sortDir, onSortChange, sortParams } = useTableSort("slug");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["organizations", { search, page, sortKey, sortDir }],
    queryFn: () => listOrganizations({ search, page, ...sortParams }),
  });

  const removeMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toastSuccess("Organization deleted");
    },
    onError: (e) => toastError("Delete failed", getApiErrorMessage(e, "Could not delete organization.")),
  });

  const handleDelete = async (org: Organization) => {
    const ok = await confirmDelete(org.name);
    if (ok) removeMutation.mutate(org.id);
  };

  const columns: Column<Organization>[] = [
    idColumn("slug", (o) => o.slug),
    {
      key: "name",
      header: "Organization",
      primary: true,
      sortable: true,
      sortValue: (o) => o.name,
      render: (o) => (
        <div>
          <p className="font-medium text-slate-900">{o.name}</p>
          <p className="text-xs text-slate-400">{o.timezone ?? "—"}</p>
        </div>
      ),
    },
    { key: "email", header: "Email", hideOnMobile: true, render: (o) => o.email ?? "—" },
    { key: "phone", header: "Phone", hideOnMobile: true, render: (o) => o.phone ?? "—" },
    {
      key: "users",
      header: "Users",
      render: (o) => <Badge className="bg-brand-accent-light text-brand-accent-dark">{o.users_count ?? 0}</Badge>,
    },
    {
      key: "admins",
      header: "Admins",
      render: (o) => <Badge>{o.admins_count ?? 0}</Badge>,
    },
  ];

  const totalOrgs = data?.total ?? 0;
  const totalUsers = (data?.data ?? []).reduce((s, o) => s + (o.users_count ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organizations"
        description="Manage all transportation tenants and their administrator accounts."
        action={<Button onClick={() => setModalOpen(true)}>+ Add organization</Button>}
      />

      <OrganizationStatRow totalOrgs={totalOrgs} totalUsers={totalUsers} isLoading={isLoading} />

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search organizations…"
        resultCount={data?.total}
        onClear={() => { setSearch(""); setPage(1); }}
      />

      <ActiveFilterPills
        items={search ? [{ key: "search", label: `Search: ${search}` }] : []}
        onRemove={() => { setSearch(""); setPage(1); }}
      />

      <PageState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && (data?.data.length ?? 0) === 0}
        emptyMessage="No organizations yet. Create your first tenant."
      >
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(o) => o.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { onSortChange(key, dir); setPage(1); }}
          actions={(o) => (
            <RowActions
              items={[
                { label: "Manage admins", onClick: () => router.push(`/dashboard/users?organization_id=${o.id}`) },
                { label: "Delete", variant: "danger", onClick: () => handleDelete(o) },
              ]}
            />
          )}
        />
      </PageState>

      {data && data.last_page > 1 && (
        <Pagination page={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
      )}

      <OrgFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
