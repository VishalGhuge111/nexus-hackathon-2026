import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// A dedicated typeface (vs. the default system-font fallback) is one of the
// cheapest, highest-leverage signals that separates a "control tower" product
// from a template — self-hosted by Next at build time, no runtime request,
// no new dependency. Inter for UI text; IBM Plex Mono for the identifiers,
// numbers, and status labels already rendered with `font-mono` throughout
// every Mission Control component — mapped in globals.css's @theme block, so
// every existing `font-mono` class picks it up with no per-component change.
const interSans = Inter({ subsets: ["latin"], variable: "--next-font-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--next-font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "NEXUS",
  description: "NEXUS application"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interSans.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
