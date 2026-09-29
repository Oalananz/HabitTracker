import type { Metadata } from 'next';
import Landing from '@/components/landing/Landing';

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

// Static and cacheable. Signed-in visitors are redirected by src/proxy.ts.
export default function Home() {
  return <Landing />;
}
