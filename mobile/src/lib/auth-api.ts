import { apiRequest } from '@/lib/api';
import type { AuthUser, LoginResponse } from '@/lib/types';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiRequest<{ data: AuthUser }>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network/expiry errors; the client clears state regardless.
  }
}
