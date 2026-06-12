import { API_URL } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Unable to connect to ${API_URL}. Check Wi‑Fi, that the backend runs on 0.0.0.0:8000, and EXPO_PUBLIC_API_URL matches your PC IP.`,
      0,
    );
  }

  if (res.status === 401 && auth) {
    await useAuthStore.getState().clear();
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError('Invalid response from server.', res.status);
  }

  if (!res.ok) {
    const message = (data as { message?: string })?.message ?? 'Request failed.';
    throw new ApiError(message, res.status, (data as { errors?: Record<string, string[]> })?.errors);
  }

  return data as T;
}
