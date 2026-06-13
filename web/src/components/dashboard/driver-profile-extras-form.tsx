"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Field,
  FormSection,
  ProfileFormPanel,
  profileInputClass,
  profileSubmitClass,
} from "@/components/ui/form-section";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import { formatPdfDate } from "@/lib/pdf/styles";
import type { Driver } from "@/lib/types";

interface DriverProfileData {
  driver: Driver;
  stats: { assigned_students: number };
}

async function fetchDriverProfile() {
  const { data } = await api.get<{ data: DriverProfileData }>("/driver/profile");
  return data.data;
}

async function updateDriverProfile(payload: {
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}) {
  const { data } = await api.put<{ data: DriverProfileData }>("/driver/profile", payload);
  return data.data;
}

export function DriverProfileExtrasForm() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["driver-profile"], queryFn: fetchDriverProfile });
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    if (!data?.driver) return;
    setPhone(data.driver.phone ?? "");
    setEmergencyName(data.driver.emergency_contact_name ?? "");
    setEmergencyPhone(data.driver.emergency_contact_phone ?? "");
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateDriverProfile({
        phone: phone || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toastSuccess("Driver profile saved.");
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <ProfileFormPanel title="Driver Credentials" description="Loading…">
        <p className="text-xs text-slate-500">Loading driver credentials…</p>
      </ProfileFormPanel>
    );
  }

  const driver = data?.driver;
  if (!driver) return null;

  return (
    <ProfileFormPanel
      title="Driver Credentials"
      description="Contact details and read-only compliance records."
      footer={
        <div className="flex justify-end py-1">
          <button type="submit" form="driver-profile-extras" className={profileSubmitClass} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Driver Details"}
          </button>
        </div>
      }
    >
      <form
        id="driver-profile-extras"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <FormSection title="Editable Contact" description="Phone and emergency contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile Phone">
              <input className={profileInputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Emergency Contact name">
              <input className={profileInputClass} value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </Field>
            <Field label="Emergency Contact phone" className="sm:col-span-2">
              <input className={profileInputClass} value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="License & compliance" description="Read-only — contact dispatch to update">
          <dl className="grid gap-2.5 sm:grid-cols-2">
            {[
              ["Employee ID", driver.employee_id ?? "—"],
              ["License", `${driver.license_number ?? "—"} (${driver.license_class ?? "—"})`],
              ["License expiry", formatPdfDate(driver.license_expiry)],
              ["Medical cert", formatPdfDate(driver.medical_cert_expiry)],
              ["Insurance", driver.insurance_provider ?? "—"],
              ["Policy #", driver.insurance_policy_number ?? "—"],
              ["Insurance expiry", formatPdfDate(driver.insurance_expiry)],
              ["Assigned students", String(data?.stats.assigned_students ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>
      </form>
    </ProfileFormPanel>
  );
}
