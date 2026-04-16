import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOLO — Harvest & Order Logistics Operations",
  description: "Internal ops tool for Hippo Harvest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
