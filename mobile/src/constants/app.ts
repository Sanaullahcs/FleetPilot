import type { UserRole } from '@/lib/types';

/** Mobile app is for drivers and parents only — staff use the web dashboard. */
export const MOBILE_ROLES = ['driver', 'parent'] as const satisfies readonly UserRole[];

export type MobileRole = (typeof MOBILE_ROLES)[number];

export function isMobileRole(role: string | undefined): role is MobileRole {
  return role === 'driver' || role === 'parent';
}

export const MOBILE_ROLE_DENIED_MESSAGE =
  'This app is for drivers and parents. Please sign in on the web dashboard for staff access.';
