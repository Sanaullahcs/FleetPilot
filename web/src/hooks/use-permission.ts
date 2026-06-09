"use client";

import { useAuthStore } from "@/store/auth";

/**
 * Returns a checker for the current user's permissions. Admins implicitly pass.
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  return (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "super_admin") return true;
    return user.permissions.includes(permission);
  };
}
