import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alertas Aguilares — Reportá tu barrio",
  description:
    "Plataforma vecinal de reportes geolocalizados para Aguilares, Tucumán. Informá baches, alumbrado, basura, inundaciones y más en tiempo real.",
  keywords: [
    "Aguilares",
    "Tucumán",
    "reportes ciudadanos",
    "mapa interactivo",
    "vecinos",
    "baches",
    "alumbrado",
    "basura",
  ],
  authors: [{ name: "Alertas Aguilares" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Alertas Aguilares",
    description: "Reportá problemas urbanos en Aguilares, Tucumán.",
    type: "website",
    locale: "es_AR",
    siteName: "Alertas Aguilares",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CiudadAlerta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080d1a",
};

import { AuthProvider } from "@/hooks/useAuth";
import PwaRegister from "@/components/layout/PwaRegister";
import { TooltipProvider } from "@/components/ui/tooltip";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="font-jakarta min-h-dvh bg-background text-foreground flex flex-col">
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
