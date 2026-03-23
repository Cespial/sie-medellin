import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "SIE Medellín — Sistema de Inteligencia Educativa",
  description:
    "Dashboard ejecutivo del sistema educativo de Medellín. Datos de cobertura, calidad, permanencia y contexto socioeconómico.",
  keywords: [
    "educación",
    "Medellín",
    "dashboard",
    "datos abiertos",
    "SIMAT",
    "Saber 11",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-accent focus:text-background focus:font-semibold focus:text-sm"
        >
          Ir al contenido principal
        </a>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main
            id="main-content"
            role="main"
            className="flex-1 overflow-y-auto pt-14 lg:pt-0"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
