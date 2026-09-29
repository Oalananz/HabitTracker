import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserId } from '@/lib/auth';
import Landing from '@/components/landing/Landing';

export const metadata: Metadata = {
  title: 'HabitTerminal — Every day gets a score',
  description:
    'Score each day out of 10: focus, the five prayers, Quran and dhikr, self-control, sleep, and your tasks. Self-hosted, works offline.',
  openGraph: {
    title: 'HabitTerminal — Every day gets a score',
    description:
      'Score each day out of 10: focus, the five prayers, Quran and dhikr, self-control, sleep, and your tasks.',
    images: ['/logo.png'],
  },
};

export default async function Home() {
  // Signed-in visitors go straight to their day; everyone else sees the landing page.
  let userId: string | null = null;
  try {
    userId = await getAuthUserId();
  } catch {
    // Database unreachable: still show the landing page.
  }
  if (userId) redirect('/today');

  return <Landing />;
}
