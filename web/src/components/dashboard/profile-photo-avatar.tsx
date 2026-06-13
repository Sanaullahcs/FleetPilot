"use client";

import { useState, type ReactNode } from "react";
import {
  AvatarIllustration,
  resolveIllustrationGender,
} from "@/components/dashboard/avatar-illustrations";
import {
  OrgIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/dashboard/stat-icons";
import { brand } from "@/lib/brand";
import type { UserGender, UserRole } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "h-8 w-8 rounded-lg text-[10px]",
  md: "h-10 w-10 rounded-xl text-xs",
  lg: "h-14 w-14 rounded-xl text-sm",
  xl: "h-[4.5rem] w-[4.5rem] rounded-2xl text-base",
};

export function roleAccent(role?: UserRole): string {
  switch (role) {
    case "driver":
      return brand.cyan;
    case "parent":
      return brand.primary;
    case "contractor":
      return brand.orange;
    case "school_contact":
      return brand.accent;
    case "dispatcher":
      return brand.chart[6];
    case "super_admin":
      return brand.primaryDark;
    default:
      return brand.primary;
  }
}

export function ProfilePhotoAvatar({
  name,
  seed,
  role,
  gender,
  size = "md",
  photoUrl,
  className,
}: {
  name: string;
  seed?: string;
  role?: UserRole;
  gender?: UserGender | null;
  size?: AvatarSize;
  photoUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const accent = roleAccent(role);
  const showUpload = Boolean(photoUrl) && !failed;
  const illustrationGender = resolveIllustrationGender(gender);

  return (
    <div className={cn("relative shrink-0", className)} aria-hidden>
      <div
        className={cn(
          "relative overflow-hidden border-2 border-white shadow-sm",
          SIZE_CLASS[size],
        )}
        style={{ boxShadow: `0 0 0 2px ${accent}33` }}
      >
        {showUpload ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl!}
            alt=""
            className="h-full w-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        ) : (
          <AvatarIllustration gender={illustrationGender} accent={accent} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

export function ProfileMetaChip({
  icon,
  label,
  value,
  accent = brand.primary,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex min-w-[8.5rem] flex-1 items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3.5 [&_svg]:w-3.5"
        style={{ background: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 3h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5v3a1.5 1.5 0 01-1.5 1.5C9.6 17.5 6.5 14.4 6.5 9.5A1.5 1.5 0 018 8V6.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 10h4M14 14h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function profileRoleLabel(role: UserRole) {
  return titleCase(role.replace(/_/g, " "));
}

export { PhoneIcon, IdIcon, OrgIcon, ShieldIcon, UserIcon };
