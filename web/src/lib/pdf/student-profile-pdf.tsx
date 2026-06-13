import { Document, Text, View } from "@react-pdf/renderer";
import type { ParentStudentLink, Student } from "@/lib/types";
import { DocumentShell } from "@/lib/pdf/document-shell";
import { PdfChipRow, PdfField, PdfGrid, PdfParentCard, PdfSection, PdfVehicleGrid } from "@/lib/pdf/layout";
import { formatPdfDate, pdfStyles, titleCaseStatus } from "@/lib/pdf/styles";

function transportNeeds(student: Student): string[] {
  const items: string[] = [];
  if (student.has_iep) items.push("IEP");
  if (student.requires_wheelchair) items.push("Wheelchair accessible");
  if (student.requires_aide) items.push("Aide required");
  if (items.length === 0) items.push("Standard service");
  return items;
}

export function StudentProfilePdf({
  student,
  parents = [],
  orgName,
}: {
  student: Student;
  parents?: ParentStudentLink[];
  orgName?: string;
}) {
  const fullName = `${student.first_name} ${student.last_name}`.trim();
  const driver = student.assigned_driver;
  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : "Unassigned";
  const vehicle = driver?.default_vehicle ?? null;

  return (
    <Document title={`${fullName} — Student Profile`}>
      <DocumentShell
        documentLabel="Student transportation profile"
        name={fullName}
        subtitle={`Grade ${student.grade ?? "—"} · ${student.school?.name ?? "School TBD"}`}
        status={student.status}
        orgName={orgName ?? "FleetPilot Transportation"}
        summary={[
          { label: "Student #", value: student.student_number ?? "—" },
          { label: "Grade", value: student.grade ?? "—" },
          { label: "Status", value: titleCaseStatus(student.status) },
          { label: "Driver", value: driverName },
          { label: "Vehicle", value: vehicle?.vehicle_number ?? "Unassigned" },
        ]}
        footerTagline="Confidential student transportation record"
      >
        <PdfSection title="Student Information">
          <PdfGrid cols={3}>
            <PdfField cols={3} label="Student Number" value={student.student_number ?? "—"} />
            <PdfField cols={3} label="Grade" value={student.grade ?? "—"} />
            <PdfField cols={3} label="Date of Birth" value={formatPdfDate(student.date_of_birth)} />
            <PdfField cols={3} label="Status" value={titleCaseStatus(student.status)} />
            <PdfField cols={3} label="School" value={student.school?.name ?? "—"} />
            <PdfField
              cols={3}
              label="School Location"
              value={[student.school?.city, student.school?.state].filter(Boolean).join(", ") || "—"}
            />
          </PdfGrid>
          {student.home_address ? (
            <View style={pdfStyles.fieldFull}>
              <Text style={pdfStyles.label}>Home address</Text>
              <Text style={pdfStyles.valueMuted}>{student.home_address}</Text>
            </View>
          ) : null}
        </PdfSection>

        <PdfSection title="Transportation Needs">
          <PdfChipRow items={transportNeeds(student)} />
          {student.medical_notes ? (
            <View style={{ marginTop: 8 }}>
              <Text style={pdfStyles.label}>Medical notes</Text>
              <Text style={pdfStyles.valueMuted}>{student.medical_notes}</Text>
            </View>
          ) : null}
        </PdfSection>

        {(student.emergency_contact_name || student.emergency_contact_phone) && (
          <PdfSection title="Emergency Contact">
            <PdfGrid cols={2}>
              <PdfField label="Contact Name" value={student.emergency_contact_name ?? "—"} />
              <PdfField label="Contact Phone" value={student.emergency_contact_phone ?? "—"} />
            </PdfGrid>
          </PdfSection>
        )}

        <PdfSection title="Parents & guardians">
          {parents.length > 0 ? (
            parents.map((link) => {
              const user = link.user;
              if (!user) return null;
              return (
                <PdfParentCard
                  key={link.id}
                  name={`${user.first_name} ${user.last_name}`}
                  relationship={link.relationship}
                  email={user.email}
                  phone={user.phone ?? undefined}
                  isPrimary={link.is_primary}
                  canPickup={link.can_pickup}
                />
              );
            })
          ) : (
            <Text style={pdfStyles.valueMuted}>
              No linked parent accounts on file. Emergency contact details above may be used.
            </Text>
          )}
        </PdfSection>

        <PdfSection title="Assigned Driver">
          {driver ? (
            <PdfGrid cols={3}>
              <PdfField cols={3} label="Driver Name" value={driverName} />
              <PdfField cols={3} label="Employee ID" value={driver.employee_id ?? "—"} />
              <PdfField cols={3} label="Status" value={titleCaseStatus(driver.status ?? "—")} />
              <PdfField cols={3} label="Email" value={driver.email ?? "—"} />
              <PdfField cols={3} label="Phone" value={driver.phone ?? "—"} />
            </PdfGrid>
          ) : (
            <Text style={pdfStyles.valueMuted}>No driver currently assigned to this student.</Text>
          )}
        </PdfSection>

        <PdfSection title="Assigned Vehicle">
          <PdfVehicleGrid vehicle={vehicle} />
        </PdfSection>
      </DocumentShell>
    </Document>
  );
}
