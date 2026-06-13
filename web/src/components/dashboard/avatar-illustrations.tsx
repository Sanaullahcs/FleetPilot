import { useId } from "react";
import type { UserGender } from "@/lib/gender-options";

export type IllustrationGender = "male" | "female" | "neutral";

export function resolveIllustrationGender(gender?: UserGender | null): IllustrationGender {
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "neutral";
}

type IllustrationProps = {
  gender: IllustrationGender;
  accent?: string;
  className?: string;
};

/** Minimal bust silhouette on role-colored gradient — placeholder only. */
export function AvatarIllustration({ gender, accent = "#4F5BA9", className }: IllustrationProps) {
  const gradId = useId().replace(/:/g, "");
  const light = "rgba(255,255,255,0.92)";
  const soft = "rgba(255,255,255,0.55)";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradId})`} />
      <ellipse cx="50" cy="88" rx="36" ry="18" fill={soft} />
      <circle cx="50" cy="38" r="18" fill={light} />
      {gender === "male" ? (
        <path d="M32 36 Q32 22 50 20 Q68 22 68 36 L68 42 Q50 46 32 42 Z" fill={soft} />
      ) : null}
      {gender === "female" ? (
        <path d="M30 38 Q30 18 50 16 Q70 18 70 38 L72 54 Q50 60 28 54 Z" fill={soft} />
      ) : null}
      {gender === "neutral" ? (
        <path d="M32 34 Q32 22 50 20 Q68 22 68 34 Q68 40 50 42 Q32 40 32 34 Z" fill={soft} />
      ) : null}
    </svg>
  );
}
