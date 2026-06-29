import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="font-mono text-primary text-sm mb-4">
          <span className="animate-blink">▊</span> system/error
        </div>
        <h1 className="font-headline text-6xl md:text-7xl font-black tracking-tighter text-on-surface mb-2">404</h1>
        <p className="font-mono text-sm text-on-surface-variant mb-6">
          &gt; route not found — the requested resource does not exist.
        </p>
        <Link
          href="/today"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Return to Today
        </Link>
      </div>
    </div>
  );
}
