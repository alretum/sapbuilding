import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Readiness Challenge",
  description:
    "A playful, all-departments team challenge that makes SAP S/4HANA Cloud readiness visible — and fun.",
};

export const viewport: Viewport = {
  themeColor: "#6d5df6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
