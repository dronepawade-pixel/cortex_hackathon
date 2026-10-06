import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const faire = Cormorant_Garamond({
  variable: "--font-faire",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const suisse = Inter({
  variable: "--font-suisse",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "ScanAid — Intelligent Wound-Healing Platform | CXHPS07",
  description:
    "Early detection of impaired wound healing via photo + temp/pH tracking. Hackathon MVP.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${faire.variable} ${suisse.variable} h-full`}>
      <body className="flex min-h-full flex-col overflow-x-clip antialiased">{children}</body>
    </html>
  );
}
