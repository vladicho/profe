import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La bola no miente · Profe",
  description: "Análisis de trayectoria para frontón y ráquetbol, en español y portugués.",
  other: { "codex-preview": "development" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>;
}
