import Link from 'next/link';
import DayReplay from './DayReplay';
import InView from './InView';
import RecoveryClock from './RecoveryClock';
import Spotlight from './Spotlight';
import styles from './landing.module.css';

const vars = (v: Record<string, string>) => v as React.CSSProperties;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function PrimaryCta({ children = 'Create your account' }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/login?mode=register"
      className={`${styles.shine} inline-flex items-center gap-2 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded-sm ${focusRing}`}
    >
      {children} <span aria-hidden="true" className={styles.shineArrow}>↵</span>
    </Link>
  );
}

function SecondaryCta() {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center font-headline font-bold text-sm uppercase tracking-wider px-6 py-3.5 rounded-sm border border-outline-variant/60 text-on-surface hover:border-primary/60 hover:text-primary transition-colors ${focusRing}`}
    >
      Sign in
    </Link>
  );
}

// The logo's rounded terminal and prompt, drawn crisply at nav size.
function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-7 h-6 rounded-[5px] border-2 border-primary font-mono text-[11px] font-bold leading-none text-primary"
      >
        &gt;_
      </span>
      <span className="font-mono font-bold text-[17px] tracking-tight text-primary">HabitTerminal</span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[12px] tracking-[0.14em] text-primary">
      <span aria-hidden="true">&gt; </span>
      {children}
    </p>
  );
}

// ─── Scoring ledger: the app's real rules, which sum to exactly 10 ───────────
const LEDGER: { rule: string; note: string; points: number }[] = [
  { rule: 'Focus hours reach your goal', note: '6 hours by default', points: 2 },
  { rule: 'All five prayers prayed', note: 'Fajr, Dhuhr, Asr, Maghrib, Isha', points: 2 },
  { rule: 'Self-control held', note: 'No reels, no music, and the one you keep private', points: 2 },
  { rule: 'Quran and dhikr', note: 'Quran plus morning or evening adhkar', points: 1 },
  { rule: 'Night prayer and sunnah', note: 'Night prayer plus 12 sunnah rakahs', points: 1 },
  { rule: 'Sleep reaches your goal', note: '7 hours by default', points: 1 },
  { rule: 'Every task done', note: 'Today’s tasks and habits, all checked off', points: 1 },
];

// ─── Consistency heatmap: deterministic sample data (26 weeks) ───────────────
const WEEKS = 26;
const CURRENT_STREAK = 41;
function heatmapLevels(): number[] {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const total = WEEKS * 7;
  return Array.from({ length: total }, (_, i) => {
    const inStreak = i >= total - CURRENT_STREAK;
    const r = rand();
    if (inStreak) return r > 0.55 ? 4 : r > 0.2 ? 3 : 2;
    const warmth = i / total; // consistency improves over time
    if (r < 0.35 - warmth * 0.25) return 0;
    return 1 + Math.floor(rand() * (2 + warmth * 2));
  });
}
const HEAT_CLASSES = ['bg-surface-container-highest', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];

const PRAYER_BLOCKS: { name: string; time: string; plans: string[]; now?: boolean }[] = [
  { name: 'Fajr', time: '05:08', plans: ['Quran, 2 pages'] },
  { name: 'Dhuhr', time: '12:27', plans: ['Deep work', 'Reply to email'] },
  { name: 'Asr', time: '15:51', plans: ['Gym'], now: true },
  { name: 'Maghrib', time: '18:29', plans: ['Family dinner'] },
  { name: 'Isha', time: '19:45', plans: ['Plan tomorrow'] },
];

const ALSO: { name: string; detail: string }[] = [
  { name: 'Life areas', detail: 'Health, money, work, learning, family and personal. Goals and habits sorted by what they serve.' },
  { name: 'Money', detail: 'Income and expenses, budgets, savings goals, debts and subscriptions.' },
  { name: 'Learning', detail: 'Courses, study sessions, skills and certificates in one place.' },
  { name: 'Weekly review', detail: 'Wins, problems and lessons, with a look across all six areas.' },
  { name: 'AI planner', detail: 'Optional. Drafts your day and breaks down goals using Gemini; only minimal, non-identifying data is sent.' },
];

const SELF_HOST_FACTS: { title: string; detail: string }[] = [
  { title: 'Your data, your database', detail: 'Everything lives in your own Postgres. No analytics, no trackers.' },
  { title: 'Works offline', detail: 'Check in without a connection; your changes sync when you’re back.' },
  { title: 'Installs like an app', detail: 'Add it to your phone or desktop home screen.' },
  { title: 'MIT licensed', detail: 'Read the code, change it, keep it.' },
];

function Panel({ title, detail, children, index }: { title: string; detail: string; children: React.ReactNode; index: number }) {
  return (
    <Spotlight className={`${styles.rise} min-w-0 bg-[#12161c] p-6 sm:p-7 flex flex-col gap-6`} style={vars({ '--i': String(index) })}>
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed max-w-[46ch]">{detail}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </Spotlight>
  );
}

export default function Landing() {
  const levels = heatmapLevels();

  return (
    <div className={`${styles.landingRoot} min-h-screen bg-background text-on-surface overflow-x-clip`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-primary text-on-primary px-3 py-2 rounded-sm font-mono text-xs"
      >
        Skip to content
      </a>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <nav aria-label="Main" className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-6">
          <Link href="/" className={`rounded-sm ${focusRing}`} aria-label="HabitTerminal home">
            <Wordmark />
          </Link>
          <div className="hidden md:flex items-center gap-6 font-label text-sm text-on-surface-variant">
            <a href="#score" className={`hover:text-on-surface transition-colors rounded-sm ${focusRing}`}>How scoring works</a>
            <a href="#system" className={`hover:text-on-surface transition-colors rounded-sm ${focusRing}`}>The system</a>
            <a href="#self-host" className={`hover:text-on-surface transition-colors rounded-sm ${focusRing}`}>Self-hosting</a>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className={`hidden sm:inline-flex font-label text-sm text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-sm transition-colors ${focusRing}`}>
              Sign in
            </Link>
            <Link
              href="/login?mode=register"
              className={`inline-flex bg-scanline-gradient text-on-primary font-headline font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity ${focusRing}`}
            >
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* ── Hero: the thesis is a day being scored ── */}
        <section className="relative">
          <div
            aria-hidden="true"
            className={`${styles.gridDrift} pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-[0.35] [background-image:linear-gradient(to_right,#3e4a3e33_1px,transparent_1px),linear-gradient(to_bottom,#3e4a3e33_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]`}
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-16">
            <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-end">
              <div>
                <div className={styles.enter} style={vars({ '--delay': '0.05s' })}>
                  <Eyebrow>habitterminal today</Eyebrow>
                </div>
                <h1 className="mt-5 font-headline font-bold tracking-[-0.045em] leading-[0.92] text-[46px] sm:text-[68px] lg:text-[88px]">
                  <span className={styles.maskLine}>
                    <span className={styles.maskLineInner} style={vars({ '--delay': '0.15s' })}>Every day gets a score.</span>
                  </span>
                  <span className={styles.maskLine}>
                    <span className={`${styles.maskLineInner} text-primary`} style={vars({ '--delay': '0.32s' })}>
                      Secure yours<span className={`${styles.caret} inline-block w-[0.42em] h-[0.78em] ml-2 align-baseline bg-primary translate-y-[0.06em]`} aria-hidden="true" />
                    </span>
                  </span>
                </h1>
              </div>
              <div className={`${styles.enter} lg:pb-3`} style={vars({ '--delay': '0.5s' })}>
                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-[44ch]">
                  HabitTerminal scores each day out of 10: focus, the five prayers, Quran and dhikr,
                  self-control, sleep, and the tasks you set. Log as you go and you always know where
                  today stands.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <PrimaryCta />
                  <SecondaryCta />
                </div>
                <p className="mt-5 font-mono text-[11px] tracking-wide text-outline">
                  Free · MIT licensed · Runs on your own machine · Works offline
                </p>
              </div>
            </div>

            <div className={`${styles.enterConsole} mt-12 sm:mt-16`} style={vars({ '--delay': '0.75s' })}>
              <DayReplay />
            </div>
          </div>
        </section>

        {/* ── Scoring ledger ── */}
        <section id="score" className="scroll-mt-20 border-t border-outline-variant/20 bg-surface-container-lowest">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-12 lg:gap-16">
            <InView>
              <div className={styles.rise} style={vars({ '--i': '0' })}>
                <Eyebrow>how scoring works</Eyebrow>
              </div>
              <h2 className={`${styles.rise} mt-4 font-headline font-bold text-[34px] sm:text-[48px] tracking-[-0.035em] leading-[1]`} style={vars({ '--i': '1' })}>
                What a 10 is made of.
              </h2>
              <p className={`${styles.rise} mt-5 text-on-surface-variant leading-relaxed max-w-[42ch]`} style={vars({ '--i': '2' })}>
                Seven parts, updated the moment you log something. Reach 8 and the day is secured.
                Miss a part and the breakdown shows you exactly which one.
              </p>
              <p className={`${styles.rise} mt-4 text-sm text-outline max-w-[42ch]`} style={vars({ '--i': '3' })}>
                Your focus and sleep goals are yours to set in Settings.
              </p>
            </InView>

            <InView className="font-mono">
              <ul>
                {LEDGER.map((row, n) => (
                  <li
                    key={row.rule}
                    className={`${styles.rise} py-4 border-b border-dashed border-outline-variant/50 grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 items-baseline`}
                    style={vars({ '--i': String(n) })}
                  >
                    <div className="min-w-0">
                      <p className="font-headline text-[17px] text-on-surface">{row.rule}</p>
                      <p className="text-[12px] text-outline mt-1">{row.note}</p>
                    </div>
                    <span className={`${styles.ledgerPoint} text-primary text-lg font-bold tabular-nums`} style={vars({ '--i': String(n) })}>
                      +{row.points}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={`${styles.rise} pt-5 flex items-baseline justify-between border-t-2 border-on-surface/80 mt-[-1px]`} style={vars({ '--i': String(LEDGER.length + 1) })}>
                <span className="text-[12px] uppercase tracking-[0.2em] text-on-surface-variant">Total</span>
                <span className="text-on-surface text-3xl font-bold tabular-nums">
                  10<span className="text-outline text-lg">/10</span>
                </span>
              </div>
            </InView>
          </div>
        </section>

        {/* ── The system: real fragments of the product ── */}
        <section id="system" className="scroll-mt-20 border-t border-outline-variant/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
            <InView className="max-w-2xl">
              <div className={styles.rise} style={vars({ '--i': '0' })}>
                <Eyebrow>the system</Eyebrow>
              </div>
              <h2 className={`${styles.rise} mt-4 font-headline font-bold text-[34px] sm:text-[48px] tracking-[-0.035em] leading-[1]`} style={vars({ '--i': '1' })}>
                Built around how a day actually runs.
              </h2>
              <p className={`${styles.rise} mt-5 text-on-surface-variant leading-relaxed max-w-[52ch]`} style={vars({ '--i': '2' })}>
                Prayer times anchor the plan, streaks keep you honest, and a year of scored days
                becomes a pattern you can read.
              </p>
            </InView>

            <InView className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/25 border border-outline-variant/25 rounded-md overflow-hidden">
              <Panel
                index={0}
                title="Recovery journeys"
                detail="A live clock for every habit you’re breaking. Log a slip and it restarts. Run one with friends and compare streaks."
              >
                <RecoveryClock />
              </Panel>

              <Panel index={1} title="Consistency" detail="Every scored day, half a year at a glance.">
                {/* Cells scale with the panel, so every week always fits. */}
                <div>
                  <div
                    className="grid grid-flow-col grid-rows-7 gap-[3px]"
                    style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
                    role="img"
                    aria-label={`Consistency heatmap, current streak ${CURRENT_STREAK} days`}
                  >
                    {levels.map((level, i) => (
                      <span
                        key={i}
                        className={`${styles.heatCell} block aspect-square rounded-[2px] ${HEAT_CLASSES[level]}`}
                        style={vars({ '--col': String(Math.floor(i / 7)), '--row': String(i % 7) })}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-4 font-mono text-[12px] text-on-surface-variant">
                  Current streak <span className="text-primary font-bold">{CURRENT_STREAK} days</span>
                </p>
              </Panel>

              <Panel
                index={2}
                title="Planner by prayer blocks"
                detail="Plan between the prayers instead of around an empty calendar. Times come from your location."
              >
                {/* A list on phones, five columns from sm up. */}
                <ol className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                  {PRAYER_BLOCKS.map((b) => (
                    <li
                      key={b.name}
                      className={`min-w-0 rounded-sm border p-2 flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-0 sm:min-h-[112px] ${
                        b.now ? 'border-tertiary/60 bg-tertiary/[0.07]' : 'border-outline-variant/40'
                      }`}
                    >
                      <div className="w-16 shrink-0 sm:w-auto flex flex-col">
                        <span className={`font-label text-[12px] font-bold ${b.now ? 'text-tertiary' : 'text-on-surface'}`}>{b.name}</span>
                        <span className="font-mono text-[10px] text-outline">{b.time}</span>
                      </div>
                      <ul className="flex flex-wrap gap-1 sm:block sm:mt-2 sm:space-y-1">
                        {b.plans.map((p) => (
                          <li key={p} className="text-[11px] leading-snug text-on-surface-variant bg-surface-container-high/70 rounded-[2px] px-1.5 py-1">
                            {p}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel index={3} title="Achievements" detail="47 of them, from Lock In to GOD MODE, unlocked by what you actually do.">
                <div className="max-w-[320px] bg-surface-container border-l-4 border-primary rounded-md overflow-hidden shadow-2xl shadow-black/40">
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      workspace_premium
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary">Achievement unlocked</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-headline text-sm font-bold text-on-surface uppercase tracking-wide">Iron Week</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Full discipline: 7 consecutive days</p>
                    <span className="inline-block mt-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-surface-container-highest text-primary">
                      Uncommon
                    </span>
                  </div>
                </div>
              </Panel>
            </InView>

            <InView className="mt-12">
              <dl className="grid sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8">
              {ALSO.map((item, n) => (
                <div key={item.name} className={`${styles.rise} border-t border-outline-variant/40 pt-4`} style={vars({ '--i': String(n) })}>
                  <dt className="font-headline font-bold text-on-surface">{item.name}</dt>
                  <dd className="mt-2 text-sm text-on-surface-variant leading-relaxed">{item.detail}</dd>
                </div>
              ))}
              </dl>
            </InView>
          </div>
        </section>

        {/* ── Self-hosting ── */}
        <section id="self-host" className="scroll-mt-20 border-t border-outline-variant/20 bg-surface-container-lowest">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <InView>
              <div className={styles.rise} style={vars({ '--i': '0' })}>
                <Eyebrow>self-hosting</Eyebrow>
              </div>
              <h2 className={`${styles.rise} mt-4 font-headline font-bold text-[34px] sm:text-[48px] tracking-[-0.035em] leading-[1]`} style={vars({ '--i': '1' })}>
                Yours, on your machine.
              </h2>
              <p className={`${styles.rise} mt-5 text-on-surface-variant leading-relaxed max-w-[46ch]`} style={vars({ '--i': '2' })}>
                HabitTerminal runs as two containers: the app, and a Postgres database that belongs
                to you. One command starts both.
              </p>
              <dl className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {SELF_HOST_FACTS.map((f, n) => (
                  <div key={f.title} className={styles.rise} style={vars({ '--i': String(n + 3) })}>
                    <dt className="font-headline font-bold text-on-surface">{f.title}</dt>
                    <dd className="mt-1.5 text-sm text-on-surface-variant leading-relaxed">{f.detail}</dd>
                  </div>
                ))}
              </dl>
            </InView>

            <InView className="rounded-md overflow-hidden border border-outline-variant/25">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/20">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">terminal</span>
              </div>
              <pre className="bg-[#0a0e14] px-5 py-6 font-mono text-[13px] leading-7 overflow-x-auto">
                <code>
                  <span className="text-outline">$ </span><span className={`${styles.typeCommand} text-on-surface`}>make up</span>{'\n'}
                  <span className={styles.typeLine} style={vars({ '--i': '0' })}><span className="text-primary"> ✔ </span><span className="text-on-surface-variant">db       healthy</span></span>{'\n'}
                  <span className={styles.typeLine} style={vars({ '--i': '1' })}><span className="text-primary"> ✔ </span><span className="text-on-surface-variant">migrate  18 migrations applied</span></span>{'\n'}
                  <span className={styles.typeLine} style={vars({ '--i': '2' })}><span className="text-primary"> ✔ </span><span className="text-on-surface-variant">app      started</span></span>{'\n'}
                  <span className={styles.typeLine} style={vars({ '--i': '3' })}><span className="text-on-surface">App running at </span><span className="text-primary underline underline-offset-4">http://localhost:3000</span></span>
                </code>
              </pre>
            </InView>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="relative overflow-hidden border-t border-outline-variant/20">
          <InView className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32 text-center">
            {/* An amber horizon rises behind the closing line: dawn, Fajr. */}
            <div
              aria-hidden="true"
              className={`${styles.sunrise} pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-140px] w-[min(1100px,150vw)] h-[440px]`}
            >
              <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(250,188,69,0.22),rgba(250,188,69,0.06)_45%,transparent_70%)]" />
              <div className="absolute left-[12%] right-[12%] top-1/2 h-px bg-gradient-to-r from-transparent via-tertiary/70 to-transparent" />
            </div>
            <p className={`${styles.rise} relative font-mono text-[12px] tracking-[0.2em] uppercase text-tertiary`} style={vars({ '--i': '0' })}>Fajr · 05:08</p>
            <h2 className={`${styles.rise} relative mt-5 font-headline font-bold text-[40px] sm:text-[64px] tracking-[-0.045em] leading-[0.95]`} style={vars({ '--i': '1' })}>
              Tomorrow starts at Fajr.
            </h2>
            <p className={`${styles.rise} relative mt-5 text-on-surface-variant text-lg max-w-[40ch] mx-auto`} style={vars({ '--i': '2' })}>
              Create your account tonight and score your first day tomorrow.
            </p>
            <div className={`${styles.rise} relative mt-9 flex flex-wrap justify-center gap-3`} style={vars({ '--i': '3' })}>
              <PrimaryCta />
              <SecondaryCta />
            </div>
          </InView>
        </section>
      </main>

      <footer className="border-t border-outline-variant/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <Wordmark />
          <p className="font-mono text-[11px] text-outline">© 2026 HabitTerminal · MIT License</p>
        </div>
      </footer>
    </div>
  );
}
