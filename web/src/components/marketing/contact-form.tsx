"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { getApiErrorMessage } from "@/lib/api";

const schema = z.object({
  full_name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  organization_name: z.string().optional(),
  inquiry_type: z.enum(["demo", "pricing", "support", "partnership", "other"]),
  role_type: z.enum(["district", "contractor", "school", "other"]),
  fleet_size: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Tell us a bit more (at least 10 characters)."),
});

type FormValues = z.infer<typeof schema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export function MarketingContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      organization_name: "",
      inquiry_type: "demo",
      role_type: "district",
      fleet_size: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await axios.post(`${API_BASE}/marketing/contact`, values, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      setSubmitted(true);
      reset();
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to send your message. Please try again."));
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Message sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Thanks for reaching out. Our team will review your request and get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary/80"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{serverError}</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.full_name?.message} required>
          <input className="fp-mkt-input" placeholder="Jane Rivera" {...register("full_name")} />
        </Field>
        <Field label="Work email" error={errors.email?.message} required>
          <input className="fp-mkt-input" type="email" placeholder="jane@district.edu" {...register("email")} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input className="fp-mkt-input" type="tel" placeholder="(555) 123-4567" {...register("phone")} />
        </Field>
        <Field label="Organization" error={errors.organization_name?.message}>
          <input className="fp-mkt-input" placeholder="Metro K-12 Transportation" {...register("organization_name")} />
        </Field>
        <Field label="I am a..." error={errors.role_type?.message}>
          <select className="fp-mkt-input" {...register("role_type")}>
            <option value="district">District administrator</option>
            <option value="contractor">Contractor / operator</option>
            <option value="school">School contact</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Fleet size" error={errors.fleet_size?.message}>
          <select className="fp-mkt-input" {...register("fleet_size")}>
            <option value="">Select range</option>
            <option value="1-25">1–25 vehicles</option>
            <option value="26-75">26–75 vehicles</option>
            <option value="76-150">76–150 vehicles</option>
            <option value="150+">150+ vehicles</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Inquiry type" error={errors.inquiry_type?.message}>
          <select className="fp-mkt-input" {...register("inquiry_type")}>
            <option value="demo">Request a demo</option>
            <option value="pricing">Pricing question</option>
            <option value="support">Product support</option>
            <option value="partnership">Partnership</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Subject" error={errors.subject?.message}>
          <input className="fp-mkt-input" placeholder="Pilot for fall routes" {...register("subject")} />
        </Field>
      </div>

      <Field label="Message" error={errors.message?.message} required>
        <textarea
          className="fp-mkt-input min-h-[140px] resize-y"
          placeholder="Tell us about your district, current tools, and what you are hoping FleetPilot can help with."
          {...register("message")}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-brand-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
