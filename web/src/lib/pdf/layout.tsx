import { Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { formatPdfDate, pdfStyles, titleCaseStatus } from "@/lib/pdf/styles";

export function PdfField({
  label,
  value,
  cols = 2,
  full,
}: {
  label: string;
  value: string;
  cols?: 2 | 3;
  full?: boolean;
}) {
  const style = full ? pdfStyles.fieldFull : cols === 3 ? pdfStyles.fieldThird : pdfStyles.field;
  return (
    <View style={style}>
      <Text style={pdfStyles.label}>{label}</Text>
      <Text style={pdfStyles.value}>{value || "—"}</Text>
    </View>
  );
}

export function PdfSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={pdfStyles.section} wrap={false}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function PdfChipRow({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={pdfStyles.chipRow}>
      {items.map((item) => (
        <Text key={item} style={pdfStyles.chip}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export function PdfComplianceRow({
  label,
  date,
  status,
}: {
  label: string;
  date: string | null | undefined;
  status?: "valid" | "expiring" | "missing";
}) {
  const resolved =
    status ??
    (date ? (new Date(`${date.slice(0, 10)}T12:00:00`) < new Date() ? "expiring" : "valid") : "missing");

  const dotStyle =
    resolved === "valid"
      ? pdfStyles.complianceDotValid
      : resolved === "expiring"
        ? pdfStyles.complianceDotWarn
        : pdfStyles.complianceDotMissing;

  return (
    <View style={pdfStyles.complianceRow}>
      <View style={dotStyle} />
      <Text style={pdfStyles.complianceLabel}>{label}</Text>
      <Text style={pdfStyles.complianceDate}>{formatPdfDate(date)}</Text>
    </View>
  );
}

export function PdfParentCard({
  name,
  relationship,
  email,
  phone,
  isPrimary,
  canPickup,
}: {
  name: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  canPickup?: boolean;
}) {
  return (
    <View style={pdfStyles.parentCard}>
      <View style={pdfStyles.parentCardHeader}>
        <Text style={pdfStyles.parentName}>{name}</Text>
        <View style={pdfStyles.parentBadges}>
          {isPrimary ? <Text style={pdfStyles.parentBadgePrimary}>Primary</Text> : null}
          {canPickup ? <Text style={pdfStyles.parentBadgePickup}>Pickup OK</Text> : null}
        </View>
      </View>
      <Text style={pdfStyles.parentMeta}>
        {[relationship ? titleCaseStatus(relationship) : null, email, phone].filter(Boolean).join(" · ")}
      </Text>
    </View>
  );
}

export function PdfGrid({ cols, children }: { cols: 2 | 3; children: ReactNode }) {
  return <View style={cols === 3 ? pdfStyles.grid3 : pdfStyles.grid2}>{children}</View>;
}

export interface PdfVehicleInfo {
  vehicle_number: string;
  type: string;
  status?: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  capacity?: number | null;
  wheelchair_capacity?: number | null;
  license_plate?: string | null;
  fuel_type?: string | null;
}

export function PdfVehicleGrid({ vehicle }: { vehicle: PdfVehicleInfo | null | undefined }) {
  if (!vehicle) {
    return <Text style={pdfStyles.valueMuted}>No vehicle assigned.</Text>;
  }

  return (
    <PdfGrid cols={3}>
      <PdfField cols={3} label="Vehicle Number" value={vehicle.vehicle_number} />
      <PdfField cols={3} label="Type" value={titleCaseStatus(vehicle.type)} />
      <PdfField cols={3} label="Status" value={vehicle.status ? titleCaseStatus(vehicle.status) : "—"} />
      <PdfField cols={3} label="Make / model" value={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"} />
      <PdfField cols={3} label="Year" value={vehicle.year != null ? String(vehicle.year) : "—"} />
      <PdfField cols={3} label="License Plate" value={vehicle.license_plate ?? "—"} />
      <PdfField cols={3} label="Capacity" value={vehicle.capacity != null ? String(vehicle.capacity) : "—"} />
      <PdfField
        cols={3}
        label="Wheelchair Seats"
        value={vehicle.wheelchair_capacity != null ? String(vehicle.wheelchair_capacity) : "—"}
      />
      <PdfField cols={3} label="Fuel Type" value={vehicle.fuel_type ? titleCaseStatus(vehicle.fuel_type) : "—"} />
    </PdfGrid>
  );
}

export { formatPdfDate, titleCaseStatus };
