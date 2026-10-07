import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Margaritas 3D | Experiencia Interactiva",
  description: "Animación botánica 3D interactiva de margaritas con física de viento, simulación de floración, ciclo día/noche y juego de deshoje en Next.js y Three.js.",
  keywords: ["Margaritas 3D", "Three.js", "Next.js", "Animación 3D", "WebGL", "Vercel"],
  authors: [{ name: "Next.js 3D Flower Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full w-full overflow-hidden bg-black">{children}</body>
    </html>
  );
}
