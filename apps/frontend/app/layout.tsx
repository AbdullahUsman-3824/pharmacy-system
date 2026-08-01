import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Furqan Medicos — POS",
  description: "Medicos point-of-sale dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <div className="flex h-screen w-full overflow-hidden bg-surface-page">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar pharmacyName="Furqan Medicos" />
              <main className="flex-1 overflow-y-auto p-4">{children}</main>
            </div>
          </div>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
