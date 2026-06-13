import { Document, Text, View } from "@react-pdf/renderer";
import type { School } from "@/lib/types";
import { DocumentShell } from "@/lib/pdf/document-shell";
import { PdfField, PdfGrid, PdfSection } from "@/lib/pdf/layout";
import { formatAddress, pdfStyles, titleCaseStatus } from "@/lib/pdf/styles";

function formatBellTimes(bellTimes: Record<string, string> | null | undefined): string {
  if (!bellTimes || Object.keys(bellTimes).length === 0) return "—";
  return Object.entries(bellTimes)
    .map(([key, value]) => `${titleCaseStatus(key)}: ${value}`)
    .join(" · ");
}

export function SchoolProfilePdf({ school, orgName }: { school: School; orgName?: string }) {
  const fullAddress = formatAddress([school.address, school.city, school.state, school.zip]);

  return (
    <Document title={`${school.name} — School Profile`}>
      <DocumentShell
        documentLabel="School transportation partner"
        name={school.name}
        subtitle={school.district ? `${school.district} District` : school.grade_levels ?? "K-12 Partner"}
        status={school.status ?? "active"}
        orgName={orgName ?? "FleetPilot Transportation"}
        summary={[
          { label: "School Code", value: school.code ?? "—" },
          { label: "Students", value: String(school.active_students_count ?? school.students_count ?? 0) },
          { label: "Routes", value: String(school.active_routes_count ?? school.routes_count ?? 0) },
          { label: "Phone", value: school.phone ?? school.contact_phone ?? "—" },
          { label: "Contact Email", value: school.contact_email ?? "—" },
        ]}
        footerTagline="School partnership & transportation record"
      >
        <PdfSection title="Campus Overview">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="School Code" value={school.code ?? "—"} />
            <PdfField cols={3} label="District" value={school.district ?? "—"} />
            <PdfField cols={3} label="Grade Levels" value={school.grade_levels ?? "—"} />
            <PdfField cols={3} label="Enrollment" value={school.enrollment_count != null ? String(school.enrollment_count) : "—"} />
            <PdfField cols={3} label="Active Students" value={String(school.active_students_count ?? school.students_count ?? 0)} />
            <PdfField cols={3} label="Active Routes" value={String(school.active_routes_count ?? school.routes_count ?? 0)} />
            <PdfField cols={3} label="Timezone" value={school.timezone ?? "—"} />
            <PdfField cols={3} label="Status" value={titleCaseStatus(school.status)} />
          </PdfGrid>
        </PdfSection>

        <PdfSection title="Location">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="City" value={school.city ?? "—"} />
            <PdfField cols={3} label="State" value={school.state ?? "—"} />
            <PdfField cols={3} label="ZIP" value={school.zip ?? "—"} />
            <PdfField
              cols={3}
              label="Coordinates"
              value={
                school.latitude != null && school.longitude != null
                  ? `${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}`
                  : "—"
              }
            />
          </PdfGrid>
          {fullAddress ? (
            <View style={pdfStyles.fieldFull}>
              <Text style={pdfStyles.label}>Full address</Text>
              <Text style={pdfStyles.valueMuted}>{fullAddress}</Text>
            </View>
          ) : null}
        </PdfSection>

        <PdfSection title="Leadership & contacts">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="Principal" value={school.principal_name ?? "—"} />
            <PdfField cols={3} label="Primary Contact" value={school.contact_name ?? "—"} />
            <PdfField cols={3} label="Contact Phone" value={school.contact_phone ?? school.phone ?? "—"} />
            <PdfField cols={3} label="Contact Email" value={school.contact_email ?? "—"} />
            <PdfField cols={3} label="Website" value={school.website ?? "—"} />
          </PdfGrid>
        </PdfSection>

        <PdfSection title="Schedule">
          <View style={pdfStyles.fieldFull}>
            <Text style={pdfStyles.label}>Bell times</Text>
            <Text style={pdfStyles.valueMuted}>{formatBellTimes(school.bell_times)}</Text>
          </View>
        </PdfSection>
      </DocumentShell>
    </Document>
  );
}
