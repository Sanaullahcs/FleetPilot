"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { useAuthStore } from "@/store/auth";
import {
  AuthField,
  AuthErrorBanner,
  AuthGlassCard,
  LoginShell,
} from "@/components/auth/auth-shell";
import { brand } from "@/lib/brand";

const schema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

const demoAccounts = [
  { label: "Admin", email: "admin@fleetpilot.test", accent: brand.primary },
  { label: "Dispatcher", email: "dispatch@fleetpilot.test", accent: brand.cyan },
  { label: "Driver", email: "driver@fleetpilot.test", accent: brand.accent },
  { label: "Parent", email: "parent@fleetpilot.test", accent: brand.orange },
];

export default function LoginPage() {
  const router = useRouter();
  const { token, hydrated, setSession } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const email = watch("email");

  useEffect(() => {
    if (hydrated && token) router.replace("/dashboard");
  }, [hydrated, token, router]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await login(values.email, values.password);
      setSession(res.access_token, res.user);
      toastSuccess("Welcome back", `Signed in as ${res.user.full_name}`);
      router.replace("/dashboard");
    } catch (error) {
      const msg = getApiErrorMessage(error, "Unable to sign in.");
      setServerError(msg);
      toastError("Sign in failed", msg);
    }
  };

  const fillDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "password", { shouldValidate: true });
  };

  return (
    <LoginShell
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand-primary hover:text-brand-dark">
            Create an account
          </Link>
        </>
      }
    >
      <AuthGlassCard>
        <div className="px-7 pb-2 pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Sign in</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-secondary">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Access your FleetPilot workspace</p>
        </div>

        <div className="px-7 pb-7 pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <AuthField
              label="Email address"
              error={errors.email?.message}
              valid={Boolean(touchedFields.email && !errors.email && email)}
            >
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register("email")}
                className="fp-input"
                placeholder="you@district.org"
              />
            </AuthField>

            <AuthField label="Password" error={errors.password?.message}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="fp-input pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </AuthField>

            {serverError && <AuthErrorBanner message={serverError} />}

            <button type="submit" disabled={isSubmitting} className="fp-auth-btn w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 p-4">
            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Demo accounts · password: password
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="group rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <span
                    className="mb-1.5 block h-0.5 w-6 rounded-full transition group-hover:w-8"
                    style={{ background: acc.accent }}
                  />
                  <span className="text-xs font-semibold text-brand-secondary">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </AuthGlassCard>
    </LoginShell>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M3 3l18 18M10.5 10.677a2.25 2.25 0 002.622 2.622M7.362 7.561C5.68 8.687 4.5 10.001 4.5 12c0 3 4.5 7.5 7.5 7.5 1.314 0 2.628-.405 3.754-1.087M14.121 14.121A2.25 2.25 0 009.88 9.88" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
