import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fredoka";
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
      <body className="font-sans">
        {/* Playful floating colour blobs behind the app */}
        <div className="bg-blobs" aria-hidden>
          <span className="h-72 w-72 animate-float bg-brand-light" style={{ top: "-4rem", left: "-3rem" }} />
          <span
            className="h-80 w-80 animate-float bg-mint"
            style={{ top: "30%", right: "-5rem", animationDelay: "-6s" }}
          />
          <span
            className="h-64 w-64 animate-float bg-sun"
            style={{ bottom: "-3rem", left: "20%", animationDelay: "-11s" }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
