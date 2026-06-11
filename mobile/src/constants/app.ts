import type { UserRole } from '@/lib/types';

/** Mobile app is for drivers and parents only — staff use the web dashboard. */
export const MOBILE_ROLES = ['driver', 'parent'] as const satisfies readonly UserRole[];

export type MobileRole = (typeof MOBILE_ROLES)[number];

export function isMobileRole(role: string | undefined): role is MobileRole {
  return role === 'driver' || role === 'parent';
}

/** Resolve driver/parent from persisted user payload (role column or roles slugs). */
export function getMobileRole(user: { role?: string; roles?: string[] } | null | undefined): MobileRole | null {
  if (!user) return null;
  if (isMobileRole(user.role)) return user.role;
  const slug = user.roles?.find((r) => r === 'driver' || r === 'parent');
  return isMobileRole(slug) ? slug : null;
}

export const MOBILE_ROLE_DENIED_MESSAGE =
  'This app is for drivers and parents. Please sign in on the web dashboard for staff access.';

export function mobileHomeHref(role: MobileRole): '/home' | '/today' {
  return role === 'parent' ? '/home' : '/today';
}
