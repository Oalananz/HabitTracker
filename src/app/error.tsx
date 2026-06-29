'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="font-mono text-error text-sm mb-4">
          <span className="animate-blink">▊</span> system/fault
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-on-surface mb-3">
          Something broke
        </h1>
        <p className="font-mono text-sm text-on-surface-variant mb-6">
          &gt; an unexpected error occurred. You can retry the operation.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Retry
        </button>
      </div>
    </div>
  );
}
