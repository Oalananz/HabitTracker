'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export default function AchievementToast() {
  const { newlyUnlockedAchievements, clearNewAchievements } = useStore();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<{ name: string; desc: string; rarity: string } | null>(null);

  useEffect(() => {
    if (newlyUnlockedAchievements.length === 0) return;
    const ach = newlyUnlockedAchievements[0];
    setCurrent({ name: ach.name, desc: ach.desc, rarity: ach.rarity });
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        clearNewAchievements();
        setCurrent(null);
      }, 400);
    }, 4000);

    return () => clearTimeout(timer);
  }, [newlyUnlockedAchievements, clearNewAchievements]);

  if (!current) return null;

  const rarityColor = current.rarity === 'LEGENDARY' ? '#fabc45'
    : current.rarity === 'EPIC' ? 'var(--color-tertiary)'
    : current.rarity === 'RARE' ? 'var(--color-secondary)'
    : 'var(--color-primary)';

  return (
    <div
      className={`fixed top-4 right-4 z-[200] max-w-[320px] w-full transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="bg-surface-container border-l-4 rounded-md shadow-2xl shadow-black/40 overflow-hidden"
        style={{ borderLeftColor: rarityColor }}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high">
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1", color: rarityColor }}
          >
            workspace_premium
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold" style={{ color: rarityColor }}>
            ACHIEVEMENT UNLOCKED
          </span>
        </div>
        {/* Body */}
        <div className="px-4 py-3">
          <div className="font-headline text-sm font-bold text-on-surface uppercase tracking-wide">{current.name}</div>
          <div className="font-body text-xs text-on-surface-variant mt-0.5">{current.desc}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-surface-container-highest"
              style={{ color: rarityColor }}>
              {current.rarity}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-surface-container-highest">
          <div
            className="h-full transition-all ease-linear"
            style={{ width: visible ? '0%' : '100%', transitionDuration: '4000ms', backgroundColor: rarityColor }}
          />
        </div>
      </div>
    </div>
  );
}
