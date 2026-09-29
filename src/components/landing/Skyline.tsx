'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import styles from './landing.module.css';

// Solid shades per score level (3D faces need opaque colors to shade).
const TOPS = ['#2a2f36', '#23522f', '#2f7a44', '#48a860', '#6cdd81'];
const HEIGHTS = [0, 8, 16, 26, 38]; // px of column height per level

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;

/** Darkens a #rrggbb color for the side faces of a column. */
function shade(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * factor).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/**
 * Half a year of scored days as an isometric skyline: each column's height is
 * that day's score. Pure CSS 3D (no WebGL, no library). Columns rise in a wave
 * when revealed, and the view turns slightly toward the pointer.
 */
export default function Skyline({ levels, weeks, label }: { levels: number[]; weeks: number; label: string }) {
  // ~700 3D faces are costly to style at page load, so the columns mount only
  // once the stage is within 600px of the viewport — before its reveal fires,
  // so the rise animation still plays.
  const stageRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setTimeout(() => setNear(true), 0);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Columns always mount flat, then are released a frame later, so they rise
  // even when the reveal fires in the same instant (e.g. jumping via a nav link).
  useEffect(() => {
    const el = stageRef.current;
    if (!near || !el) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        el.dataset.ready = '';
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [near]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--turn', `${(x * 16).toFixed(1)}deg`);
    e.currentTarget.style.setProperty('--lift', `${(-y * 8).toFixed(1)}deg`);
  };
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--turn', '0deg');
    e.currentTarget.style.setProperty('--lift', '0deg');
  };

  const width = weeks * STEP - GAP;
  const depth = 7 * STEP - GAP;

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={styles.skylineStage}
    >
      <div className={styles.skylineScene} style={{ width, height: depth } as CSSProperties}>
        {near && levels.map((level, i) => {
          const col = Math.floor(i / 7);
          const row = i % 7;
          const h = HEIGHTS[level];
          const top = TOPS[level];
          return (
            <div
              key={i}
              className={styles.skyCol}
              style={
                {
                  left: col * STEP,
                  top: row * STEP,
                  width: CELL,
                  height: CELL,
                  '--col': String(col),
                  '--row': String(row),
                } as CSSProperties
              }
            >
              <span className={styles.skyFace} style={{ background: top, transform: `translateZ(${h + 0.5}px)` }} />
              {h > 0 && (
                <>
                  {/* front face: along the near edge, rotated up out of the floor */}
                  <span
                    className={styles.skyFace}
                    style={{ top: CELL, height: h, background: shade(top, 0.62), transformOrigin: 'top', transform: 'rotateX(90deg)' }}
                  />
                  {/* side face: along the right edge */}
                  <span
                    className={styles.skyFace}
                    style={{ left: CELL, width: h, background: shade(top, 0.45), transformOrigin: 'left', transform: 'rotateY(-90deg)' }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
