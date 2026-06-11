import { apiRequest } from '@/lib/api';
import { unregisterPushNotificationsFromBackend } from '@/lib/push-notifications';
import { useAuthStore } from '@/store/auth';
import type { QueryClient } from '@tanstack/react-query';
import type {
  RegisterPayload,
  SignupAdmin,
  SignupOrganization,
  SignupSchool,
} from '@/lib/auth-signup';
import type { AuthUser, LoginResponse } from '@/lib/types';

export type { RegisterPayload, SignupAdmin, SignupOrganization, SignupRole, SignupSchool } from '@/lib/auth-signup';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function fetchSignupOrganizations(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<{ data: SignupOrganization[] }>(`/auth/signup/organizations${query}`, {
    auth: false,
  }).then((r) => r.data);
}

export function fetchSignupAdmins(organizationId: string) {
  return apiRequest<{ data: SignupAdmin[] }>(`/auth/signup/organizations/${organizationId}/admins`, {
    auth: false,
  }).then((r) => r.data);
}

export function fetchSignupSchools(organizationId: string) {
  return apiRequest<{ data: SignupSchool[] }>(`/auth/signup/organizations/${organizationId}/schools`, {
    auth: false,
  }).then((r) => r.data);
}

/** Same endpoint and payload as web dashboard signup. */
export function register(payload: RegisterPayload) {
  return apiRequest<{ message: string; data?: { user_id: string } }>('/auth/signup/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiRequest<{ data: AuthUser }>('/auth/me');
  return res.data;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  password?: string;
  password_confirmation?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const res = await apiRequest<{ message: string; data: AuthUser }>('/auth/me', {
    method: 'PUT',
    body: payload,
  });
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network/expiry errors; the client clears state regardless.
  }
}

/** Clears server session, local credentials, and cached API data. */
export async function signOut(options?: { queryClient?: QueryClient }): Promise<void> {
  await unregisterPushNotificationsFromBackend();
  await logout();
  await useAuthStore.getState().clear();
  options?.queryClient?.clear();
}

export async function deleteAccount(password: string): Promise<void> {
  await apiRequest('/auth/account', {
    method: 'DELETE',
    body: { password, confirmation: 'DELETE' },
  });
}
