import type { Metadata } from "next";
import { Inter_Tight, Fraunces, Instrument_Serif } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Suliv",
  description: "Suliv",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${interTight.variable} ${fraunces.variable} ${instrumentSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
