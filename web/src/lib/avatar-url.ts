/** Avatar helpers — illustrated placeholders and student initials. */

import type { UserGender } from "@/lib/gender-options";

export type AvatarKind = "adult" | "student";

const STUDENT_GRADIENTS = [
  ["#4F5BA9", "#6B76C2"],
  ["#0EA5E9", "#38BDF8"],
  ["#06B6D4", "#22D3EE"],
  ["#8B5CF6", "#A78BFA"],
  ["#059669", "#34D399"],
  ["#D97706", "#FBBF24"],
] as const;

export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function studentAvatarGradient(seed?: string, name?: string): readonly [string, string] {
  const key = seed ?? name ?? "student";
  return STUDENT_GRADIENTS[hashString(key) % STUDENT_GRADIENTS.length];
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

/** @deprecated Use AvatarIllustration component — kept for student kind checks only. */
export function buildAvatarUrl(
  _name: string,
  _seed?: string,
  kind: AvatarKind = "adult",
  _gender?: UserGender | null,
): string | null {
  return kind === "student" ? null : null;
}
