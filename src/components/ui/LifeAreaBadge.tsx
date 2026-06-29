'use client';

import { getLifeArea } from '@/lib/lifeAreas';

interface LifeAreaBadgeProps {
  lifeArea: string | null | undefined;
  /** Show a muted "UNASSIGNED" chip instead of nothing when empty. */
  showUnassigned?: boolean;
  className?: string;
}

/** Compact, subtly-colored life-area badge for goal/habit/task cards. */
export default function LifeAreaBadge({ lifeArea, showUnassigned, className = '' }: LifeAreaBadgeProps) {
  const area = getLifeArea(lifeArea);

  if (!area) {
    if (!showUnassigned) return null;
    return (
      <span className={`inline-flex items-center font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] text-outline border border-outline-variant/20 ${className}`}>
        UNASSIGNED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${className}`}
      style={{ color: area.color, backgroundColor: `${area.color}1a`, border: `1px solid ${area.color}40` }}
    >
      <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{area.icon}</span>
      {area.badge}
    </span>
  );
}
