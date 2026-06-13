"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Field,
  FormSection,
  ProfileFormPanel,
  profileInputClass,
  profileSubmitClass,
} from "@/components/ui/form-section";
import { updateProfile, type UpdateProfilePayload } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/alerts";
import type { AuthUser } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string {
  const v = meta?.[key];
  return v != null && v !== "" ? String(v) : "";
}

export function ContractorProfileExtrasForm({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const meta = user.profile_meta ?? {};

  const [companyName, setCompanyName] = useState(metaString(meta, "company_name") || user.job_title || "");
  const [businessType, setBusinessType] = useState(metaString(meta, "business_type"));
  const [taxId, setTaxId] = useState(metaString(meta, "tax_id"));
  const [fleetSize, setFleetSize] = useState(metaString(meta, "fleet_size"));
  const [driverCount, setDriverCount] = useState(metaString(meta, "driver_count"));
  const [vehicleCount, setVehicleCount] = useState(metaString(meta, "vehicle_count"));
  const [yearsInBusiness, setYearsInBusiness] = useState(metaString(meta, "years_in_business"));
  const [coverageAreas, setCoverageAreas] = useState(metaString(meta, "coverage_areas"));
  const [serviceRadius, setServiceRadius] = useState(metaString(meta, "service_radius_miles"));
  const [insuranceCarrier, setInsuranceCarrier] = useState(metaString(meta, "insurance_carrier"));
  const [insurancePolicy, setInsurancePolicy] = useState(metaString(meta, "insurance_policy_number"));
  const [dotNumber, setDotNumber] = useState(metaString(meta, "dot_number"));
  const [mcNumber, setMcNumber] = useState(metaString(meta, "mc_number"));

  useEffect(() => {
    const m = user.profile_meta ?? {};
    setCompanyName(metaString(m, "company_name") || user.job_title || "");
    setBusinessType(metaString(m, "business_type"));
    setTaxId(metaString(m, "tax_id"));
    setFleetSize(metaString(m, "fleet_size"));
    setDriverCount(metaString(m, "driver_count"));
    setVehicleCount(metaString(m, "vehicle_count"));
    setYearsInBusiness(metaString(m, "years_in_business"));
    setCoverageAreas(metaString(m, "coverage_areas"));
    setServiceRadius(metaString(m, "service_radius_miles"));
    setInsuranceCarrier(metaString(m, "insurance_carrier"));
    setInsurancePolicy(metaString(m, "insurance_policy_number"));
    setDotNumber(metaString(m, "dot_number"));
    setMcNumber(metaString(m, "mc_number"));
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: UpdateProfilePayload = {
        company_name: companyName || null,
        business_type: businessType || null,
        tax_id: taxId || null,
        fleet_size: fleetSize ? Number(fleetSize) : null,
        driver_count: driverCount ? Number(driverCount) : null,
        vehicle_count: vehicleCount ? Number(vehicleCount) : null,
        years_in_business: yearsInBusiness ? Number(yearsInBusiness) : null,
        coverage_areas: coverageAreas || null,
        service_radius_miles: serviceRadius ? Number(serviceRadius) : null,
        insurance_carrier: insuranceCarrier || null,
        insurance_policy_number: insurancePolicy || null,
        dot_number: dotNumber || null,
        mc_number: mcNumber || null,
      };
      return updateProfile(payload);
    },
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.setQueryData(["auth-me"], updated);
      toastSuccess("Company profile saved.");
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });

  return (
    <ProfileFormPanel
      title="Company Profile"
      description="Contractor business details on your credential records."
      footer={
        <div className="flex justify-end py-1">
          <button type="submit" form="contractor-profile-extras" className={profileSubmitClass} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Company Profile"}
          </button>
        </div>
      }
    >
      <form
        id="contractor-profile-extras"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <FormSection title="Business Identity">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company Name" className="sm:col-span-2">
              <input className={profileInputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <Field label="Business Type">
              <input className={profileInputClass} value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            </Field>
            <Field label="Tax ID / EIN">
              <input className={profileInputClass} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </Field>
            <Field label="Years in Business">
              <input type="number" min={0} className={profileInputClass} value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} />
            </Field>
            <Field label="Service Radius (Miles)">
              <input type="number" min={0} className={profileInputClass} value={serviceRadius} onChange={(e) => setServiceRadius(e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Fleet Capacity">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Fleet Size">
              <input type="number" min={0} className={profileInputClass} value={fleetSize} onChange={(e) => setFleetSize(e.target.value)} />
            </Field>
            <Field label="Drivers">
              <input type="number" min={0} className={profileInputClass} value={driverCount} onChange={(e) => setDriverCount(e.target.value)} />
            </Field>
            <Field label="Vehicles">
              <input type="number" min={0} className={profileInputClass} value={vehicleCount} onChange={(e) => setVehicleCount(e.target.value)} />
            </Field>
            <Field label="Coverage Areas" className="sm:col-span-3">
              <textarea className={`${profileInputClass} min-h-[80px]`} value={coverageAreas} onChange={(e) => setCoverageAreas(e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Insurance & DOT">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Insurance Carrier">
              <input className={profileInputClass} value={insuranceCarrier} onChange={(e) => setInsuranceCarrier(e.target.value)} />
            </Field>
            <Field label="Policy Number">
              <input className={profileInputClass} value={insurancePolicy} onChange={(e) => setInsurancePolicy(e.target.value)} />
            </Field>
            <Field label="DOT Number">
              <input className={profileInputClass} value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} />
            </Field>
            <Field label="MC Number">
              <input className={profileInputClass} value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} />
            </Field>
          </div>
        </FormSection>
      </form>
    </ProfileFormPanel>
  );
}
