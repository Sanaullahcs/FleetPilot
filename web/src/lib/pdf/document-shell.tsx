import { Page, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { PdfFleetBrand } from "@/lib/pdf/pdf-logo";
import { pdfStyles, titleCaseStatus } from "@/lib/pdf/styles";

export interface SummaryItem {
  label: string;
  value: string;
}

export interface DocumentShellProps {
  documentLabel: string;
  name: string;
  subtitle?: string;
  status?: string;
  orgName?: string;
  summary: SummaryItem[];
  footerTagline: string;
  children: ReactNode;
}

function PdfSummaryStrip({ items }: { items: SummaryItem[] }) {
  const rowSize = items.length === 5 ? 3 : 4;
  const rows: SummaryItem[][] = [];
  for (let i = 0; i < items.length; i += rowSize) {
    rows.push(items.slice(i, i + rowSize));
  }

  return (
    <View style={pdfStyles.summaryWrap}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={
            row.length < rowSize
              ? [pdfStyles.summaryRow, pdfStyles.summaryRowCentered]
              : pdfStyles.summaryRow
          }
        >
          {row.map((item) => (
            <View key={item.label} style={pdfStyles.summaryCell}>
              <Text style={pdfStyles.summaryLabel}>{item.label}</Text>
              <Text style={pdfStyles.summaryValue}>{item.value || "—"}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function DocumentShell({
  documentLabel,
  name,
  subtitle,
  status,
  orgName,
  summary,
  footerTagline,
  children,
}: DocumentShellProps) {
  return (
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.docHeader}>
        <PdfFleetBrand />
        <View style={pdfStyles.docHeaderMeta}>
          <Text style={pdfStyles.docLabel}>{documentLabel}</Text>
          <Text style={pdfStyles.docTitle}>{name}</Text>
          {subtitle ? <Text style={pdfStyles.docSubtitle}>{subtitle}</Text> : null}
          {orgName ? <Text style={pdfStyles.docOrg}>{orgName}</Text> : null}
        </View>
        {status ? (
          <View style={pdfStyles.statusPill}>
            <Text style={pdfStyles.statusPillText}>{titleCaseStatus(status)}</Text>
          </View>
        ) : null}
      </View>

      <View style={pdfStyles.headerRule} />

      {summary.length > 0 ? <PdfSummaryStrip items={summary} /> : null}

      <View style={pdfStyles.body}>{children}</View>

      <View style={pdfStyles.footer} fixed>
        <PdfFleetBrand compact />
        <Text style={pdfStyles.footerText}>
          Generated {new Date().toLocaleDateString()} · {footerTagline}
        </Text>
      </View>
    </Page>
  );
}
