import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoTravel — Devis transport de groupe",
  description: "Obtenez un devis instantané pour votre transport de groupe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
