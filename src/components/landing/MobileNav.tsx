'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavLink {
  href: string;
  label: string;
}

/** Collapsed navigation for small screens (the desktop links are hidden below md). */
export default function MobileNav({ links, cta }: { links: NavLink[]; cta?: NavLink }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className="w-11 h-11 -mr-2 flex items-center justify-center rounded-sm text-on-surface-variant hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-outline-variant/25 bg-background shadow-[0_24px_40px_-16px_rgba(0,0,0,0.8)]"
        >
          <ul className="px-4 pt-2 pb-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center min-h-12 font-label text-base text-on-surface-variant hover:text-on-surface border-b border-outline-variant/15 last:border-b-0"
                >
                  <span className="font-mono text-primary mr-3" aria-hidden="true">&gt;</span>
                  {l.label}
                </Link>
              </li>
            ))}
            {cta && (
              <li className="pt-3">
                <Link
                  href={cta.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center min-h-12 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm"
                >
                  {cta.label}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
