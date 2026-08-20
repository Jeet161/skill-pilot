import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillPilot — Know what you know.",
  description:
    "An adaptive AI assessment engine that discovers your strengths, identifies your knowledge gaps, adapts to your performance, and verifies your improvement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
