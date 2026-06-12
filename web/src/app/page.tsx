import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "FleetPilot | K-12 Student Transportation Management Platform",
  description:
    "Plan school bus routes in minutes, track every vehicle live, and keep parents informed automatically. Dispatch portal, driver app, and parent app, without enterprise pricing.",
  keywords: [
    "school bus tracking",
    "student transportation software",
    "K-12 fleet management",
    "school bus routing",
    "parent bus tracking app",
    "school transportation dispatch",
  ],
  openGraph: {
    title: "FleetPilot | One platform for your whole fleet",
    description:
      "The K-12 transportation platform for districts and contractors: live GPS radar, route optimization, parent and driver apps, billing, and realtime messaging.",
    type: "website",
  },
};

export default function HomePage() {
  return <MarketingLanding />;
}
