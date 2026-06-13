"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Field,
  FormSection,
  ProfileFormPanel,
  profileSubmitClass,
} from "@/components/ui/form-section";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
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

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "mother" },
  { label: "Father", value: "father" },
  { label: "Guardian", value: "guardian" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Other", value: "other" },
];

const LANGUAGE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "Arabic", value: "ar" },
  { label: "Chinese (Simplified)", value: "zh" },
  { label: "Vietnamese", value: "vi" },
  { label: "Other", value: "other" },
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
    return (
      <ProfileFormPanel title="Parent Preferences" description="Loading…">
        <p className="text-sm text-slate-500">Loading parent details…</p>
      </ProfileFormPanel>
    );
  }

  return (
    <ProfileFormPanel
      title="Parent Preferences"
      description={`Relationship and alerts for ${data?.parent?.children_count ?? 0} linked ${data?.parent?.children_count === 1 ? "child" : "children"}.`}
      footer={
        <div className="flex justify-end">
          <button type="submit" form="parent-profile-extras" className={profileSubmitClass} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save preferences"}
          </button>
        </div>
      }
    >
      <form
        id="parent-profile-extras"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <FormSection title="Guardian Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Relationship to Student">
              <SearchableSelect
                value={relationship}
                onChange={setRelationship}
                options={RELATIONSHIP_OPTIONS}
                allLabel="Select relationship"
                placeholder="Select relationship"
                searchable={false}
              />
            </Field>
            <Field label="Preferred Language">
              <SearchableSelect
                value={preferredLanguage}
                onChange={setPreferredLanguage}
                options={LANGUAGE_OPTIONS}
                showAllOption={false}
                placeholder="Select language"
                searchPlaceholder="Search language…"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Notifications">
          <div className="space-y-2">
            {[
              ["push", push, setPush, "Push notifications"],
              ["sms", sms, setSms, "SMS alerts"],
              ["email", email, setEmail, "Email updates"],
            ].map(([key, checked, setter, label]) => (
              <label
                key={key as string}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 transition hover:border-slate-300"
              >
                <span className="text-sm font-medium text-slate-700">{label as string}</span>
                <input
                  type="checkbox"
                  checked={checked as boolean}
                  onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
                />
              </label>
            ))}
          </div>
        </FormSection>
      </form>
    </ProfileFormPanel>
  );
}
