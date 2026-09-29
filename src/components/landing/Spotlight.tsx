'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import styles from './landing.module.css';

/** A panel with a soft light that follows the pointer (CSS vars, no re-renders). */
export default function Spotlight({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <article onPointerMove={onPointerMove} className={`${styles.spotlight} ${className}`} style={style}>
      {children}
    </article>
  );
}
