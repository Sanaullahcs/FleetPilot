import { ApiError } from '@/lib/api';

export function getQueryErrorMessage(error: unknown, fallback = 'Unable to load data. Pull down to retry.'): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return error.message;
    }
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return 'You do not have access to this data.';
    }
    return error.message || fallback;
  }
  return fallback;
}
