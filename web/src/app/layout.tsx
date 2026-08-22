import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "../components/layout/TopNav";
import { Sidebar } from "../components/layout/Sidebar";

export const metadata: Metadata = {
  title: "NEXUS — Mission Control",
  description: "AI-Powered Supply Chain Recovery Command Center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden h-screen flex flex-col bg-zinc-50">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}