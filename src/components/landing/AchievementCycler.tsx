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
        className={`${styles.toastIn} bg-surface-container border-l-4 rounded-md overflow-hidden shadow-2xl shadow-black/40`}
        style={{ borderLeftColor: a.color }}
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1", color: a.color }}>
            workspace_premium
          </span>
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
