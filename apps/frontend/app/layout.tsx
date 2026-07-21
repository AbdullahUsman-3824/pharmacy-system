import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Providers } from "./providers";

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
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
