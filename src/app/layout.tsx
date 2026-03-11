import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const syne = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/syne/files/syne-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-syne",
});

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
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} ${syne.variable} antialiased bg-background text-foreground`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-background focus:font-semibold focus:text-sm"
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
