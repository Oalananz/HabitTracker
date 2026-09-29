import type { Metadata } from 'next';
import Link from 'next/link';
import Wordmark from '@/components/landing/Wordmark';

export const metadata: Metadata = {
  title: 'Privacy — HabitTerminal',
  description: 'What HabitTerminal stores, what it sends to other services, and how to get your data deleted.',
  alternates: { canonical: '/privacy' },
};

// Set CONTACT_EMAIL at build time (see Dockerfile / .env.example).
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || '';
const UPDATED = 'September 30, 2026';

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">{title}</h2>
      <div className="mt-4 space-y-4 text-on-surface-variant leading-relaxed">{children}</div>
    </section>
  );
}

function Contact() {
  return CONTACT_EMAIL ? (
    <a href={`mailto:${CONTACT_EMAIL}`} className={`text-primary underline underline-offset-4 rounded-sm ${focusRing}`}>
      {CONTACT_EMAIL}
    </a>
  ) : (
    <>the operator of this site</>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="border-b border-outline-variant/20">
        <nav aria-label="Main" className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className={`rounded-sm ${focusRing}`} aria-label="HabitTerminal home">
            <Wordmark />
          </Link>
          <Link href="/login" className={`font-label text-sm text-on-surface-variant hover:text-on-surface rounded-sm ${focusRing}`}>
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <p className="font-mono text-[12px] tracking-[0.14em] text-primary">&gt; privacy</p>
        <h1 className="mt-4 font-headline font-bold text-[40px] sm:text-[52px] tracking-[-0.035em] leading-[1]">
          Your data, plainly.
        </h1>
        <p className="mt-5 text-lg text-on-surface-variant leading-relaxed">
          HabitTerminal holds some of the most personal things you track: your prayers, your habits,
          the lines you&apos;re holding yourself to. This page says exactly what is stored, where it
          goes, and how to get it deleted.
        </p>
        <p className="mt-3 font-mono text-[12px] text-outline">Last updated {UPDATED}</p>

        <Section title="What is stored">
          <p>
            <strong className="text-on-surface">Your account:</strong> your email address, your username,
            and your password stored as a salted scrypt hash, never in readable form.
          </p>
          <p>
            <strong className="text-on-surface">What you log:</strong> your daily record (focus hours, the
            five prayers, Quran and dhikr, night prayer, self-control check-ins, sleep), plus the tasks,
            habits, goals, plans, recovery journeys, money entries, learning records and reviews you add.
          </p>
          <p>
            Some of this can reveal your religious practice and private habits. It is visible only to you,
            with one exception you choose: if you join a shared recovery journey, the other participants see
            your username, streak and logged slips for that journey. They never see your email.
          </p>
          <p>
            Everything is kept in the database of the server running this site.
          </p>
        </Section>

        <Section title="Cookies and your device">
          <p>
            One cookie, <code className="font-mono text-on-surface">ht_session</code>, keeps you signed in. It is
            HTTP-only (scripts can&apos;t read it) and expires after 30 days. There are no advertising or
            analytics cookies.
          </p>
          <p>
            So the app works offline, a copy of your data and your profile is kept in your browser&apos;s own
            storage on your device. Signing out clears it.
          </p>
        </Section>

        <Section title="What leaves this server">
          <p>There are no analytics or tracking scripts. Two features contact outside services, and only when you use them:</p>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong className="text-on-surface">Prayer times from your location.</strong> If you allow location
              access, your coordinates are sent from this server to{' '}
              <span className="font-mono text-on-surface">api.aladhan.com</span> to calculate prayer times.
            </li>
            <li>
              <strong className="text-on-surface">AI planner and reviews (optional).</strong> When you ask the AI
              to plan your day, break down a goal, or review your day or week, the items involved are sent to
              Google Gemini: titles, statuses, dates, completion figures, and any reflection text or goal
              description you include. Your email, password and account identifiers are never sent. The AI is
              only available if the operator has enabled it.
            </li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            You can delete your account yourself, any time, under{' '}
            <strong className="text-on-surface">Settings → Account &amp; security</strong>. It permanently removes
            your account and everything in it from the database, including shared journeys you created and
            invites addressed to you. It can&apos;t be undone.
          </p>
          <p>
            Want a copy first? <strong className="text-on-surface">Settings → Data &amp; Backup → Download my data</strong>{' '}
            gives you everything you&apos;ve logged as a single JSON file.
          </p>
          <p>
            If you can&apos;t sign in any more, contact <Contact /> to have your data deleted.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Contact <Contact />. HabitTerminal is open source, so you can also read exactly what the code does.
          </p>
        </Section>

        <div className="mt-16 pt-8 border-t border-outline-variant/20 flex flex-wrap gap-3">
          <Link
            href="/login?mode=register"
            className={`inline-flex items-center bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded-sm ${focusRing}`}
          >
            Create your account
          </Link>
          <Link
            href="/"
            className={`inline-flex items-center font-headline font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded-sm border border-outline-variant/60 text-on-surface hover:border-primary/60 hover:text-primary transition-colors ${focusRing}`}
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
