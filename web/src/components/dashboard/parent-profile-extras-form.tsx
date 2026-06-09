"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Field, FormSection } from "@/components/ui/form-section";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";

interface ParentProfileData {
  user: {
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  parent: {
    relationship: string | null;
    preferred_language: string | null;
    notification_preferences: {
      push?: boolean;
      sms?: boolean;
      email?: boolean;
    } | null;
    children_count: number;
  } | null;
}

async function fetchParentProfile() {
  const { data } = await api.get<{ data: ParentProfileData }>("/parent/profile");
  return data.data;
}

async function updateParentProfile(payload: {
  relationship?: string | null;
  preferred_language?: string | null;
  notification_preferences?: { push?: boolean; sms?: boolean; email?: boolean };
}) {
  const { data } = await api.put<{ data: ParentProfileData }>("/parent/profile", payload);
  return data.data;
}

const RELATIONSHIPS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "guardian", label: "Guardian" },
  { value: "grandparent", label: "Grandparent" },
  { value: "other", label: "Other" },
];

export function ParentProfileExtrasForm() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["parent-profile"], queryFn: fetchParentProfile });
  const [relationship, setRelationship] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [push, setPush] = useState(true);
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(true);

  useEffect(() => {
    if (!data?.parent) return;
    setRelationship(data.parent.relationship ?? "");
    setPreferredLanguage(data.parent.preferred_language ?? "en");
    setPush(data.parent.notification_preferences?.push ?? true);
    setSms(data.parent.notification_preferences?.sms ?? true);
    setEmail(data.parent.notification_preferences?.email ?? true);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateParentProfile({
        relationship: relationship || null,
        preferred_language: preferredLanguage || "en",
        notification_preferences: { push, sms, email },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-profile"] });
      toastSuccess("Parent preferences saved.");
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });

  if (isLoading) {
    return <div className="fp-card p-6 text-sm text-slate-500">Loading parent details…</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="fp-card p-6"
    >
      <div className="mb-6">
        <h2 className="text-base font-bold text-brand-secondary">Parent preferences</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Relationship and notification settings for {data?.parent?.children_count ?? 0} linked{" "}
          {data?.parent?.children_count === 1 ? "child" : "children"}
        </p>
      </div>

      <FormSection title="Guardian details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Relationship to student">
            <select
              className="fp-input w-full"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="">Select…</option>
              {RELATIONSHIPS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred language">
            <input
              className="fp-input w-full"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Notifications" className="mt-6">
        <div className="space-y-3">
          {[
            ["push", push, setPush, "Push notifications"],
            ["sms", sms, setSms, "SMS alerts"],
            ["email", email, setEmail, "Email updates"],
          ].map(([key, checked, setter, label]) => (
            <label key={key as string} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">{label as string}</span>
              <input
                type="checkbox"
                checked={checked as boolean}
                onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
              />
            </label>
          ))}
        </div>
      </FormSection>

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
        <button
          type="submit"
          className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark disabled:opacity-60"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save parent preferences"}
        </button>
      </div>
    </form>
  );
}
