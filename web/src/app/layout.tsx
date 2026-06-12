import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "sweetalert2/dist/sweetalert2.min.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FleetPilot",
  description: "K-12 student transportation management platform",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${inter.variable} ${oswald.variable}`} style={{ colorScheme: "light" }}>
      <body
        className={`${inter.className} min-h-screen bg-slate-50 font-sans text-sm leading-normal text-slate-900 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
