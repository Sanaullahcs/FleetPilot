import { Document, Text, View } from "@react-pdf/renderer";
import type { Driver, StudentSummary } from "@/lib/types";
import { DocumentShell } from "@/lib/pdf/document-shell";
import { PdfChipRow, PdfComplianceRow, PdfField, PdfGrid, PdfSection, PdfVehicleGrid } from "@/lib/pdf/layout";
import { complianceStatus, formatPdfDate, pdfStyles, titleCaseStatus } from "@/lib/pdf/styles";

export function DriverProfilePdf({
  driver,
  orgName,
}: {
  driver: Driver & { assigned_students?: StudentSummary[] };
  orgName?: string;
}) {
  const fullName = `${driver.first_name} ${driver.last_name}`.trim();
  const students = driver.students ?? driver.assigned_students ?? [];
  const vehicle = driver.default_vehicle;

  return (
    <Document title={`${fullName} — Driver Credential`}>
      <DocumentShell
        documentLabel="Driver credential"
        name={fullName}
        subtitle={`${driver.license_class ?? "CDL"} · ${driver.employee_id ?? "—"}`}
        status={driver.status}
        orgName={orgName ?? "FleetPilot Transportation"}
        summary={[
          { label: "Employee ID", value: driver.employee_id ?? "—" },
          { label: "License Class", value: driver.license_class ?? "—" },
          { label: "Vehicle", value: vehicle?.vehicle_number ?? "Unassigned" },
          { label: "Email", value: driver.email ?? "—" },
          { label: "Phone", value: driver.phone ?? "—" },
        ]}
        footerTagline="Confidential driver credential record"
      >
        <PdfSection title="Contact & employment">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="Employee ID" value={driver.employee_id ?? "—"} />
            <PdfField cols={3} label="Hire Date" value={formatPdfDate(driver.hire_date)} />
            <PdfField cols={3} label="Date of Birth" value={formatPdfDate(driver.date_of_birth)} />
            <PdfField cols={3} label="Email" value={driver.email ?? "—"} />
            <PdfField cols={3} label="Phone" value={driver.phone ?? "—"} />
            <PdfField cols={3} label="Students Assigned" value={String(driver.students_count ?? students.length)} />
          </PdfGrid>
          {driver.address ? (
            <View style={pdfStyles.fieldFull}>
              <Text style={pdfStyles.label}>Address</Text>
              <Text style={pdfStyles.valueMuted}>{driver.address}</Text>
            </View>
          ) : null}
        </PdfSection>

        <PdfSection title="Commercial Driver License">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="License Number" value={driver.license_number ?? "—"} />
            <PdfField cols={3} label="Class" value={driver.license_class ?? "—"} />
            <PdfField cols={3} label="State" value={driver.license_state ?? "—"} />
            <PdfField cols={3} label="Expiry" value={formatPdfDate(driver.license_expiry)} />
          </PdfGrid>
          {driver.endorsements && driver.endorsements.length > 0 ? (
            <PdfChipRow items={driver.endorsements.map((e) => `Endorsement ${e}`)} />
          ) : null}
        </PdfSection>

        <PdfSection title="Insurance">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="Provider" value={driver.insurance_provider ?? "—"} />
            <PdfField cols={3} label="Policy Number" value={driver.insurance_policy_number ?? "—"} />
            <PdfField cols={3} label="Policy Expiry" value={formatPdfDate(driver.insurance_expiry)} />
          </PdfGrid>
        </PdfSection>

        <PdfSection title="Compliance">
          <PdfComplianceRow label="CDL Expiry" date={driver.license_expiry} status={complianceStatus(driver.license_expiry)} />
          <PdfComplianceRow label="Medical Certificate" date={driver.medical_cert_expiry} status={complianceStatus(driver.medical_cert_expiry)} />
          <PdfComplianceRow label="Insurance Policy" date={driver.insurance_expiry} status={complianceStatus(driver.insurance_expiry)} />
          <PdfComplianceRow label="Background Check" date={driver.background_check_date} status={driver.background_check_date ? "valid" : "missing"} />
          <PdfComplianceRow label="Drug Test" date={driver.drug_test_date} status={driver.drug_test_date ? "valid" : "missing"} />
        </PdfSection>

        {driver.documents && driver.documents.length > 0 ? (
          <PdfSection title="Documents">
            {driver.documents.map((doc) => (
              <View key={doc.id} style={pdfStyles.docRow}>
                <Text style={pdfStyles.docName}>
                  {titleCaseStatus(doc.document_type.replace(/_/g, " "))}
                  {doc.original_filename ? ` — ${doc.original_filename}` : ""}
                </Text>
                <Text style={pdfStyles.docStatus}>
                  {doc.expiry_date ? formatPdfDate(doc.expiry_date) : titleCaseStatus(doc.status)}
                </Text>
              </View>
            ))}
          </PdfSection>
        ) : null}

        <PdfSection title="Assigned Vehicle">
          <PdfVehicleGrid vehicle={vehicle} />
        </PdfSection>

        {students.length > 0 ? (
          <PdfSection title="Assigned Students">
            {students.slice(0, 12).map((s) => (
              <View key={s.id} style={pdfStyles.studentListRow}>
                <Text style={pdfStyles.studentListName}>
                  {s.first_name} {s.last_name}
                </Text>
                <Text style={pdfStyles.studentListMeta}>
                  {[s.student_number, s.grade ? `Grade ${s.grade}` : null, s.school?.name].filter(Boolean).join(" · ")}
                </Text>
              </View>
            ))}
            {students.length > 12 ? (
              <Text style={pdfStyles.valueMuted}>+ {students.length - 12} more students</Text>
            ) : null}
          </PdfSection>
        ) : null}

        {(driver.emergency_contact_name || driver.emergency_contact_phone) && (
          <PdfSection title="Emergency Contact">
            <PdfGrid cols={2}>
              <PdfField label="Contact Name" value={driver.emergency_contact_name ?? "—"} />
              <PdfField label="Contact Phone" value={driver.emergency_contact_phone ?? "—"} />
            </PdfGrid>
          </PdfSection>
        )}

        {driver.notes ? (
          <PdfSection title="Notes">
            <Text style={pdfStyles.valueMuted}>{driver.notes}</Text>
          </PdfSection>
        ) : null}
      </DocumentShell>
    </Document>
  );
}
