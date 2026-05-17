import "./globals.css";
import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import SwRegister from "@/components/SwRegister";
import Preloader from "@/components/Preloader";

export const metadata: Metadata = {
  title: "Life OS",
  description: "Map your goals. Know what to work on.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Life OS" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <Preloader />
        <Sidebar />
        <main className="md:pl-60">
          <div className="mx-auto max-w-2xl px-4 pt-6 pb-40 md:max-w-5xl md:px-8 md:py-8">
            {children}
          </div>
        </main>
        <BottomNav />
        <SwRegister />
      </body>
    </html>
  );
}
