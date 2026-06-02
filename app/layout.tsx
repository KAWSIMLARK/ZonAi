import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "TerraMauricie · Intelligence foncière régionale",
  description:
    "Cherchez un terrain en Mauricie, croisez cadastre, rôles, zones inondables et milieux humides, et voyez les contraintes avant l'offre d'achat.",
  metadataBase: new URL("https://terramauricie.local"),
  openGraph: {
    title: "TerraMauricie",
    description: "Intelligence foncière régionale pour la Mauricie.",
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
