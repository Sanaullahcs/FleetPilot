import { brand } from "@/lib/brand";

/** Shared demo login password — matches backend DemoCredentials::PASSWORD */
export const DEMO_PASSWORD = "FleetPilot1!";

export const WEB_DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@fleetpilot.test", password: DEMO_PASSWORD, accent: brand.primary },
  { label: "Dispatcher", email: "dispatch@fleetpilot.test", password: DEMO_PASSWORD, accent: brand.cyan },
  { label: "School", email: "school@fleetpilot.test", password: DEMO_PASSWORD, accent: brand.orange },
  { label: "Driver", email: "driver@fleetpilot.test", password: DEMO_PASSWORD, accent: brand.accent },
  { label: "Parent", email: "parent@fleetpilot.test", password: DEMO_PASSWORD, accent: "#8B5CF6" },
] as const;
