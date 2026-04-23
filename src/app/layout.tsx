import type { Metadata } from "next";
import "./globals.css";
import RootFrame from '@/components/layout/RootFrame';

export const metadata: Metadata = {
  title: "HabitTerminal",
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
        <RootFrame>{children}</RootFrame>
      </body>
    </html>
  );
}
