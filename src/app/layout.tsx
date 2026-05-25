import type { Metadata } from "next";
/* eslint-disable @next/next/no-page-custom-font */
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import "./globals.css";
import RootFrame from '@/components/layout/RootFrame';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' });

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
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <head>
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
