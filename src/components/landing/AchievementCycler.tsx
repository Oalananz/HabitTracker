'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './landing.module.css';

// Real achievements from the app, with the in-app toast's rarity colors.
const ACHIEVEMENTS = [
  { name: 'Lock In', desc: 'Focus streak: 3 consecutive days', rarity: 'Common', color: '#6cdd81' },
  { name: 'Iron Week', desc: 'Full discipline: 7 consecutive days', rarity: 'Uncommon', color: '#6cdd81' },
  { name: 'Elite Protocol', desc: '10/10 seven days in a row', rarity: 'Rare', color: '#a2c9ff' },
  { name: 'GOD MODE', desc: 'Score 10/10 + all discipline clean', rarity: 'Legendary', color: '#fabc45' },
];
const SHOW_MS = 3600;

// Inline medal (matches the app's "workspace_premium" icon) so the landing page
// never downloads the multi-megabyte icon font for a single glyph.
function PremiumIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2a7 7 0 0 0-4 12.74V22l4-1.6 4 1.6v-7.26A7 7 0 0 0 12 2Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
      <path d="m12 5.6 1.1 2.33 2.55.3-1.88 1.74.5 2.53L12 11.23l-2.27 1.27.5-2.53-1.88-1.74 2.55-.3L12 5.6Z" />
    </svg>
  );
}

export default function AchievementCycler() {
  // Starts on Iron Week so the server render matches; cycles only when motion is welcome.
  const [index, setIndex] = useState(1);
  const paused = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % ACHIEVEMENTS.length);
    }, SHOW_MS);
    return () => clearInterval(id);
  }, []);

  const a = ACHIEVEMENTS[index];

  return (
    <div
      className="max-w-[320px]"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}
    >
      <div
        key={a.name}
        className={`${styles.toastIn} bg-surface-container border-l-4 rounded-md overflow-hidden`}
        style={{ borderLeftColor: a.color }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high">
          <PremiumIcon color={a.color} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: a.color }}>
            Achievement unlocked
          </span>
        </div>
        <div className="px-4 py-3">
          <p className="font-headline text-sm font-bold text-on-surface uppercase tracking-wide">{a.name}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">{a.desc}</p>
          <span
            className="inline-block mt-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-surface-container-highest"
            style={{ color: a.color }}
          >
            {a.rarity}
          </span>
        </div>
        <div className="h-0.5 bg-surface-container-highest">
          <div
            className={`${styles.toastTimer} h-full`}
            style={{ backgroundColor: a.color, '--duration': `${SHOW_MS}ms` } as CSSProperties}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {ACHIEVEMENTS.map((item, i) => (
          <span
            key={item.name}
            className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-5' : 'w-1.5 bg-outline-variant'}`}
            style={i === index ? { backgroundColor: a.color } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
