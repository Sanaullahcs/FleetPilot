import { api } from "@/lib/api";
import type { AuthUser, LoginResponse, OrganizationSummary, School, UserRole } from "@/lib/types";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>("/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignore network/expiry errors on logout; the client clears state regardless.
  }
}

export interface SignupAdmin {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

export interface SignupOrganization extends OrganizationSummary {
  email?: string | null;
  phone?: string | null;
}

export async function fetchSignupOrganizations(search?: string): Promise<SignupOrganization[]> {
  const { data } = await api.get<{ data: SignupOrganization[] }>("/auth/signup/organizations", {
    params: search ? { search } : undefined,
  });
  return data.data;
}

export async function fetchSignupAdmins(organizationId: string): Promise<SignupAdmin[]> {
  const { data } = await api.get<{ data: SignupAdmin[] }>(
    `/auth/signup/organizations/${organizationId}/admins`,
  );
  return data.data;
}

export async function fetchSignupSchools(organizationId: string): Promise<School[]> {
  const { data } = await api.get<{ data: School[] }>(
    `/auth/signup/organizations/${organizationId}/schools`,
  );
  return data.data;
}

export type SignupRole = "admin" | "driver" | "school_contact" | "parent";

export interface RegisterPayload {
  role: SignupRole;
  // Provider / org
  company_name?: string;
  company_phone?: string;
  company_email?: string;
  website?: string;
  timezone?: string;
  organization_id?: string;
  admin_user_id?: string;
  school_id?: string;
  // Account
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  // Address
  address: string;
  city: string;
  state: string;
  zip: string;
  // Driver
  employee_id?: string;
  license_number?: string;
  license_state?: string;
  license_expiry?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  // School contact
  school_name?: string;
  school_code?: string;
  district?: string;
  grade_levels?: string;
  estimated_student_count?: number;
  school_phone?: string;
  school_website?: string;
  principal_name?: string;
  job_title?: string;
  department?: string;
  // Parent
  relationship?: string;
  child_first_name?: string;
  child_last_name?: string;
  child_grade?: string;
}

export async function register(payload: RegisterPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/signup/register", payload);
  return data;
}
