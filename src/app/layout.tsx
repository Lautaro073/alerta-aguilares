import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/legal";
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
  // Base para resolver a URL absoluta todo lo relativo de la metadata
  // (openGraph, canonical, etc.). Sin esto Next.js avisa en build.
  metadataBase: new URL(SITE_URL),
  title: "Alertas Aguilares - Reporta tu barrio",
  description:
    "Plataforma vecinal de reportes geolocalizados para Aguilares, Tucumán. Informa problemas urbanos en tiempo real.",
  keywords: [
    "Aguilares",
    "Tucuman",
    "reportes ciudadanos",
    "mapa interactivo",
    "vecinos",
    "baches",
    "semaforos",
    "transito",
    "transporte",
  ],
  authors: [{ name: "Alertas Aguilares" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Alertas Aguilares",
    description: "Reporta problemas urbanos en Aguilares, Tucumán.",
    type: "website",
    locale: "es_AR",
    siteName: "Alertas Aguilares",
    url: "/",
  },
  // Sin `images`: las provee `opengraph-image.tsx` y `twitter-image.tsx`, que
  // tienen prioridad sobre lo declarado acá. Declararlas también en este objeto
  // solo lograba que og:image y twitter:image apuntaran a imágenes distintas.
  twitter: {
    card: "summary_large_image",
    title: "Alertas Aguilares",
    description: "Reporta problemas urbanos en Aguilares, Tucumán.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alertas Aguilares",
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
import CookieConsent from "@/components/legal/CookieConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-jakarta min-h-dvh bg-background text-foreground flex flex-col">
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
        <Toaster richColors position="top-right" />
        <PwaRegister />
        <CookieConsent />
      </body>
    </html>
  );
}
