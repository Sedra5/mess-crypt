import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mess'Crypt — Messagerie chiffrée",
  description: "Messagerie chiffrée de bout en bout. Vos conversations privées, protégées.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${sora.variable} ${dmSans.variable}`}>
      <head>
        <Script src="/env-config.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  );
}
