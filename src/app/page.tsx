import type { Metadata } from 'next';
import Landing from '@/components/landing/Landing';
import { getLandingContent } from '@/lib/landingContent.server';

export const metadata: Metadata = {
  title: 'HabitTerminal — Every day gets a score',
  description:
    'Score each day out of 10: focus, the five prayers, Quran and dhikr, self-control, sleep, and your tasks. Free, open source, works offline.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HabitTerminal — Every day gets a score',
    description:
      'Score each day out of 10: focus, the five prayers, Quran and dhikr, self-control, sleep, and your tasks.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

// Static and cacheable; refreshed every 5 minutes and immediately when an admin
// saves the copy (see /api/admin/landing). Signed-in visitors are redirected by
// src/proxy.ts.
export const revalidate = 300;

export default async function Home() {
  return <Landing content={await getLandingContent()} />;
}
