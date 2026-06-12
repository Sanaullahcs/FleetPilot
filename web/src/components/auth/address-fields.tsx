"use client";

import { AuthField } from "@/components/auth/auth-shell";
import { SearchableSelect } from "@/components/ui/dropdown-menu";
import { US_STATES } from "@/lib/us-states";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

export interface AddressFormSlice {
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function AddressFields<T extends AddressFormSlice>({
  register,
  watch,
  setValue,
  errors,
  label = "Address",
  required = true,
}: {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  errors: FieldErrors<T>;
  label?: string;
  required?: boolean;
}) {
  const fieldClass = "fp-input";
  const req = required ? " *" : "";

  return (
    <div className="space-y-3">
      <p className="fp-label text-slate-500">{label}{req && !label.includes("*") ? "" : required ? "" : " (optional)"}</p>
      <AuthField label={`Street address${req}`} error={errors.address?.message as string | undefined}>
        <input
          className={fieldClass}
          autoComplete="street-address"
          placeholder="123 Main Street, Suite 100"
          {...register("address" as never)}
        />
      </AuthField>
      <div className="grid gap-3 sm:grid-cols-3">
        <AuthField label={`City${req}`} error={errors.city?.message as string | undefined}>
          <input className={fieldClass} autoComplete="address-level2" {...register("city" as never)} />
        </AuthField>
        <AuthField label={`State${req}`} error={errors.state?.message as string | undefined}>
          <SearchableSelect
            value={String(watch("state" as never) ?? "")}
            onChange={(v) => setValue("state" as never, v as never, { shouldValidate: true })}
            options={US_STATES}
            showAllOption={false}
            placeholder="State"
            searchPlaceholder="Search state…"
          />
        </AuthField>
        <AuthField label={`ZIP${req}`} error={errors.zip?.message as string | undefined}>
          <input className={fieldClass} autoComplete="postal-code" placeholder="62701" {...register("zip" as never)} />
        </AuthField>
      </div>
    </div>
  );
}
