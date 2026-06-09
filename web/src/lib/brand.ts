/** FleetPilot brand palette */
export const brand = {
  primary: "#4F5BA9",
  primaryDark: "#3D4587",
  primaryLight: "#EEF0F9",
  accent: "#0EA5E9",
  accentLight: "#E0F2FE",
  accentDark: "#0284C7",
  cyan: "#06B6D4",
  cyanLight: "#CFFAFE",
  orange: "#F97316",
  orangeLight: "#FFEDD5",
  secondary: "#18181B",
  secondaryMuted: "#52525B",
  surface: "#FFFFFF",
  canvas: "#F4F5FA",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  /** Chart series — vibrant palette, no dark/black segments */
  chart: [
    "#4F5BA9",
    "#0EA5E9",
    "#06B6D4",
    "#F97316",
    "#8B5CF6",
    "#6B76C2",
    "#38BDF8",
    "#FB923C",
    "#10B981",
    "#14B8A6",
    "#EC4899",
    "#F59E0B",
  ],
} as const;

export function chartColor(index: number): string {
  return brand.chart[index % brand.chart.length];
}
