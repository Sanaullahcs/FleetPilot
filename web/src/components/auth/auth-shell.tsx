"use client";

import { forwardRef, useId } from "react";
import Link from "next/link";
import { FleetPilotLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";

/* ─── Page chrome ─── */

export function AuthPageShell({
  children,
  ctaHref,
  ctaLabel,
  logoHref = "/login",
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
  logoHref?: string;
}) {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#FAFBFC]">
      <AuthHeader logoHref={logoHref} ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <div className="flex min-h-0 flex-1">{children}</div>
    </main>
  );
}

function AuthHeader({
  logoHref,
  ctaHref,
  ctaLabel,
}: {
  logoHref: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <header className="z-20 w-full shrink-0 border-b border-slate-200/70 bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <FleetPilotLogo
          href={logoHref}
          subtitle="K-12 transportation platform"
          subtitleClassName="hidden sm:block"
          size={40}
        />

        <Link href={ctaHref} className="auth-header-cta group shrink-0">
          <span>{ctaLabel}</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

export function AuthSplitLayout({
  aside,
  children,
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1">
      <aside className="hidden min-h-0 w-[46%] shrink-0 lg:block xl:w-1/2">{aside}</aside>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}

export function AuthCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center px-5 py-8 sm:px-8">
      {children}
    </div>
  );
}

/* ─── Left brand panel ─── */

function HeroArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="opacity-90">
      <path
        d="M2 7h8M7.5 4.5L10 7l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="2" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function HeroBulletLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[0.2em] shrink-0 text-sky-300 [&_svg]:block">
        <HeroArrow />
      </span>
      <span className="min-w-0 leading-snug">{children}</span>
    </li>
  );
}

type HeroFeature = {
  title: string;
  desc: string;
  Icon: () => React.ReactNode;
  mobileStores?: { iosHref?: string; androidHref?: string };
};

function HeroStoreBadges({
  iosHref,
  androidHref,
}: {
  iosHref?: string;
  androidHref?: string;
}) {
  const wrapClass =
    "inline-flex shrink-0 overflow-hidden rounded-[6px] shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

  return (
    <div className="flex items-center gap-1.5">
      {iosHref ? (
        <a href={iosHref} className={wrapClass} title="Download on the App Store" aria-label="Download on the App Store">
          <AppStoreBadgeIcon size={22} />
        </a>
      ) : (
        <span className={wrapClass} title="Download on the App Store" aria-label="Download on the App Store">
          <AppStoreBadgeIcon size={22} />
        </span>
      )}
      {androidHref ? (
        <a href={androidHref} className={wrapClass} title="Get it on Google Play" aria-label="Get it on Google Play">
          <GooglePlayBadgeIcon size={22} />
        </a>
      ) : (
        <span className={wrapClass} title="Get it on Google Play" aria-label="Get it on Google Play">
          <GooglePlayBadgeIcon size={22} />
        </span>
      )}
    </div>
  );
}

export function AuthHeroPanel({ variant = "login" }: { variant?: "login" | "signup" }) {
  const isSignup = variant === "signup";

  const features: HeroFeature[] = isSignup
    ? [
        { title: "Guided Setup", desc: "Step-by-step onboarding for your organization", Icon: IconSteps },
        { title: "Every Role", desc: "Provider, school, driver, and parent accounts", Icon: IconUsers },
        { title: "Verified Access", desc: "Admin approval workflow before going live", Icon: IconShield },
      ]
    : [
        {
          title: "Web Portal",
          desc: "Dispatch, live radar, routes, fleet, messaging, alerts, and complaints",
          Icon: IconSignal,
        },
        {
          title: "Driver App",
          desc: "Runs, schedule, manifests, alerts, messaging, and complaints",
          Icon: IconDriverApp,
          mobileStores: {},
        },
        {
          title: "Parent App",
          desc: "Child tracking, schedules, alerts, messaging, and complaints",
          Icon: IconParentApp,
          mobileStores: {},
        },
      ];

  return (
    <div className="auth-hero relative flex h-full w-full flex-col justify-between overflow-hidden p-10 xl:p-14">
      <div className="auth-hero-pattern absolute inset-0" aria-hidden />
      <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" aria-hidden />
      <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full border border-white/10" aria-hidden />

      <div className="relative pt-4 xl:pt-8">
        <p className="text-sm text-white/70">
          Web dashboard · Driver app · Parent app
        </p>

        <h2 className="fp-auth-display-hero mt-4">
          {isSignup ? (
            <>
              <span className="block">Join your district&apos;s</span>
              <span className="block text-sky-300">transportation network.</span>
            </>
          ) : (
            <>
              <span className="block">District transportation</span>
              <span className="block text-sky-300">Web and Mobile Apps.</span>
            </>
          )}
        </h2>

        <ul className="mt-4 flex max-w-xl flex-col gap-1.5 list-none p-0 pr-2 text-[14px] text-white/65">
          {isSignup ? (
            <>
              <HeroBulletLine>Register as a provider, school, driver, or parent.</HeroBulletLine>
              <HeroBulletLine>
                Schools can manage students, parents, and routes, send messages, and handle complaints on the web.
              </HeroBulletLine>
              <HeroBulletLine>
                Drivers can view runs and manifests, receive alerts, message on the road, and report complaints on mobile.
              </HeroBulletLine>
              <HeroBulletLine>
                Parents can track their children, follow schedules, receive alerts, and message schools or drivers in realtime.
              </HeroBulletLine>
            </>
          ) : (
            <>
              <HeroBulletLine>
                Schools can manage students, parents, and routes, send messages, and handle complaints on the web.
              </HeroBulletLine>
              <HeroBulletLine>
                Dispatch can plan runs, monitor live radar, coordinate drivers, and manage alerts from the web dashboard.
              </HeroBulletLine>
              <HeroBulletLine>
                Drivers can view assignments and manifests, receive alerts, message schools or parents, and report complaints on mobile.
              </HeroBulletLine>
              <HeroBulletLine>
                Parents can track their children, follow schedules, receive alerts, message drivers or schools, and register complaints.
              </HeroBulletLine>
            </>
          )}
        </ul>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-white/15 bg-white/[0.08] p-3.5 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-white/90">
                <f.Icon />
              </span>
              {f.mobileStores ? (
                <HeroStoreBadges
                  iosHref={f.mobileStores.iosHref}
                  androidHref={f.mobileStores.androidHref}
                />
              ) : null}
            </div>
            <p className="mt-2.5 text-[13px] font-semibold text-white">{f.title}</p>
            <p className="mt-0.5 line-clamp-2 min-h-[2.75rem] text-[11px] leading-[1.375rem] text-white/55">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shells ─── */

export function LoginShell({
  children,
  aside,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <AuthPageShell ctaHref="/signup" ctaLabel="Create Account">
      <AuthSplitLayout aside={aside ?? <AuthHeroPanel variant="login" />}>
        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </AuthSplitLayout>
    </AuthPageShell>
  );
}

export function SignupShell({
  children,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <AuthPageShell ctaHref="/login" ctaLabel="Sign In">
      <AuthSplitLayout aside={<AuthHeroPanel variant="signup" />}>
        <div className="flex flex-1 justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </AuthSplitLayout>
    </AuthPageShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <LoginShell>
      <AuthFormHeading title={title} description={subtitle} />
      <div className="mt-7">{children}</div>
    </LoginShell>
  );
}

/* ─── Form primitives ─── */

export function AuthFormHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="fp-auth-display-form">{title}</h1>
      {description ? <p className="fp-subtitle mt-3">{description}</p> : null}
    </div>
  );
}

export function AuthGlassCard({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div className={cn("auth-card overflow-hidden", className)}>
      {accent ? (
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}33)` }} />
      ) : null}
      {children}
    </div>
  );
}

export function AuthCardHeader({
  eyebrow,
  title,
  description,
  compact,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("px-5 sm:px-6", compact ? "pb-3 pt-5" : "pb-4 pt-6")}>
      {eyebrow ? <p className="fp-subtitle text-slate-400">{eyebrow}</p> : null}
      <h1 className={cn("fp-auth-display-form", compact ? "mt-2 !text-2xl sm:!text-3xl" : "mt-2")}>
        {title}
      </h1>
      {description ? <p className="fp-subtitle mt-2">{description}</p> : null}
    </div>
  );
}

export function AuthField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  valid?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</label>
      <div className={cn(error && "[&_.fp-auth-input]:border-red-300 [&_.fp-auth-input]:ring-red-100 [&_.fp-input]:border-red-300")}>
        {children}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export const AuthInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: "mail" | "email" | "lock" | "user" | "phone";
  }
>(function AuthInput({ className, icon, ...props }, ref) {
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          <AuthInputIcon type={icon} />
        </span>
      ) : null}
      <input ref={ref} className={cn("fp-auth-input", icon && "pl-10", className)} {...props} />
    </div>
  );
});

function AuthInputIcon({ type }: { type: "mail" | "email" | "lock" | "user" | "phone" }) {
  if (type === "mail" || type === "email") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 7l9 6 9-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "lock") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V8a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "phone") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 4h2l1 4-2 1a11 11 0 005 5l1-2 4 1v2a2 2 0 01-2 2A14 14 0 018 6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AuthSubmitButton({
  loading,
  loadingLabel = "Please wait…",
  children,
  onClick,
  type = "submit",
}: {
  loading?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  accent?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={loading} className="fp-auth-btn group w-full">
      {loading ? (
        loadingLabel
      ) : (
        <span className="inline-flex items-center justify-center gap-2 leading-none">
          {children}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-red-200/80 bg-red-50 px-3.5 py-3 text-[13px] text-red-700" role="alert">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 5.5v4M9 11.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

export function AuthSuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3.5 py-3 text-[13px] text-emerald-800" role="status">
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <path d="M4 9.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}

export function AuthDemoPills({
  accounts,
  onSelect,
  selectedEmail,
}: {
  accounts: { label: string; email: string; password?: string; accent: string }[];
  onSelect: (account: { email: string; password: string }) => void;
  selectedEmail?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <p className="shrink-0 text-sm text-slate-500">Demo accounts</p>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {accounts.slice(0, 4).map((acc) => {
            const active = selectedEmail === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => onSelect({ email: acc.email, password: acc.password ?? DEMO_PASSWORD })}
                className={cn("auth-demo-pill shrink-0", active && "auth-demo-pill-active")}
                aria-pressed={active}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: acc.accent }} />
                <span>{acc.label}</span>
              </button>
            );
          })}
        </div>
        {accounts.length > 4 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {accounts.slice(4).map((acc) => {
              const active = selectedEmail === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => onSelect({ email: acc.email, password: acc.password ?? DEMO_PASSWORD })}
                  className={cn("auth-demo-pill shrink-0", active && "auth-demo-pill-active")}
                  aria-pressed={active}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: acc.accent }} />
                  <span>{acc.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthRoleGrid({
  roles,
  selected,
  onSelect,
  compact,
}: {
  roles: { id: string; label: string; short: string; description: string; accent: string; Icon: () => React.ReactNode }[];
  selected: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {roles.map((r) => {
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              title={r.description}
              className={cn(
                "auth-role-card flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-center sm:gap-1.5 sm:px-2 sm:py-2.5",
                active && "auth-role-card-active",
              )}
              style={active ? { borderColor: `${r.accent}66` } : undefined}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition",
                  active ? "text-white" : "bg-slate-100 text-slate-500",
                )}
                style={active ? { background: r.accent } : undefined}
              >
                <r.Icon />
              </span>
              <span className={cn("max-w-full text-[9px] font-bold leading-snug sm:text-[10px]", active ? "text-brand-secondary" : "text-slate-500")}>
                {r.short}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {roles.map((r) => {
        const active = selected === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn("auth-role-card p-4 text-left", active && "auth-role-card-active")}
            style={active ? { borderColor: `${r.accent}66` } : undefined}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
                  active ? "text-white" : "bg-slate-100 text-slate-500",
                )}
                style={active ? { background: r.accent } : undefined}
              >
                <r.Icon />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-bold", active ? "text-brand-secondary" : "text-slate-700")}>{r.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{r.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Hero icons ─── */

function IconSignal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V13M12 19V5M19 19v-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconSchool() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4L3 9l9 5 9-5-9-5zM6.5 11v5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 11.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSteps() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 17h5v-5h5V7h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5M16 5.5a3 3 0 010 5.5M17.5 14.5c1.8.7 3 2.3 3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16v10H8l-4 4V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconDriverApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      <path d="M9.5 6.5h5M10 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconParentApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      <circle cx="10" cy="8.5" r="1.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 12.5c0-1.2 1.6-2 3.5-2s3.5.8 3.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AppStoreBadgeIcon({ size = 22 }: { size?: number }) {
  const gradId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2ACAFF" />
          <stop offset="1" stopColor="#007AFF" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill={`url(#${gradId})`} />
      <path
        fill="#fff"
        d="M16.02 12.73c.02-2.08 1.7-3.08 1.77-3.13-0.96-1.4-2.46-1.59-2.99-1.61-1.27-.13-2.49.75-3.14.75-.65 0-1.66-.73-2.73-.71-1.4.02-2.7.82-3.42 2.08-1.46 2.54-.37 6.3 1.05 8.37.7 1.01 1.53 2.14 2.62 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.63.68 2.72.66 1.12-.02 1.83-1.03 2.52-2.05.8-1.16 1.13-2.29 1.15-2.35-.03-.01-2.21-.85-2.23-3.37zm-2.08-6.17c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.54.63-1.01 1.64-.88 2.61.93.07 1.88-.47 2.46-1.21z"
      />
    </svg>
  );
}

function GooglePlayBadgeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5.5" fill="#fff" />
      <path
        fill="#4285F4"
        d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5Z"
      />
      <path
        fill="#34A853"
        d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12Z"
      />
      <path
        fill="#FBBC04"
        d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81Z"
      />
      <path
        fill="#EA4335"
        d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"
      />
    </svg>
  );
}
