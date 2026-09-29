'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { PRAYER_MARKS, pctFor } from './DayReplay';

/**
 * The page read as a day: a 24h ruler under the nav fills from Fajr to Isha as
 * you scroll, and each prayer tick turns amber once you pass it. Scroll position
 * is written straight to a CSS variable (no React re-renders).
 */
export default function DayScrollBar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ticks = Array.from(el.querySelectorAll<HTMLElement>('[data-at]'));
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.setProperty('--p', progress.toFixed(4));
      for (const tick of ticks) {
        tick.toggleAttribute('data-passed', progress * 100 >= Number(tick.dataset.at));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-px h-[3px]" style={{ '--p': '0' } as CSSProperties}>
      <div className="absolute inset-0 bg-outline-variant/25" />
      <div className="absolute inset-0 origin-left bg-gradient-to-r from-primary/20 via-primary/60 to-primary [transform:scaleX(var(--p))]" />
      {PRAYER_MARKS.map((p) => (
        <span
          key={p.label}
          data-at={pctFor(p.at).toFixed(2)}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rotate-45 bg-outline-variant transition-colors duration-300 data-[passed]:bg-tertiary data-[passed]:shadow-[0_0_8px_#fabc45]"
          style={{ left: `${pctFor(p.at)}%` }}
        />
      ))}
      <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#6cdd81] [left:calc(var(--p)*100%)]" />
    </div>
  );
}
