import { StyleSheet } from "@react-pdf/renderer";
import { pdfColors } from "@/lib/pdf/pdf-colors";

export { pdfColors };

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingHorizontal: 36,
    paddingBottom: 52,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: pdfColors.slate,
    backgroundColor: "#FFFFFF",
  },
  docHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  docHeaderMeta: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  docLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 9,
    color: pdfColors.slate,
    marginBottom: 2,
  },
  docOrg: {
    fontSize: 8,
    color: pdfColors.muted,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: pdfColors.light,
  },
  statusPillText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
  },
  headerRule: {
    height: 1,
    backgroundColor: pdfColors.border,
    marginTop: 14,
    marginBottom: 12,
  },
  summaryWrap: {
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryRowCentered: {
    justifyContent: "center",
  },
  summaryCell: {
    width: "31%",
    marginRight: "2%",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: pdfColors.light,
  },
  summaryLabel: {
    fontSize: 6,
    color: pdfColors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
  },
  body: {},
  section: {
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  grid3: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  field: {
    width: "48%",
    marginBottom: 8,
    paddingRight: 8,
  },
  fieldThird: {
    width: "33%",
    marginBottom: 8,
    paddingRight: 6,
  },
  fieldFull: {
    width: "100%",
    marginBottom: 8,
  },
  label: {
    fontSize: 6.5,
    color: pdfColors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
  },
  valueMuted: {
    fontSize: 8.5,
    color: pdfColors.slate,
    lineHeight: 1.45,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8,
    color: pdfColors.slate,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#FFFFFF",
  },
  parentCard: {
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 6,
    padding: 9,
    marginBottom: 6,
    backgroundColor: pdfColors.light,
  },
  parentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  parentName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
    flex: 1,
  },
  parentBadges: {
    flexDirection: "row",
  },
  parentBadgePrimary: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
    borderWidth: 1,
    borderColor: pdfColors.border,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginLeft: 4,
    backgroundColor: "#FFFFFF",
  },
  parentBadgePickup: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.success,
    borderWidth: 1,
    borderColor: pdfColors.border,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    marginLeft: 4,
    backgroundColor: "#FFFFFF",
  },
  parentMeta: {
    fontSize: 8,
    color: pdfColors.muted,
    lineHeight: 1.4,
  },
  complianceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  complianceDotValid: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: pdfColors.success,
    marginRight: 8,
  },
  complianceDotWarn: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: pdfColors.warning,
    marginRight: 8,
  },
  complianceDotMissing: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginRight: 8,
  },
  complianceLabel: {
    flex: 1,
    fontSize: 8.5,
    color: pdfColors.slate,
  },
  complianceDate: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.dark,
  },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: pdfColors.border,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  docName: {
    fontSize: 8,
    color: pdfColors.slate,
    flex: 1,
  },
  docStatus: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: pdfColors.muted,
    textTransform: "uppercase",
  },
  studentListRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.border,
  },
  studentListName: {
    fontSize: 8.5,
    color: pdfColors.dark,
    fontFamily: "Helvetica-Bold",
  },
  studentListMeta: {
    fontSize: 8,
    color: pdfColors.muted,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: pdfColors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: pdfColors.muted,
  },
});

export function formatPdfDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function titleCaseStatus(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function complianceStatus(iso: string | null | undefined): "valid" | "expiring" | "missing" {
  if (!iso) return "missing";
  const expiry = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const now = new Date();
  if (expiry < now) return "expiring";
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  if (expiry <= soon) return "expiring";
  return "valid";
}

export function formatAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(", ");
}
