import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TBM — Back-office | Ticket Bus Mali",
  description:
    "Back-office TBM : gestion des compagnies, supervision des transactions, remboursements, journal d’audit et paramétrage.",
  keywords: ["TBM", "Ticket Bus Mali", "back-office", "transport", "Bamako"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TBM — Back-office | Ticket Bus Mali",
    description:
      "Compagnies, transactions, remboursements et audit au même endroit.",
    siteName: "TBM — Ticket Bus Mali",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
