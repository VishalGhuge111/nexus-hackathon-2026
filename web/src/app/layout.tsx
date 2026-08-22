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
    <html lang="en">
      <body className="antialiased font-sans">
        <div className="flex min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
