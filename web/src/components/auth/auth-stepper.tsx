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
}: {
  steps: AuthStep[];
  current: number;
  accent: string;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    active && "scale-110 text-white shadow-lg",
                    done && !active && "text-white",
                    !done && !active && "bg-slate-100 text-slate-400",
                  )}
                  style={active || done ? { background: accent } : undefined}
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
                    "hidden text-[10px] font-semibold uppercase tracking-wide sm:block",
                    active ? "text-slate-800" : "text-slate-400",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-2 mb-5 h-px flex-1 sm:mx-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: done ? accent : "#e2e8f0",
                      opacity: done ? 1 : 0.6,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 sm:mt-2">
        <p className="text-lg font-bold tracking-tight text-brand-secondary">{steps[current]?.title}</p>
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
    ? { background: accent, boxShadow: `0 8px 24px -6px ${accent}66` }
    : undefined;

  return (
    <div className="flex gap-3">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-2xl border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {backLabel}
        </button>
      )}
      {isReviewStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || submitDisabled}
          className="fp-auth-btn flex-1 rounded-2xl"
          style={btnStyle}
        >
          {loading ? "Submitting…" : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="fp-auth-btn flex-1 rounded-2xl"
          style={btnStyle}
        >
          {continueLabel}
        </button>
      )}
    </div>
  );
}
