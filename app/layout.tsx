import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "ZonAI · Intelligence foncière Mauricie",
  description:
    "Saisissez une adresse en Mauricie. ZonAI croise le rôle d'évaluation 2026, les zones inondables, les milieux humides et le zonage municipal pour révéler les contraintes avant l'offre d'achat.",
  metadataBase: new URL("https://zonai.local"),
  openGraph: {
    title: "ZonAI",
    description: "Intelligence foncière en direct, région Mauricie.",
    type: "website",
    locale: "fr_CA",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
