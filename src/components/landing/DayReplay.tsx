'use client';

import { useState, type CSSProperties } from 'react';
import styles from './landing.module.css';

// One real-shaped day, scored with the app's actual rules (max 10).
// Times are minutes after midnight.
type Category = 'focus' | 'prayers' | 'quran' | 'night' | 'self' | 'sleep' | 'tasks';

interface LogEvent {
  at: number;
  label: string;
  detail: string;
  kind: 'prayer' | 'score' | 'note';
  points?: number;
  category?: Category;
}

const t = (h: number, m: number) => h * 60 + m;

const EVENTS: LogEvent[] = [
  { at: t(4, 58), label: 'fajr', detail: 'Prayed on time', kind: 'prayer' },
  { at: t(5, 5), label: 'sleep', detail: '7h 30m logged, goal is 7h', kind: 'score', points: 1, category: 'sleep' },
  { at: t(5, 20), label: 'quran', detail: '2 pages, morning dhikr done', kind: 'score', points: 1, category: 'quran' },
  { at: t(9, 0), label: 'focus', detail: 'Deep work block started', kind: 'note' },
  { at: t(12, 31), label: 'dhuhr', detail: 'Prayed', kind: 'prayer' },
  { at: t(15, 52), label: 'asr', detail: 'Prayed', kind: 'prayer' },
  { at: t(16, 10), label: 'focus', detail: '6h logged, goal met', kind: 'score', points: 2, category: 'focus' },
  { at: t(18, 29), label: 'maghrib', detail: 'Prayed', kind: 'prayer' },
  { at: t(19, 45), label: 'isha', detail: 'All five prayers done', kind: 'score', points: 2, category: 'prayers' },
  { at: t(21, 30), label: 'tasks', detail: '5 of 5 done', kind: 'score', points: 1, category: 'tasks' },
  { at: t(22, 5), label: 'self-control', detail: 'No reels, no music, clean day', kind: 'score', points: 2, category: 'self' },
  { at: t(22, 40), label: 'night', detail: 'Witr and 12 sunnah rakahs', kind: 'score', points: 1, category: 'night' },
];

const METERS: { category: Category; label: string; max: number }[] = [
  { category: 'focus', label: 'Focus', max: 2 },
  { category: 'prayers', label: 'Five prayers', max: 2 },
  { category: 'self', label: 'Self-control', max: 2 },
  { category: 'quran', label: 'Quran + dhikr', max: 1 },
  { category: 'night', label: 'Night prayer', max: 1 },
  { category: 'sleep', label: 'Sleep', max: 1 },
  { category: 'tasks', label: 'Tasks', max: 1 },
];

const PRAYER_MARKS = EVENTS.filter((e) => e.kind === 'prayer' || e.label === 'isha');

// The replay compresses 04:30–23:30 into REPLAY_SECONDS.
const DAY_START = t(4, 30);
const DAY_END = t(23, 30);
const REPLAY_SECONDS = 11;
// The first run waits for the console's entrance; replays start right away.
const FIRST_LEAD_IN = 1.7;
const REPLAY_LEAD_IN = 0.4;

const delayAt = (leadIn: number, minute: number) =>
  leadIn + ((minute - DAY_START) / (DAY_END - DAY_START)) * REPLAY_SECONDS;
const pctFor = (minute: number) => ((minute - DAY_START) / (DAY_END - DAY_START)) * 100;
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const vars = (v: Record<string, string>) => v as CSSProperties;

// Running score after each scoring event, as [score, minute of day].
const SCORE_STEPS: [number, number][] = [[0, DAY_START]];
for (const e of EVENTS) {
  if (!e.points) continue;
  SCORE_STEPS.push([SCORE_STEPS[SCORE_STEPS.length - 1][0] + e.points, e.at]);
}
const minuteScoreReaches = (min: number) => SCORE_STEPS.find(([s]) => s >= min)?.[1] ?? DAY_START;

const scoreTone = (score: number) =>
  score >= 8 ? 'text-primary' : score >= 4 ? 'text-tertiary' : 'text-on-surface';

function DayConsole({ leadIn }: { leadIn: number }) {
  const delayFor = (minute: number) => delayAt(leadIn, minute);
  const securedAt = delayFor(minuteScoreReaches(8));

  return (
    <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      {/* One glow the moment the day is secured. */}
      <div
        aria-hidden="true"
        className={`${styles.securedGlow} pointer-events-none absolute inset-0 z-10 ring-1 ring-primary/50 shadow-[inset_0_0_80px_rgba(108,221,129,0.18)]`}
        style={vars({ '--delay': `${securedAt}s` })}
      />
      {/* Log */}
      <ol className="order-2 lg:order-none px-4 sm:px-6 py-5 font-mono text-[12px] sm:text-[13px] leading-relaxed space-y-1.5 border-t lg:border-t-0 lg:border-r border-outline-variant/20">
        {EVENTS.map((e) => (
          <li
            key={`${e.at}-${e.label}`}
            className={`${e.points ? styles.rowFlash : styles.reveal} -mx-2 px-2 rounded-sm grid grid-cols-[3rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_7.5rem_minmax(0,1fr)_auto] gap-x-2 items-baseline`}
            style={vars({ '--delay': `${delayFor(e.at)}s` })}
          >
            <time className="text-outline">{clock(e.at)}</time>
            {/* One cell on phones (label then detail); two grid columns from sm up. */}
            <span className="min-w-0 sm:contents">
              <span className={`mr-2 ${e.kind === 'prayer' ? 'text-tertiary' : e.kind === 'score' ? 'text-primary' : 'text-secondary'}`}>
                {e.label}
              </span>
              <span className="text-on-surface-variant sm:truncate">{e.detail}</span>
            </span>
            <span className="text-primary font-bold tabular-nums w-6 text-right">
              {e.points ? `+${e.points}` : ''}
            </span>
          </li>
        ))}
      </ol>

      {/* Score */}
      <div className="order-1 lg:order-none px-4 sm:px-6 py-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-outline">Day score</p>
        <p className="sr-only">Day score: 10 out of 10. Day secured.</p>
        <div className="flex items-end gap-3 mt-1" aria-hidden="true">
          <div className="relative overflow-hidden h-[0.86em] w-[1.3em] font-mono font-bold leading-[0.86] text-[112px] sm:text-[148px] tracking-[-0.04em]">
            {SCORE_STEPS.map(([score, minute]) => (
              <span
                key={score}
                className={`${styles.scoreStep} absolute inset-0 overflow-hidden text-right bg-[#15191f] ${scoreTone(score)}`}
                style={vars({ '--delay': `${minute === DAY_START ? 0 : delayFor(minute)}s` })}
              >
                {score}
              </span>
            ))}
          </div>
          <span className="font-mono text-2xl text-outline pb-2">/10</span>
        </div>

        {/* Status follows the app's own thresholds: 4+ in progress, 8+ secured. */}
        <div className="relative overflow-hidden mt-4 h-7 font-mono text-[11px] uppercase tracking-[0.18em]" aria-hidden="true">
          <span className="absolute inset-0 flex items-center gap-2 bg-[#15191f] text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-outline" /> Just getting started
          </span>
          <span
            className={`${styles.statusLayer} absolute inset-0 flex items-center gap-2 bg-[#15191f] text-tertiary`}
            style={vars({ '--delay': `${delayFor(minuteScoreReaches(4))}s` })}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> In progress
          </span>
          <span
            className={`${styles.statusLayer} absolute inset-0 flex items-center gap-2 bg-[#15191f] text-primary`}
            style={vars({ '--delay': `${securedAt}s` })}
          >
            <span className={`${styles.statusPing} w-1.5 h-1.5 rounded-full bg-primary`} style={vars({ '--delay': `${securedAt}s` })} /> Day secured
          </span>
        </div>

        <ul className="mt-5 space-y-2.5">
          {METERS.map((m) => {
            const event = EVENTS.find((e) => e.category === m.category);
            const delay = event ? delayFor(event.at) : 0;
            return (
              <li key={m.category} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span
                  className={`${styles.earned} font-label text-[13px] text-on-surface`}
                  style={vars({ '--delay': `${delay}s` })}
                >
                  {m.label}
                </span>
                <span className="flex gap-1" aria-hidden="true">
                  {Array.from({ length: m.max }).map((_, i) => (
                    <span key={i} className="block w-7 h-2 bg-surface-container-highest overflow-hidden">
                      <span
                        className={`${styles.meterFill} block h-full bg-primary`}
                        style={vars({ '--delay': `${delay + i * 0.12}s` })}
                      />
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 24h ruler */}
      <div className="order-3 lg:col-span-2 border-t border-outline-variant/20 px-4 sm:px-6 pt-4 pb-7" aria-hidden="true">
        <div className="relative h-10">
          <div className="absolute left-0 right-0 top-4 h-px bg-outline-variant/60" />
          {Array.from({ length: 19 }).map((_, i) => {
            const minute = t(5 + i, 0);
            const major = (5 + i) % 3 === 0;
            return (
              <div key={minute} className="absolute top-4" style={{ left: `${pctFor(minute)}%` }}>
                <div className={`w-px ${major ? 'h-2.5 bg-outline' : 'h-1.5 bg-outline-variant'}`} />
                {major && (
                  <span className="absolute top-3 -translate-x-1/2 font-mono text-[10px] text-outline">
                    {clock(minute)}
                  </span>
                )}
              </div>
            );
          })}
          {PRAYER_MARKS.map((p) => (
            <div key={p.label} className="absolute top-0" style={{ left: `${pctFor(p.at)}%` }}>
              <span className="absolute -top-0.5 -translate-x-1/2 font-mono text-[10px] text-tertiary hidden sm:block">
                {p.label}
              </span>
              <div
                className={`${styles.markPop} absolute top-3 -translate-x-1/2 w-2 h-2 rotate-45 bg-tertiary`}
                style={vars({ '--delay': `${delayFor(p.at)}s` })}
              />
            </div>
          ))}
          <div
            className={`${styles.cursor} absolute top-1.5 bottom-0`}
            style={vars({ left: '100%', '--from': '0%', '--duration': `${leadIn + REPLAY_SECONDS}s` })}
          >
            <div className="w-0.5 h-full bg-primary shadow-[0_0_12px_#6cdd81]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DayReplay() {
  // Remounting the console restarts every CSS animation from the top.
  const [run, setRun] = useState(0);

  return (
    <figure aria-label="An example day in HabitTerminal, scored hour by hour" className="rounded-md overflow-hidden border border-outline-variant/25 bg-[#15191f] shadow-[0_40px_120px_-40px_rgba(108,221,129,0.25)]">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-error/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">day.log<span className="hidden sm:inline"> — a Tuesday</span></span>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="ml-auto font-mono text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors rounded-sm px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          ↻ Replay the day
        </button>
      </div>
      <DayConsole key={run} leadIn={run === 0 ? FIRST_LEAD_IN : REPLAY_LEAD_IN} />
    </figure>
  );
}
