import Link from 'next/link';
import AchievementCycler from './AchievementCycler';
import DayReplay from './DayReplay';
import DayScrollBar from './DayScrollBar';
import InView from './InView';
import MobileNav from './MobileNav';
import RecoveryClock from './RecoveryClock';
import Wordmark from './Wordmark';
import styles from './landing.module.css';
import type { LandingContent } from '@/lib/landingContent';

const vars = (v: Record<string, string>) => v as React.CSSProperties;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const container = 'mx-auto max-w-6xl px-4 sm:px-6';

// ─── Shared pieces ───────────────────────────────────────────────────────────

function PrimaryCta({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/login?mode=register"
      className={`group inline-flex items-center justify-center gap-2 min-h-12 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider px-6 rounded-sm transition-[filter] hover:brightness-110 ${focusRing}`}
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

function SecondaryCta({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center justify-center min-h-12 font-headline font-bold text-sm uppercase tracking-wider px-6 rounded-sm border border-outline-variant/60 text-on-surface hover:border-primary/60 hover:text-primary transition-colors ${focusRing}`}
    >
      {children}
    </Link>
  );
}

/** Monospace terminal label, e.g. "> PLANNER". */
function TermLabel({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'muted' | 'amber' }) {
  const color = tone === 'primary' ? 'text-primary' : tone === 'amber' ? 'text-tertiary' : 'text-outline';
  return (
    <p className={`font-mono text-[12px] uppercase tracking-[0.18em] ${color}`}>
      <span aria-hidden="true">&gt; </span>
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <div className={styles.rise} style={vars({ '--i': '0' })}>
        <TermLabel>{eyebrow}</TermLabel>
      </div>
      <h2 className={`${styles.rise} mt-3 font-headline font-bold text-[32px] sm:text-[42px] tracking-[-0.03em] leading-[1.05]`} style={vars({ '--i': '1' })}>
        {title}
      </h2>
      {children && (
        <p className={`${styles.rise} mt-4 text-base sm:text-lg text-on-surface-variant leading-relaxed`} style={vars({ '--i': '2' })}>
          {children}
        </p>
      )}
    </div>
  );
}

/** One card style for every product preview, so they read as parts of one system. */
function SystemCard({
  label, title, detail, children, className = '', index,
}: {
  label: string; title: string; detail: string; children: React.ReactNode; className?: string; index: number;
}) {
  return (
    <article
      className={`${styles.rise} min-w-0 flex flex-col rounded-md border border-outline-variant/30 bg-[#12161c] transition-colors hover:border-outline-variant/60 ${className}`}
      style={vars({ '--i': String(index) })}
    >
      <div className="px-5 sm:px-6 py-3 border-b border-outline-variant/20">
        <TermLabel tone="muted">{label}</TermLabel>
      </div>
      <div className="p-5 sm:p-6 flex flex-col gap-5 flex-1">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface tracking-tight">{title}</h3>
          <p className="mt-1.5 text-[15px] text-on-surface-variant leading-relaxed">{detail}</p>
        </div>
        <div className="mt-auto">{children}</div>
      </div>
    </article>
  );
}

// ─── Scoring: the app's real rules, which sum to exactly 10 ──────────────────

const SCORE_RULES: { points: number; title: string; detail: string }[] = [
  { points: 2, title: 'Focus hours', detail: 'Reach your daily focus goal (6h by default).' },
  { points: 2, title: 'Five prayers', detail: 'Fajr, Dhuhr, Asr, Maghrib and Isha.' },
  { points: 2, title: 'Self-control', detail: 'No reels, no music, and your private commitment.' },
  { points: 1, title: 'Quran & dhikr', detail: 'Quran plus morning or evening adhkar.' },
  { points: 1, title: 'Night prayer', detail: 'Night prayer and 12 sunnah rakahs.' },
  { points: 1, title: 'Sleep goal', detail: 'Sleep reaches your goal (7h by default).' },
  { points: 1, title: 'Daily tasks', detail: 'Every task and habit for today, done.' },
];

// ─── Planner: one real-shaped day between the five prayers ───────────────────

const DAY_END_MINUTE = 23 * 60;
const PRAYER_DAY: { name: string; time: string; minute: number; plans: string[] }[] = [
  { name: 'Fajr', time: '05:08', minute: 5 * 60 + 8, plans: ['Quran, 2 pages', 'Deep work'] },
  { name: 'Dhuhr', time: '12:27', minute: 12 * 60 + 27, plans: ['Lunch', 'Reply to email'] },
  { name: 'Asr', time: '15:51', minute: 15 * 60 + 51, plans: ['Gym'] },
  { name: 'Maghrib', time: '18:29', minute: 18 * 60 + 29, plans: ['Family dinner'] },
  { name: 'Isha', time: '19:45', minute: 19 * 60 + 45, plans: ['Read', 'Plan tomorrow'] },
];
const NOW = { block: 'Asr', minute: 16 * 60 + 40, label: '16:40' };

/**
 * The day as five prayer blocks. On wider screens each block's width is
 * proportional to the real time until the next prayer, so the planner shows
 * the shape of an actual day rather than an empty calendar.
 */
function PrayerDay() {
  const spans = PRAYER_DAY.map((b, i) => (PRAYER_DAY[i + 1]?.minute ?? DAY_END_MINUTE) - b.minute);
  const columns = spans.map((m) => `minmax(6.5rem, ${m}fr)`).join(' ');

  return (
    <ol className="grid grid-cols-1 gap-2 md:gap-1.5 md:[grid-template-columns:var(--cols)]" style={vars({ '--cols': columns })}>
      {PRAYER_DAY.map((b, i) => {
        const isNow = b.name === NOW.block;
        const nowPct = isNow ? ((NOW.minute - b.minute) / spans[i]) * 100 : 0;
        return (
          <li
            key={b.name}
            className={`relative min-w-0 rounded-sm border p-3 flex items-start gap-4 md:flex-col md:gap-3 md:min-h-[150px] ${
              isNow ? 'border-tertiary/60 bg-tertiary/[0.06]' : 'border-outline-variant/35 bg-surface-container-lowest/60'
            }`}
          >
            <div className="w-20 shrink-0 md:w-auto">
              <p className={`font-headline font-bold text-[15px] ${isNow ? 'text-tertiary' : 'text-on-surface'}`}>{b.name}</p>
              <p className="font-mono text-[12px] text-outline">{b.time}</p>
            </div>
            <ul className="flex flex-wrap gap-1.5 md:flex-col md:items-stretch">
              {b.plans.map((p) => (
                <li key={p} className="text-[13px] leading-snug text-on-surface-variant bg-surface-container-high/80 rounded-[3px] px-2 py-1">
                  {p}
                </li>
              ))}
            </ul>
            {isNow && (
              <div aria-hidden="true" className="hidden md:block absolute top-0 bottom-0 w-px bg-tertiary/80" style={{ left: `${nowPct}%` }}>
                <span className="absolute -top-2.5 -translate-x-1/2 font-mono text-[10px] text-background bg-tertiary px-1 rounded-[2px]">
                  {NOW.label}
                </span>
              </div>
            )}
            {isNow && <span className="md:hidden ml-auto font-mono text-[11px] text-tertiary">now</span>}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Consistency: deterministic sample data (26 weeks) ──────────────────────

const WEEKS = 26;
const CURRENT_STREAK = 41;
const HEAT = ['bg-surface-container-highest', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];

function heatmapLevels(): number[] {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const total = WEEKS * 7;
  return Array.from({ length: total }, (_, i) => {
    const r = rand();
    if (i >= total - CURRENT_STREAK) return r > 0.55 ? 4 : r > 0.2 ? 3 : 2;
    const warmth = i / total; // consistency improves over time
    if (r < 0.35 - warmth * 0.25) return 0;
    return 1 + Math.floor(rand() * (2 + warmth * 2));
  });
}

function Heatmap() {
  const levels = heatmapLevels();
  return (
    <div>
      <div
        role="img"
        aria-label={`Consistency heatmap of the last 26 weeks; current streak ${CURRENT_STREAK} days`}
        className="grid grid-flow-col grid-rows-7 gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        {levels.map((level, i) => (
          <span key={i} className={`block aspect-square rounded-[2px] ${HEAT[level]}`} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 font-mono text-[12px] text-on-surface-variant">
        <span>
          Current streak <span className="text-primary font-bold">{CURRENT_STREAK} days</span>
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          less {HEAT.map((c) => <span key={c} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />)} more
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Landing({ content }: { content: LandingContent }) {
  const { hero, cta, scoring, features, pillars, closing } = content;
  const navLinks = [
    ...(scoring.visible ? [{ href: '#how-it-works', label: 'How it works' }] : []),
    ...(features.visible ? [{ href: '#features', label: 'Features' }] : []),
  ];

  return (
    <div className={`${styles.landingRoot} min-h-screen bg-background text-on-surface overflow-x-clip`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-primary text-on-primary px-3 py-2 rounded-sm font-mono text-xs"
      >
        Skip to content
      </a>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-background/85 backdrop-blur-md">
        <nav aria-label="Main" className={`${container} h-16 flex items-center gap-8`}>
          <Link href="/" className={`rounded-sm ${focusRing}`} aria-label="HabitTerminal home">
            <Wordmark />
          </Link>
          <div className="hidden md:flex items-center gap-7 font-label text-sm text-on-surface-variant">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className={`hover:text-on-surface transition-colors rounded-sm ${focusRing}`}>{l.label}</a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className={`hidden md:inline-flex font-label text-sm text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-sm transition-colors ${focusRing}`}>
              {cta.secondary}
            </Link>
            <Link
              href="/login?mode=register"
              className={`hidden min-[440px]:inline-flex items-center min-h-10 whitespace-nowrap bg-scanline-gradient text-on-primary font-headline font-bold text-xs uppercase tracking-wider px-4 rounded-sm hover:brightness-110 transition-[filter] ${focusRing}`}
            >
              Create account
            </Link>
            <MobileNav
              links={[...navLinks, { href: '/login', label: cta.secondary }]}
              cta={{ href: '/login?mode=register', label: 'Create account' }}
            />
          </div>
        </nav>
        <DayScrollBar />
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section className="relative" aria-labelledby="hero-title">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-40 [background-image:linear-gradient(to_right,#3e4a3e33_1px,transparent_1px),linear-gradient(to_bottom,#3e4a3e33_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_72%)]"
          />
          <div className={`relative ${container} pt-12 sm:pt-16 pb-14 sm:pb-20`}>
            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-end">
              <div className={styles.enterVisible} style={vars({ '--delay': '0s' })}>
                <TermLabel>{hero.eyebrow}</TermLabel>
                <h1 id="hero-title" className="mt-5 font-headline font-bold tracking-[-0.04em]">
                  <span className="block text-[42px] sm:text-[60px] lg:text-[72px] leading-[0.98]">{hero.titleLine1}</span>
                  <span className="block mt-4 text-[22px] sm:text-[28px] lg:text-[30px] leading-[1.2] tracking-[-0.02em] text-primary">
                    {hero.titleLine2}
                    <span className={`${styles.caret} inline-block w-[0.5em] h-[0.9em] ml-1.5 align-[-0.1em] bg-primary`} aria-hidden="true" />
                  </span>
                </h1>
              </div>
              <div className={`${styles.enterVisible} lg:pb-2`} style={vars({ '--delay': '0.1s' })}>
                <p className="text-[17px] sm:text-lg text-on-surface-variant leading-relaxed max-w-[42ch]">{hero.subtitle}</p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <PrimaryCta>{cta.primary}</PrimaryCta>
                  <SecondaryCta>{cta.secondary}</SecondaryCta>
                </div>
                <p className="mt-5 font-mono text-[12px] tracking-wide text-outline">{hero.meta}</p>
              </div>
            </div>

            {/* The product is the centerpiece: a real day being scored. */}
            <div className={`${styles.enterConsole} mt-12 sm:mt-14`} style={vars({ '--delay': '0.3s' })}>
              <DayReplay />
            </div>
          </div>
        </section>

        {/* ── How scoring works ── */}
        {scoring.visible && (
          <section id="how-it-works" className="scroll-mt-20 border-t border-outline-variant/20 bg-surface-container-lowest">
            <InView className={`${container} py-16 sm:py-20`}>
              <SectionHeading eyebrow={scoring.eyebrow} title={scoring.title}>
                {scoring.statement}
              </SectionHeading>
              <ul className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Daily score rules">
                {SCORE_RULES.map((rule, n) => (
                  <li
                    key={rule.title}
                    className={`${styles.rise} rounded-md border border-outline-variant/30 bg-[#12161c] p-4 sm:p-5 transition-colors hover:border-outline-variant/60`}
                    style={vars({ '--i': String(n + 1) })}
                  >
                    <p className="font-mono font-bold text-primary text-[28px] sm:text-[32px] leading-none tabular-nums">+{rule.points}</p>
                    <p className="mt-3 font-headline font-bold text-[16px] sm:text-[17px] text-on-surface">{rule.title}</p>
                    <p className="mt-1 text-[13px] sm:text-sm text-on-surface-variant leading-snug">{rule.detail}</p>
                  </li>
                ))}
                <li
                  className={`${styles.rise} col-span-2 lg:col-span-1 rounded-md border border-primary/50 bg-primary/[0.06] p-4 sm:p-5 flex flex-col justify-between`}
                  style={vars({ '--i': '8' })}
                >
                  <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-primary"><span aria-hidden="true">= </span>Total</p>
                  <p className="mt-3 font-mono font-bold text-on-surface text-[40px] leading-none tabular-nums">
                    10<span className="text-outline text-[22px]"> / 10</span>
                  </p>
                  <p className="mt-2 text-[13px] sm:text-sm text-on-surface-variant">Score 8 or more to secure the day.</p>
                </li>
              </ul>
            </InView>
          </section>
        )}

        {/* ── Features ── */}
        {features.visible && (
          <section id="features" className="scroll-mt-20 border-t border-outline-variant/20">
            <InView className={`${container} py-16 sm:py-20`}>
              <SectionHeading eyebrow={features.eyebrow} title={features.title}>
                {features.intro}
              </SectionHeading>

              <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <SystemCard
                  index={1}
                  className="md:col-span-2 lg:col-span-3"
                  label="Planner"
                  title="Planner by prayer blocks"
                  detail="Plan your day around Fajr, Dhuhr, Asr, Maghrib and Isha — each block sized to the real time between prayers."
                >
                  <PrayerDay />
                </SystemCard>
                <SystemCard index={2} label="Recovery" title="Recovery journey" detail="See your progress even after an imperfect day.">
                  <RecoveryClock />
                </SystemCard>
                <SystemCard index={3} label="Consistency" title="Consistency" detail="Track streaks and consistency without making the streak itself the goal.">
                  <Heatmap />
                </SystemCard>
                <SystemCard
                  index={4}
                  className="md:col-span-2 lg:col-span-1"
                  label="Achievements"
                  title="Achievements"
                  detail="Turn consistent actions into milestones."
                >
                  <AchievementCycler />
                </SystemCard>
              </div>
            </InView>
          </section>
        )}

        {/* ── Why HabitTerminal ── */}
        {pillars.visible && pillars.items.length > 0 && (
          <section id="why" className="scroll-mt-20 border-t border-outline-variant/20 bg-surface-container-lowest">
            <InView className={`${container} py-16 sm:py-20`}>
              <SectionHeading eyebrow={pillars.eyebrow} title={pillars.title} />
              <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {pillars.items.map((item, n) => (
                  <div key={`${n}-${item.title}`} className={`${styles.rise} border-t border-outline-variant/40 pt-5`} style={vars({ '--i': String(n + 1) })}>
                    <span aria-hidden="true" className="block -mt-[21px] mb-4 h-[2px] w-8 bg-primary" />
                    <dt className="font-headline font-bold text-[18px] text-on-surface">{item.title}</dt>
                    <dd className="mt-1.5 text-[15px] text-on-surface-variant leading-relaxed">{item.detail}</dd>
                  </div>
                ))}
              </dl>
              <p className={`${styles.rise} mt-10 text-[15px] text-on-surface-variant`} style={vars({ '--i': '5' })}>
                Private by design: no ads and no trackers.{' '}
                <Link href="/privacy" className={`text-primary underline underline-offset-4 rounded-sm ${focusRing}`}>
                  See exactly what’s stored
                </Link>
              </p>
            </InView>
          </section>
        )}

        {/* ── Final call to action ── */}
        {closing.visible && (
          <section className="border-t border-outline-variant/20" aria-labelledby="closing-title">
            <InView className={`${container} py-20 sm:py-24 text-center`}>
              <div aria-hidden="true" className="mx-auto mb-8 h-px max-w-md bg-gradient-to-r from-transparent via-tertiary/70 to-transparent" />
              <div className={styles.rise} style={vars({ '--i': '0' })}>
                <TermLabel tone="amber">{closing.eyebrow}</TermLabel>
              </div>
              <h2 id="closing-title" className={`${styles.rise} mt-4 font-headline font-bold text-[38px] sm:text-[56px] tracking-[-0.04em] leading-[1]`} style={vars({ '--i': '1' })}>
                {closing.title}
              </h2>
              <p className={`${styles.rise} mt-4 text-lg text-on-surface-variant`} style={vars({ '--i': '2' })}>{closing.subtitle}</p>
              <div className={`${styles.rise} mt-8 flex flex-col sm:flex-row justify-center gap-3 max-w-sm sm:max-w-none mx-auto`} style={vars({ '--i': '3' })}>
                <PrimaryCta>{cta.primary}</PrimaryCta>
                <SecondaryCta>{cta.secondary}</SecondaryCta>
              </div>
            </InView>
          </section>
        )}
      </main>

      <footer className="border-t border-outline-variant/20">
        <div className={`${container} py-8 flex flex-col sm:flex-row items-center gap-4 justify-between`}>
          <Wordmark />
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-label text-sm text-on-surface-variant">
            <Link href="/privacy" className={`hover:text-on-surface rounded-sm ${focusRing}`}>Privacy</Link>
            <Link href="/login" className={`hover:text-on-surface rounded-sm ${focusRing}`}>Sign in</Link>
            <span className="font-mono text-[12px] text-outline">© 2026 HabitTerminal</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
