'use client';

import { useEffect, useState } from 'react';

// Fixed starting point so the server and client render the same first frame.
const START_SECONDS = ((42 * 24 + 7) * 60 + 13) * 60 + 5;
const MILESTONES = [7, 30, 90];

const pad = (n: number) => String(n).padStart(2, '0');

export default function RecoveryClock() {
  const [elapsed, setElapsed] = useState(START_SECONDS);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(elapsed / 86400);
  const hours = Math.floor((elapsed % 86400) / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div>
      <p className="font-label text-sm text-on-surface">No reels</p>
      <p className="font-mono text-[11px] uppercase tracking-widest text-outline mt-0.5">Clean for</p>
      <p className="font-mono font-bold text-on-surface tabular-nums mt-2 text-[28px] sm:text-[34px] leading-none tracking-tight">
        {days}<span className="text-outline text-lg">d </span>
        {pad(hours)}<span className="text-outline text-lg">h </span>
        {pad(minutes)}<span className="text-outline text-lg">m </span>
        <span className="text-primary">{pad(seconds)}</span><span className="text-outline text-lg">s</span>
      </p>
      <ol className="mt-5 flex items-center gap-2" aria-label="Milestones">
        {MILESTONES.map((m) => {
          const reached = days >= m;
          return (
            <li
              key={m}
              className={`font-mono text-[11px] px-2 py-1 rounded-sm border ${
                reached ? 'border-primary/40 text-primary bg-primary/10' : 'border-outline-variant/40 text-outline'
              }`}
            >
              {reached ? '✓ ' : ''}{m} days
            </li>
          );
        })}
      </ol>
    </div>
  );
}
