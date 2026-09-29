'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './landing.module.css';

/**
 * Marks its element with data-inview the first time it scrolls into view,
 * which starts the CSS reveal transitions of its descendants. No React state:
 * the attribute is set directly, once.
 */
export default function InView({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.inview = '';
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.inview = '';
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.scrollReveal} ${className}`} style={style}>
      {children}
    </div>
  );
}
