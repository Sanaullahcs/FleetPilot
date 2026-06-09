"use client";

import { PageTransition } from "@/components/ui/nav-progress";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
