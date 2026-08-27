import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Localizador de Erosão | Visualização 2D/3D Paraná & Brasil",
  description:
    "Sistema de informação geográfica (GIS) para análise, visualização 2D/3D e triagem de 150 pontos críticos de erosão no Estado do Paraná e Brasil. Mestrado PPGTCA.",
  keywords: [
    "Erosão Laminar",
    "Paraná",
    "GIS",
    "Google Earth Engine",
    "BSI",
    "Sensoriamento Remoto",
    "MapLibre GL",
    "PPGTCA",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⛰️</text></svg>" />
      </head>
      <body className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
