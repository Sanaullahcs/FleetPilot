"use client";

import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function downloadProfilePdf(doc: ReactElement, filename: string) {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function safePdfFilename(label: string): string {
  return label.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}
