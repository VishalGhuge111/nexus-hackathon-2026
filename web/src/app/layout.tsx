import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "../components/layout/TopNav";
import { Sidebar } from "../components/layout/Sidebar";
import { MissionProvider } from "../contexts/MissionContext";
import { CommandPalette } from "../components/layout/CommandPalette";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "NEXUS — Mission Control",
  description: "AI-Powered Supply Chain Recovery Command Center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden h-screen flex flex-col bg-zinc-50">
        <MissionProvider>
          <TopNav />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {children}
            </main>
          </div>
          <CommandPalette />
          <Toaster position="bottom-right" />
        </MissionProvider>
      </body>
    </html>
  );
}