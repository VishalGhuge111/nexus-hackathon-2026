import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS - Mission Control",
  description: "Global Supply Chain Command Center"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans p-6 md:p-12 selection:bg-primary/30">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </body>
    </html>
  );
}
