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
  title: "CiudadAlerta Aguilares — Reportá tu barrio",
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
  authors: [{ name: "CiudadAlerta" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "CiudadAlerta Aguilares",
    description: "Reportá problemas urbanos en Aguilares, Tucumán.",
    type: "website",
    locale: "es_AR",
    siteName: "CiudadAlerta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0f1d",
};

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
        {children}
      </body>
    </html>
  );
}
