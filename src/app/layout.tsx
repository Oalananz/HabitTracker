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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-on-surface antialiased">
        <RootFrame>{children}</RootFrame>
      </body>
    </html>
  );
}
