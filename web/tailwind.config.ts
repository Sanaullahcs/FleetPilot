import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
    "./src/store/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#4F5BA9",
          dark: "#3D4587",
          light: "#EEF0F9",
          muted: "#C5CAE6",
          accent: "#0EA5E9",
          "accent-light": "#E0F2FE",
          "accent-dark": "#0284C7",
          cyan: "#06B6D4",
          "cyan-light": "#CFFAFE",
          orange: "#F97316",
          "orange-light": "#FFEDD5",
          secondary: "#18181B",
          "secondary-muted": "#52525B",
          canvas: "#F4F5FA",
        },
      },
      boxShadow: {
        premium: "0 4px 24px -4px rgba(79, 91, 169, 0.15), 0 8px 16px -8px rgba(24, 24, 27, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
