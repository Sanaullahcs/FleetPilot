"use client";

import Link from "next/link";
import { brand } from "@/lib/brand";
import { FleetPilotLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/* ─── Shared chrome ─── */

export function AuthPageShell({
  children,
  footer,
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8f9fc]">
      <AuthMeshBackground />
      <AuthHeader logoHref={logoHref} ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <div className="relative flex flex-1 flex-col">{children}</div>
      {footer && (
        <p className="relative z-10 pb-8 text-center text-sm text-slate-500">{footer}</p>
      )}
    </main>
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
    <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 items-center gap-10 px-5 py-10 sm:px-8 lg:gap-16 lg:px-14 lg:py-12">
      <aside className="hidden w-[min(480px,42%)] shrink-0 lg:block">{aside}</aside>
      <div className="mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-none lg:flex-1">{children}</div>
    </div>
  );
}

export function AuthCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[680px] flex-1 px-5 py-8 sm:px-8 lg:px-14 lg:py-10">
      {children}
    </div>
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
    <header className="relative z-20 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-14">
        <FleetPilotLogo
          href={logoHref}
          subtitle="K-12 transportation platform"
          subtitleClassName="hidden sm:block"
          size={48}
        />

        <Link
          href={ctaHref}
          className="shrink-0 rounded-full border border-brand-primary/15 bg-brand-primary/5 px-4 py-2 text-sm font-semibold text-brand-primary transition hover:border-brand-primary/25 hover:bg-brand-primary/10 sm:px-5 sm:py-2.5"
        >
          {ctaLabel}
          <span className="ml-1.5 inline-block opacity-70" aria-hidden>→</span>
        </Link>
      </div>
    </header>
  );
}

function AuthMeshBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 20%, ${brand.primaryLight} 0%, transparent 42%),
            radial-gradient(circle at 85% 10%, ${brand.accentLight} 0%, transparent 38%),
            radial-gradient(circle at 70% 85%, ${brand.cyanLight} 0%, transparent 35%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F5BA9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}

export function AuthHeroPanel() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-10 shadow-[0_20px_60px_-20px_rgba(79,91,169,0.18)]">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-50 blur-3xl"
        style={{ background: brand.primaryLight }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full opacity-60 blur-3xl"
        style={{ background: brand.accentLight }}
      />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary/70">FleetPilot</p>
        <h2 className="mt-4 text-[2rem] font-bold leading-[1.15] tracking-tight text-brand-secondary">
          Student transportation,
          <span className="mt-1 block text-brand-primary">managed with confidence.</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-500">
          Routes, drivers, schools, and parent communication — one modern workspace for K-12 operators.
        </p>
        <ul className="mt-10 space-y-4">
          {[
            { title: "Live dispatch", desc: "Real-time routes, runs, and fleet visibility", bg: brand.accentLight, dot: brand.accent },
            { title: "School-ready", desc: "Enrollment, stops, and bell-time routing", bg: brand.orangeLight, dot: brand.orange },
            { title: "Secure access", desc: "Role-based tools for every stakeholder", bg: brand.cyanLight, dot: brand.cyan },
          ].map((item) => (
            <li key={item.title} className="flex gap-4 rounded-2xl p-3" style={{ background: item.bg }}>
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: item.dot }} />
              <div>
                <p className="text-sm font-semibold text-brand-secondary">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AuthGlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_20px_60px_-20px_rgba(79,91,169,0.15)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* Legacy exports — thin wrappers */
export function LoginShell({
  children,
  footer,
  aside,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <AuthPageShell footer={footer} ctaHref="/signup" ctaLabel="Create account">
      <AuthSplitLayout aside={aside ?? <AuthHeroPanel />}>{children}</AuthSplitLayout>
    </AuthPageShell>
  );
}

export function SignupShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <AuthPageShell footer={footer} ctaHref="/login" ctaLabel="Sign in">
      <AuthCenterLayout>{children}</AuthCenterLayout>
    </AuthPageShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <LoginShell footer={footer}>
      <AuthGlassCard>
        <div className="border-b border-slate-100/80 px-7 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-brand-secondary">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="px-7 py-6">{children}</div>
      </AuthGlassCard>
    </LoginShell>
  );
}

export function AuthField({
  label,
  error,
  children,
  hint,
  valid,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  valid?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-[13px] font-semibold text-slate-700">{label}</label>
        {valid && !error && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Valid
          </span>
        )}
      </div>
      <div className={cn(error && "[&_.fp-input]:border-red-300 [&_.fp-input]:ring-red-100")}>{children}</div>
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

export function AuthSubmitButton({
  loading,
  children,
  onClick,
  type = "submit",
  accent,
}: {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  accent?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="fp-auth-btn w-full"
      style={accent ? { background: accent, boxShadow: `0 8px 24px -6px ${accent}66` } : undefined}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3.5 text-sm text-red-700" role="alert">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 5.5v4M9 11.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {message}
    </div>
  );
}

export function AuthSuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3.5 text-sm text-emerald-800" role="status">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <path d="M4 9.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}
