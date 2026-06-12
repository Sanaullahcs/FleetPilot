"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSignupAdmins,
  fetchSignupOrganizations,
  fetchSignupSchools,
  register as submitRegistration,
  type SignupRole,
} from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { useAuthStore } from "@/store/auth";
import {
  SignupShell,
  AuthField,
  AuthErrorBanner,
  AuthFormHeading,
  AuthSuccessBanner,
  AuthGlassCard,
  AuthRoleGrid,
} from "@/components/auth/auth-shell";
import { AddressFields } from "@/components/auth/address-fields";
import { AuthStepper, AuthWizardNav, type AuthStep } from "@/components/auth/auth-stepper";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { brand } from "@/lib/brand";
import { US_STATES } from "@/lib/us-states";

const addressFields = {
  address: z.string().min(1, "Street address is required.").max(500),
  city: z.string().min(1, "City is required.").max(100),
  state: z.string().min(1, "State is required.").max(2),
  zip: z.string().min(1, "ZIP code is required.").max(10),
};

const signupSchema = z
  .object({
    role: z.enum(["admin", "driver", "school_contact", "parent"]),
    company_name: z.string().max(255),
    company_phone: z.string().max(20).optional().or(z.literal("")),
    company_email: z.string().email().optional().or(z.literal("")),
    website: z.string().max(255).optional().or(z.literal("")),
    timezone: z.string().max(50).optional().or(z.literal("")),
    organization_id: z.string(),
    admin_user_id: z.string(),
    school_id: z.string(),
    school_name: z.string().max(255),
    school_code: z.string().max(50).optional().or(z.literal("")),
    district: z.string().max(255).optional().or(z.literal("")),
    grade_levels: z.string().max(50).optional().or(z.literal("")),
    estimated_student_count: z.string().max(10),
    school_phone: z.string().max(20).optional().or(z.literal("")),
    school_website: z.string().max(255).optional().or(z.literal("")),
    principal_name: z.string().max(100).optional().or(z.literal("")),
    employee_id: z.string().max(50).optional().or(z.literal("")),
    license_number: z.string().max(50).optional().or(z.literal("")),
    license_state: z.string().max(2).optional().or(z.literal("")),
    license_expiry: z.string().optional().or(z.literal("")),
    date_of_birth: z.string().optional().or(z.literal("")),
    emergency_contact_name: z.string().max(100).optional().or(z.literal("")),
    emergency_contact_phone: z.string().max(20).optional().or(z.literal("")),
    job_title: z.string().max(100).optional().or(z.literal("")),
    department: z.string().max(100).optional().or(z.literal("")),
    relationship: z.string().optional().or(z.literal("")),
    child_first_name: z.string().max(100).optional().or(z.literal("")),
    child_last_name: z.string().max(100).optional().or(z.literal("")),
    child_grade: z.string().max(20).optional().or(z.literal("")),
    ...addressFields,
    first_name: z.string().min(1, "First name is required.").max(100),
    last_name: z.string().min(1, "Last name is required.").max(100),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().min(1, "Phone number is required.").max(20),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128),
    password_confirmation: z.string().min(8).max(128),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.password_confirmation) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match.", path: ["password_confirmation"] });
    }
    if (data.role === "admin") {
      if (!data.company_name?.trim() || data.company_name.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company name is required.", path: ["company_name"] });
      }
      return;
    }
    if (!data.organization_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a transportation provider.", path: ["organization_id"] });
    }
    if (data.role === "school_contact") {
      if (!data.school_name?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "School name is required.", path: ["school_name"] });
      }
      if (!data.estimated_student_count?.trim() || Number(data.estimated_student_count) < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter estimated student count.", path: ["estimated_student_count"] });
      }
      return;
    }
    if (!data.admin_user_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select an administrator.", path: ["admin_user_id"] });
    }
    if (data.role === "parent" && !data.school_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a school.", path: ["school_id"] });
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const ROLES: { id: SignupRole; label: string; short: string; description: string; accent: string; Icon: () => React.ReactNode }[] = [
  { id: "admin", label: "Transportation Provider", short: "Provider", description: "Register your fleet company and manage operations", accent: brand.primary, Icon: RoleIconBus },
  { id: "driver", label: "Driver", short: "Driver", description: "Join your employer and access your route schedule", accent: brand.cyan, Icon: RoleIconPerson },
  { id: "school_contact", label: "School", short: "School", description: "Connect your campus with district transportation", accent: brand.orange, Icon: RoleIconSchool },
  { id: "parent", label: "Parent", short: "Parent", description: "Track buses and stay connected with your child's school", accent: brand.accent, Icon: RoleIconFamily },
];

const STEPS: Record<SignupRole, AuthStep[]> = {
  admin: [
    { id: "company", title: "Company", subtitle: "Business details" },
    { id: "account", title: "Account", subtitle: "Your credentials" },
    { id: "address", title: "Address", subtitle: "Business location" },
    { id: "review", title: "Review", subtitle: "Confirm & create" },
  ],
  school_contact: [
    { id: "provider", title: "Provider", subtitle: "Your transportation company" },
    { id: "school", title: "School", subtitle: "Campus & enrollment" },
    { id: "account", title: "Contact", subtitle: "Your account" },
    { id: "review", title: "Review", subtitle: "Submit request" },
  ],
  driver: [
    { id: "provider", title: "Employer", subtitle: "Link to provider" },
    { id: "account", title: "Account", subtitle: "Your credentials" },
    { id: "profile", title: "Profile", subtitle: "Address & license" },
    { id: "review", title: "Review", subtitle: "Submit request" },
  ],
  parent: [
    { id: "provider", title: "District", subtitle: "Provider & school" },
    { id: "account", title: "Account", subtitle: "Your credentials" },
    { id: "family", title: "Family", subtitle: "Child & home address" },
    { id: "review", title: "Review", subtitle: "Submit request" },
  ],
};

const STEP_FIELDS: Record<SignupRole, Record<string, (keyof SignupFormValues)[]>> = {
  admin: {
    company: ["company_name", "company_phone", "company_email", "website"],
    account: ["first_name", "last_name", "email", "phone", "password", "password_confirmation"],
    address: ["address", "city", "state", "zip"],
  },
  school_contact: {
    provider: ["organization_id"],
    school: ["school_name", "estimated_student_count", "district", "grade_levels", "school_code", "school_phone", "principal_name", "school_website", "address", "city", "state", "zip"],
    account: ["first_name", "last_name", "email", "phone", "job_title", "password", "password_confirmation"],
  },
  driver: {
    provider: ["organization_id", "admin_user_id"],
    account: ["first_name", "last_name", "email", "phone", "password", "password_confirmation"],
    profile: ["address", "city", "state", "zip"],
  },
  parent: {
    provider: ["organization_id", "admin_user_id", "school_id"],
    account: ["first_name", "last_name", "email", "phone", "password", "password_confirmation"],
    family: ["address", "city", "state", "zip"],
  },
};

const TIMEZONE_OPTIONS = [
  { label: "Eastern", value: "America/New_York" },
  { label: "Central", value: "America/Chicago" },
  { label: "Mountain", value: "America/Denver" },
  { label: "Pacific", value: "America/Los_Angeles" },
];

const GRADE_OPTIONS = [
  { label: "Pre-K", value: "Pre-K" },
  { label: "K–5 (Elementary)", value: "K-5" },
  { label: "6–8 (Middle)", value: "6-8" },
  { label: "9–12 (High)", value: "9-12" },
  { label: "K–12 (All grades)", value: "K-12" },
];

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Guardian", value: "guardian" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Other", value: "other" },
];

const EMPTY_FORM: SignupFormValues = {
  role: "admin",
  company_name: "",
  company_phone: "",
  company_email: "",
  website: "",
  timezone: "America/New_York",
  organization_id: "",
  admin_user_id: "",
  school_id: "",
  school_name: "",
  school_code: "",
  district: "",
  grade_levels: "",
  estimated_student_count: "",
  school_phone: "",
  school_website: "",
  principal_name: "",
  employee_id: "",
  license_number: "",
  license_state: "",
  license_expiry: "",
  date_of_birth: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  job_title: "",
  department: "",
  relationship: "",
  child_first_name: "",
  child_last_name: "",
  child_grade: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
};

export default function SignupPage() {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();
  const [role, setRole] = useState<SignupRole>("admin");
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmedReview, setConfirmedReview] = useState(false);

  const isProvider = role === "admin";
  const isDriver = role === "driver";
  const isSchool = role === "school_contact";
  const needsSchoolSelect = role === "parent";
  const activeRole = ROLES.find((r) => r.id === role)!;
  const steps = STEPS[role];
  const currentStep = steps[step]!;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: EMPTY_FORM,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { register, handleSubmit, watch, setValue, reset, trigger, setError, formState: { errors, isSubmitting } } = form;
  const organizationId = watch("organization_id");
  const values = watch();

  useEffect(() => {
    if (hydrated && token) router.replace("/dashboard");
  }, [hydrated, token, router]);

  useEffect(() => {
    reset({ ...EMPTY_FORM, role });
    setStep(0);
    setConfirmedReview(false);
    setServerError(null);
    setSuccessMessage(null);
  }, [role, reset]);

  const orgsQuery = useQuery({
    queryKey: ["signup-organizations"],
    queryFn: () => fetchSignupOrganizations(),
    enabled: !isProvider,
  });

  const adminsQuery = useQuery({
    queryKey: ["signup-admins", organizationId],
    queryFn: () => fetchSignupAdmins(organizationId),
    enabled: !isProvider && !isSchool && !!organizationId,
  });

  const schoolsQuery = useQuery({
    queryKey: ["signup-schools", organizationId],
    queryFn: () => fetchSignupSchools(organizationId),
    enabled: needsSchoolSelect && !!organizationId,
  });

  const orgOptions = useMemo(() => (orgsQuery.data ?? []).map((o) => ({ value: o.id, label: o.name })), [orgsQuery.data]);
  const adminOptions = useMemo(
    () => (adminsQuery.data ?? []).map((a) => ({ value: a.id, label: `${a.first_name} ${a.last_name}` })),
    [adminsQuery.data],
  );
  const schoolOptions = useMemo(
    () => (schoolsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [schoolsQuery.data],
  );

  const selectedOrg = orgOptions.find((o) => o.value === organizationId)?.label;

  const onOrgChange = (value: string) => {
    setValue("organization_id", value);
    setValue("admin_user_id", "");
    setValue("school_id", "");
  };

  const selectRole = (next: SignupRole) => {
    setRole(next);
    setValue("role", next);
  };

  const goNext = async () => {
    setServerError(null);
    const fields = STEP_FIELDS[role][currentStep.id];
    if (fields?.length) {
      const ok = await trigger(fields);
      if (!ok) return;
    }
    if (isSchool && currentStep.id === "school") {
      const count = Number(watch("estimated_student_count"));
      if (!watch("school_name")?.trim()) {
        await trigger("school_name");
        return;
      }
      if (!watch("estimated_student_count")?.trim() || Number.isNaN(count) || count < 1) {
        setError("estimated_student_count", { message: "Enter estimated student count (minimum 1)." });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => {
    setServerError(null);
    setConfirmedReview(false);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    e.preventDefault();
    if (currentStep.id === "review") return;
    void goNext();
  };

  const buildPayload = (v: SignupFormValues) => ({
    role: v.role,
    company_name: isProvider ? v.company_name : undefined,
    company_phone: isProvider ? v.company_phone || undefined : undefined,
    company_email: isProvider ? v.company_email || undefined : undefined,
    website: isProvider ? v.website || undefined : undefined,
    timezone: isProvider ? v.timezone || undefined : undefined,
    organization_id: !isProvider ? v.organization_id : undefined,
    admin_user_id: !isProvider && !isSchool ? v.admin_user_id : undefined,
    school_id: needsSchoolSelect ? v.school_id : undefined,
    school_name: isSchool ? v.school_name : undefined,
    school_code: isSchool ? v.school_code || undefined : undefined,
    district: isSchool ? v.district || undefined : undefined,
    grade_levels: isSchool ? v.grade_levels || undefined : undefined,
    estimated_student_count: isSchool && v.estimated_student_count ? Number(v.estimated_student_count) : undefined,
    school_phone: isSchool ? v.school_phone || undefined : undefined,
    school_website: isSchool ? v.school_website || undefined : undefined,
    principal_name: isSchool ? v.principal_name || undefined : undefined,
    first_name: v.first_name,
    last_name: v.last_name,
    email: v.email,
    phone: v.phone,
    password: v.password,
    password_confirmation: v.password_confirmation,
    address: v.address,
    city: v.city,
    state: v.state,
    zip: v.zip,
    employee_id: isDriver ? v.employee_id || undefined : undefined,
    license_number: isDriver ? v.license_number || undefined : undefined,
    license_state: isDriver ? v.license_state || undefined : undefined,
    license_expiry: isDriver ? v.license_expiry || undefined : undefined,
    date_of_birth: isDriver ? v.date_of_birth || undefined : undefined,
    emergency_contact_name: isDriver ? v.emergency_contact_name || undefined : undefined,
    emergency_contact_phone: isDriver ? v.emergency_contact_phone || undefined : undefined,
    job_title: isSchool ? v.job_title || undefined : undefined,
    department: isSchool ? v.department || undefined : undefined,
    relationship: role === "parent" ? v.relationship || undefined : undefined,
    child_first_name: role === "parent" ? v.child_first_name || undefined : undefined,
    child_last_name: role === "parent" ? v.child_last_name || undefined : undefined,
    child_grade: role === "parent" ? v.child_grade || undefined : undefined,
  });

  const onSubmit = async (v: SignupFormValues) => {
    setServerError(null);
    try {
      const res = await submitRegistration(buildPayload(v));
      setSuccessMessage(res.message);
      toastSuccess("Registration complete", res.message);
      if (v.role === "admin") setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      const msg = getApiErrorMessage(error, "Unable to complete registration.");
      setServerError(msg);
      toastError("Registration failed", msg);
    }
  };

  const submitRegistrationForm = handleSubmit(onSubmit);

  const isReviewStep = currentStep.id === "review";

  return (
    <SignupShell>
      {successMessage ? (
        <AuthGlassCard>
          <div className="space-y-4 p-5 sm:p-6">
            <AuthSuccessBanner message={successMessage} />
            {role === "admin" ? (
              <p className="text-center text-sm text-slate-500">Redirecting to sign in…</p>
            ) : (
              <Link href="/login" className="fp-auth-btn block text-center">Go to sign in</Link>
            )}
          </div>
        </AuthGlassCard>
      ) : (
        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={handleFormKeyDown}
          noValidate
        >
          <input type="hidden" {...register("role")} value={role} />

          <AuthFormHeading title="Create your account" description="Pick a role and complete the steps below" />

          <div className="mt-6">
            <AuthRoleGrid compact roles={ROLES} selected={role} onSelect={(id) => selectRole(id as SignupRole)} />
          </div>

          <AuthGlassCard className="mt-5">
            <div className="p-4 sm:p-5">
              <AuthStepper compact steps={steps} current={step} accent={activeRole.accent} />

              <div key={`${role}-${currentStep.id}`} className="animate-auth-step-in">
                {currentStep.id === "company" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AuthField label="Company name *" error={errors.company_name?.message}>
                      <input className="fp-input" placeholder="Metro K-12 Transportation" {...register("company_name")} />
                    </AuthField>
                    <AuthField label="Company phone" error={errors.company_phone?.message}>
                      <input type="tel" className="fp-input" {...register("company_phone")} />
                    </AuthField>
                    <AuthField label="Company email" hint="Billing & operations" error={errors.company_email?.message}>
                      <input type="email" className="fp-input" {...register("company_email")} />
                    </AuthField>
                    <AuthField label="Website" error={errors.website?.message}>
                      <input className="fp-input" placeholder="https://" {...register("website")} />
                    </AuthField>
                    <div className="sm:col-span-2">
                      <AuthField label="Timezone">
                        <SearchableSelect value={watch("timezone") ?? "America/New_York"} onChange={(v) => setValue("timezone", v)} options={TIMEZONE_OPTIONS} showAllOption={false} placeholder="Timezone" />
                      </AuthField>
                    </div>
                  </div>
                )}

                {currentStep.id === "provider" && (
                  <div className="space-y-4">
                    {isSchool ? (
                      <>
                        <AuthField label="Transportation provider *" error={errors.organization_id?.message} hint="Select the company that handles your district's bus routes">
                          <SearchableSelect value={organizationId} onChange={onOrgChange} options={orgOptions} placeholder="Select provider" showAllOption={false} />
                        </AuthField>
                        <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/5 px-4 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-brand-secondary">What happens next?</p>
                          <p className="mt-1 text-xs leading-relaxed">You&apos;ll enter your school details on the next step. Your provider will review and activate your account.</p>
                        </div>
                      </>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <AuthField label="Transportation provider *" error={errors.organization_id?.message}>
                          <SearchableSelect value={organizationId} onChange={onOrgChange} options={orgOptions} placeholder="Select provider" showAllOption={false} />
                        </AuthField>
                        <AuthField label="Administrator *" error={errors.admin_user_id?.message}>
                          <SearchableSelect value={watch("admin_user_id")} onChange={(v) => setValue("admin_user_id", v)} options={adminOptions} placeholder={organizationId ? "Select admin" : "Select provider first"} showAllOption={false} disabled={!organizationId} />
                        </AuthField>
                        {needsSchoolSelect && (
                          <div className="sm:col-span-2">
                            <AuthField label="School *" error={errors.school_id?.message}>
                              <SearchableSelect value={watch("school_id")} onChange={(v) => setValue("school_id", v)} options={schoolOptions} placeholder={organizationId ? "Select school" : "Select provider first"} showAllOption={false} disabled={!organizationId} />
                            </AuthField>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentStep.id === "school" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField label="School name *" error={errors.school_name?.message}>
                        <input className="fp-input" placeholder="Lincoln Elementary" {...register("school_name")} />
                      </AuthField>
                      <AuthField label="School code / NCES ID" error={errors.school_code?.message}>
                        <input className="fp-input" placeholder="Optional" {...register("school_code")} />
                      </AuthField>
                      <AuthField label="School district" error={errors.district?.message}>
                        <input className="fp-input" placeholder="Springfield USD" {...register("district")} />
                      </AuthField>
                      <AuthField label="Grade levels served">
                        <SearchableSelect value={watch("grade_levels") ?? ""} onChange={(v) => setValue("grade_levels", v)} options={GRADE_OPTIONS} allLabel="— Select —" placeholder="Grade range" />
                      </AuthField>
                      <AuthField label="Estimated students *" error={errors.estimated_student_count?.message as string | undefined} hint="Approximate enrollment for route planning">
                        <input type="number" min={1} className="fp-input" placeholder="450" {...register("estimated_student_count")} />
                      </AuthField>
                      <AuthField label="School phone" error={errors.school_phone?.message}>
                        <input type="tel" className="fp-input" {...register("school_phone")} />
                      </AuthField>
                      <AuthField label="Principal name" error={errors.principal_name?.message}>
                        <input className="fp-input" {...register("principal_name")} />
                      </AuthField>
                      <AuthField label="School website" error={errors.school_website?.message}>
                        <input className="fp-input" placeholder="https://" {...register("school_website")} />
                      </AuthField>
                    </div>
                    <AddressFields register={register} watch={watch} setValue={setValue} errors={errors} label="School campus address" />
                  </div>
                )}

                {currentStep.id === "account" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField label="First name *" error={errors.first_name?.message}>
                      <input className="fp-input" autoComplete="given-name" {...register("first_name")} />
                    </AuthField>
                    <AuthField label="Last name *" error={errors.last_name?.message}>
                      <input className="fp-input" autoComplete="family-name" {...register("last_name")} />
                    </AuthField>
                    <AuthField label="Email *" error={errors.email?.message}>
                      <input type="email" className="fp-input" autoComplete="email" {...register("email")} />
                    </AuthField>
                    <AuthField label="Phone *" error={errors.phone?.message}>
                      <input type="tel" className="fp-input" autoComplete="tel" {...register("phone")} />
                    </AuthField>
                    {isSchool && (
                      <>
                        <AuthField label="Your job title" error={errors.job_title?.message}>
                          <input className="fp-input" placeholder="Transportation coordinator" {...register("job_title")} />
                        </AuthField>
                        <AuthField label="Department" error={errors.department?.message}>
                          <input className="fp-input" placeholder="Operations, Admin…" {...register("department")} />
                        </AuthField>
                      </>
                    )}
                    <AuthField label="Password *" error={errors.password?.message}>
                      <input type="password" className="fp-input" autoComplete="new-password" {...register("password")} />
                    </AuthField>
                    <AuthField label="Confirm password *" error={errors.password_confirmation?.message}>
                      <input type="password" className="fp-input" autoComplete="new-password" {...register("password_confirmation")} />
                    </AuthField>
                  </div>
                )}

                {currentStep.id === "address" && (
                  <AddressFields register={register} watch={watch} setValue={setValue} errors={errors} label="Business address" />
                )}

                {currentStep.id === "profile" && (
                  <div className="space-y-5">
                    <AddressFields register={register} watch={watch} setValue={setValue} errors={errors} label="Home address" />
                    <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                      <AuthField label="Employee ID"><input className="fp-input" {...register("employee_id")} /></AuthField>
                      <AuthField label="Date of birth"><input type="date" className="fp-input" {...register("date_of_birth")} /></AuthField>
                      <AuthField label="Driver license #"><input className="fp-input" {...register("license_number")} /></AuthField>
                      <AuthField label="License state">
                        <SearchableSelect value={watch("license_state") ?? ""} onChange={(v) => setValue("license_state", v)} options={US_STATES} showAllOption={false} placeholder="State" />
                      </AuthField>
                      <AuthField label="License expiry"><input type="date" className="fp-input" {...register("license_expiry")} /></AuthField>
                      <AuthField label="Emergency contact"><input className="fp-input" {...register("emergency_contact_name")} /></AuthField>
                      <AuthField label="Emergency phone"><input type="tel" className="fp-input" {...register("emergency_contact_phone")} /></AuthField>
                    </div>
                  </div>
                )}

                {currentStep.id === "family" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AuthField label="Relationship to student">
                        <SearchableSelect value={watch("relationship") ?? ""} onChange={(v) => setValue("relationship", v)} options={RELATIONSHIP_OPTIONS} allLabel="— Select —" placeholder="Relationship" />
                      </AuthField>
                      <AuthField label="Child's grade"><input className="fp-input" placeholder="K, 1, 2…" {...register("child_grade")} /></AuthField>
                      <AuthField label="Child's first name"><input className="fp-input" {...register("child_first_name")} /></AuthField>
                      <AuthField label="Child's last name"><input className="fp-input" {...register("child_last_name")} /></AuthField>
                    </div>
                    <AddressFields register={register} watch={watch} setValue={setValue} errors={errors} label="Home address" />
                  </div>
                )}

                {currentStep.id === "review" && (
                  <ReviewPanel
                    role={role}
                    values={values}
                    orgLabel={selectedOrg}
                    accent={activeRole.accent}
                    confirmed={confirmedReview}
                    onConfirmChange={setConfirmedReview}
                  />
                )}
              </div>

              {!isProvider && step > 0 && !isReviewStep && (
                <p className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/80 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                  Your provider will review this registration before activating your account.
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-3.5 sm:px-5">
              {serverError && <div className="mb-3"><AuthErrorBanner message={serverError} /></div>}
              <AuthWizardNav
                showBack={step > 0}
                onBack={goBack}
                onContinue={goNext}
                onSubmit={() => void submitRegistrationForm()}
                isReviewStep={isReviewStep}
                continueLabel="Continue"
                submitLabel={isProvider ? "Create provider account" : "Submit registration"}
                loading={isSubmitting}
                submitDisabled={isReviewStep && !confirmedReview}
              />
            </div>
          </AuthGlassCard>

          <p className="mt-4 text-center text-[13px] text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-dark">Sign in</Link>
          </p>
        </form>
      )}
    </SignupShell>
  );
}

function ReviewPanel({
  role,
  values,
  orgLabel,
  accent,
  confirmed,
  onConfirmChange,
}: {
  role: SignupRole;
  values: SignupFormValues;
  orgLabel?: string;
  accent: string;
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Name", value: `${values.first_name} ${values.last_name}`.trim() },
    { label: "Email", value: values.email },
    { label: "Phone", value: values.phone },
  ];

  if (role === "admin") {
    rows.unshift({ label: "Company", value: values.company_name });
  } else {
    rows.unshift({ label: "Provider", value: orgLabel ?? "—" });
  }
  if (role === "school_contact") {
    rows.push(
      { label: "School", value: values.school_name },
      { label: "Students", value: values.estimated_student_count ? String(values.estimated_student_count) : "—" },
      { label: "District", value: values.district || "—" },
      { label: "Campus", value: [values.city, values.state].filter(Boolean).join(", ") || "—" },
    );
  }
  if (role === "driver") {
    rows.push({ label: "License", value: values.license_number || "Not provided" });
  }
  if (role === "parent" && values.child_first_name) {
    rows.push({ label: "Child", value: `${values.child_first_name} ${values.child_last_name}`.trim() });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/90 to-white p-5">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Review your details</p>
        <dl className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-4 border-b border-slate-100/80 pb-3 last:border-0 last:pb-0">
              <dt className="text-sm text-slate-500">{r.label}</dt>
              <dd className="text-right text-sm font-semibold text-brand-secondary">{r.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirmChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
        />
        <span className="text-sm leading-relaxed text-slate-600">
          I confirm this information is accurate
          {role !== "admin" && " and understand my account requires provider approval before I can sign in"}.
        </span>
      </label>

      {!confirmed && (
        <p className="text-center text-xs text-slate-400">Check the box above to enable submission</p>
      )}

      <div className="h-0.5 rounded-full opacity-40" style={{ background: accent }} />
    </div>
  );
}

function RoleIconBus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16h16M6 16V8a2 2 0 012-2h8a2 2 0 012 2v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function RoleIconPerson() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function RoleIconSchool() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L3 8.5 12 14l9-5.5L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function RoleIconFamily() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 11a3 3 0 100-6 3 3 0 000 6zM5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
