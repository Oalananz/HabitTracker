import type { Metadata } from 'next';
import Landing from '@/components/landing/Landing';
import { getLandingContent } from '@/lib/landingContent.server';

export const metadata: Metadata = {
  title: 'HabitTerminal — Turn your day into a score',
  description:
    'Track focus, prayer, Quran, sleep, self-control, and daily tasks in one focused daily dashboard — and score every day out of 10. Free and open source.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HabitTerminal — Turn your day into a score',
    description:
      'Track focus, prayer, Quran, sleep, self-control, and daily tasks — and score every day out of 10.',
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
