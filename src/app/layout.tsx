import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOVEREIGN_CONSOLE — Habit Tracker + Recovery Journey",
  description: "A production-grade habit tracking and recovery monitoring system with terminal-inspired aesthetics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
