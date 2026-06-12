"use client";

import { cn } from "@/lib/utils";

export interface AuthStep {
  id: string;
  title: string;
  subtitle?: string;
}

export function AuthStepper({
  steps,
  current,
  accent,
  compact,
}: {
  steps: AuthStep[];
  current: number;
  accent: string;
  compact?: boolean;
}) {
  const progress = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;

  if (compact) {
    return (
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-400">
            {current + 1}/{steps.length}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                    active && "text-white shadow-md",
                    done && !active && "text-white",
                    !done && !active && "border border-slate-200 bg-white text-slate-400",
                  )}
                  style={active || done ? { background: accent } : undefined}
                >
                  {done && !active ? "✓" : i + 1}
                </span>
                <span className={cn("hidden truncate text-[9px] font-semibold sm:block", active ? "text-brand-secondary" : "text-slate-400")}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-2.5">
          <p className="text-base font-semibold text-slate-900">{steps[current]?.title}</p>
          {steps[current]?.subtitle && <p className="fp-subtitle">{steps[current].subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-7">
      <div className="relative mb-6 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }}
        />
      </div>

      <div className="flex items-start justify-between gap-1">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-2 last:flex-none">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  active && "scale-105 text-white shadow-lg ring-4 ring-white",
                  done && !active && "text-white",
                  !done && !active && "border border-slate-200 bg-white text-slate-400",
                )}
                style={active || done ? { background: accent, boxShadow: active ? `0 8px 24px -8px ${accent}88` : undefined } : undefined}
              >
                {done && !active ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden max-w-[4.5rem] text-center text-[10px] font-semibold leading-tight sm:block",
                  active ? "text-brand-secondary" : done ? "text-slate-600" : "text-slate-400",
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
        <p className="text-sm font-medium text-slate-500">
          Step {current + 1} of {steps.length}
        </p>
        <p className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-slate-900">
          {steps[current]?.title}
        </p>
        {steps[current]?.subtitle && (
          <p className="mt-0.5 text-sm text-slate-500">{steps[current].subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function AuthWizardNav({
  onBack,
  onContinue,
  onSubmit,
  continueLabel = "Continue",
  submitLabel = "Submit registration",
  backLabel = "Back",
  loading,
  showBack,
  isReviewStep,
  accent,
  submitDisabled,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  onSubmit?: () => void;
  continueLabel?: string;
  submitLabel?: string;
  backLabel?: string;
  loading?: boolean;
  showBack?: boolean;
  isReviewStep?: boolean;
  accent?: string;
  submitDisabled?: boolean;
}) {
  const btnStyle = accent
    ? { background: `linear-gradient(135deg, ${accent}, ${accent}dd)`, boxShadow: `0 10px 28px -8px ${accent}66` }
    : undefined;

  return (
    <div className="flex gap-3">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {backLabel}
        </button>
      )}
      {isReviewStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || submitDisabled}
          className="fp-auth-btn flex-1"
          style={btnStyle}
        >
          {loading ? "Submitting…" : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="fp-auth-btn flex-1"
          style={btnStyle}
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}
