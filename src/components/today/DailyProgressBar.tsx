'use client';

interface DailyProgressBarProps {
  score: number;
  maxScore?: number;
  completedItems?: number;
  totalItems?: number;
}

export default function DailyProgressBar({
  score,
  maxScore = 10,
  completedItems,
  totalItems,
}: DailyProgressBarProps) {
  const hour = new Date().getHours();
  const isPastEvening = hour >= 20;
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  let statusLabel: string;
  let statusColor: string;
  let barColor: string;

  if (score >= 8) {
    statusLabel = 'Day secured';
    statusColor = 'text-primary';
    barColor = 'bg-primary';
  } else if (score >= 4) {
    statusLabel = 'In progress';
    statusColor = 'text-tertiary';
    barColor = 'bg-tertiary';
  } else if (isPastEvening) {
    statusLabel = 'Not secured yet';
    statusColor = 'text-error';
    barColor = 'bg-error/60';
  } else {
    statusLabel = 'Just getting started';
    statusColor = 'text-on-surface-variant';
    barColor = 'bg-primary/40';
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-on-surface">
            {score}/{maxScore} pts
          </span>
          {completedItems !== undefined && totalItems !== undefined && (
            <>
              <span className="text-on-surface-variant/40">·</span>
              <span className="font-body text-xs text-on-surface-variant">
                {completedItems} of {totalItems} completed
              </span>
            </>
          )}
        </div>
        <span className={`font-label text-[10px] uppercase tracking-widest font-bold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Daily score: ${score} out of ${maxScore}`}
        />
      </div>
    </div>
  );
}
