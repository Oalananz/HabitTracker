'use client';

import dayjs from 'dayjs';

interface TimerDisplayProps {
  startTime: string;
  now: number;
}

export default function TimerDisplay({ startTime, now }: TimerDisplayProps) {
  const start = dayjs(startTime);
  const current = dayjs(now);
  const diffMs = Math.max(0, current.diff(start));
  const totalSeconds = Math.floor(diffMs / 1000);
  const elapsed = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };

  // Target: 90 days
  const targetDays = 90;
  const progress = Math.min((elapsed.days / targetDays) * 100, 100);

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary">timer</span>
          <span className="font-mono text-xs text-on-surface-variant">
            &gt; system/timer --since=&apos;{dayjs(startTime).format('YYYY-MM-DD')}&apos;
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">live</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="p-8 md:p-12 flex justify-center items-center">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Days */}
          <div className="text-center">
            <div className="font-headline text-5xl md:text-7xl font-black text-primary tracking-tighter" style={{ letterSpacing: '-0.03em' }}>
              {String(elapsed.days).padStart(2, '0')}
            </div>
            <div className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-1">Days</div>
          </div>

          <span className="font-headline text-3xl md:text-5xl text-outline-variant font-bold">:</span>

          {/* Hours */}
          <div className="text-center">
            <div className="font-headline text-5xl md:text-7xl font-black text-on-surface tracking-tighter" style={{ letterSpacing: '-0.03em' }}>
              {String(elapsed.hours).padStart(2, '0')}
            </div>
            <div className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-1">Hrs</div>
          </div>

          <span className="font-headline text-3xl md:text-5xl text-outline-variant font-bold">:</span>

          {/* Minutes */}
          <div className="text-center">
            <div className="font-headline text-5xl md:text-7xl font-black text-on-surface tracking-tighter" style={{ letterSpacing: '-0.03em' }}>
              {String(elapsed.minutes).padStart(2, '0')}
            </div>
            <div className="font-label text-xs text-on-surface-variant uppercase tracking-widest mt-1">Min</div>
          </div>
        </div>
      </div>

      {/* Progress Target */}
      <div className="px-6 pb-6 flex justify-center">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-4 py-2 font-mono text-xs text-on-surface-variant">
          Target: {targetDays} Days [{progress.toFixed(1)}% Complete]
        </div>
      </div>
    </div>
  );
}
