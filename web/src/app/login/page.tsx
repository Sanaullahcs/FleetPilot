"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { loginSchema, readAuthFormValues, type LoginFormValues } from "@/lib/auth-validation";
import { toastError } from "@/lib/alerts";
import { useAuthStore } from "@/store/auth";
import {
  AuthDemoPills,
  AuthErrorBanner,
  AuthField,
  AuthFormHeading,
  AuthInput,
  AuthSubmitButton,
  LoginShell,
} from "@/components/auth/auth-shell";
import { WEB_DEMO_ACCOUNTS } from "@/lib/demo-accounts";
import { getDashboardHomePath } from "@/lib/portal";

const demoAccounts = [...WEB_DEMO_ACCOUNTS];

export default function LoginPage() {
  const router = useRouter();
  const { token, hydrated, user, setSession } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (hydrated && token && user) router.replace(getDashboardHomePath(user.role));
  }, [hydrated, token, user, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    clearErrors();
    try {
      const res = await login(values.email, values.password);
      setSession(res.access_token, res.user);
      setRedirecting(true);
      router.replace(getDashboardHomePath(res.user.role));
    } catch (error) {
      const msg = getApiErrorMessage(error, "Email or password is incorrect. Please try again.");
      setServerError(msg);
      toastError("Sign in failed", msg);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const synced = readAuthFormValues(event.currentTarget);
    setValue("email", synced.email, { shouldValidate: false });
    setValue("password", synced.password, { shouldValidate: false });
    void handleSubmit(onSubmit)(event);
  };

  const fillDemo = ({ email, password }: { email: string; password: string }) => {
    setServerError(null);
    clearErrors();
    setValue("email", email, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
    setValue("password", password, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
  };

  const selectedEmail = watch("email");

  return (
    <LoginShell>
      <AuthFormHeading title="Sign in" description="Enter your email and password to access your account." />

      <div className="mt-7">
        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          <AuthField label="Email" error={errors.email?.message}>
            <AuthInput
              id="email"
              type="email"
              icon="email"
              autoComplete="username"
              placeholder="you@district.org"
              {...register("email")}
            />
          </AuthField>

          <AuthField label="Password" error={errors.password?.message}>
            <div className="relative">
              <AuthInput
                id="password"
                type={showPassword ? "text" : "password"}
                icon="lock"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </AuthField>

          {serverError && <AuthErrorBanner message={serverError} />}

          <div className="pt-1">
            <AuthSubmitButton
              loading={isSubmitting || redirecting}
              loadingLabel={redirecting ? "Opening workspace…" : "Signing in…"}
            >
              Sign in
            </AuthSubmitButton>
          </div>
        </form>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-primary hover:text-brand-dark">
            Sign up
          </Link>
        </p>

        <div className="mt-7">
          <AuthDemoPills accounts={demoAccounts} onSelect={fillDemo} selectedEmail={selectedEmail} />
        </div>
      </div>
    </LoginShell>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.5 10.677a2.25 2.25 0 002.622 2.622M7.362 7.561C5.68 8.687 4.5 10.001 4.5 12c0 3 4.5 7.5 7.5 7.5 1.314 0 2.628-.405 3.754-1.087M14.121 14.121A2.25 2.25 0 009.88 9.88"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
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
