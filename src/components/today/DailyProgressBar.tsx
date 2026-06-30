'use client';

interface DailyProgressBarProps {
  score: number;
  maxScore?: number;
}

export default function DailyProgressBar({ score, maxScore = 10 }: DailyProgressBarProps) {
  const hour = new Date().getHours();
  const isPastEvening = hour >= 20;

  let statusLabel: string;
  let statusColor: string;

  if (score >= 8) {
    statusLabel = 'Day secured';
    statusColor = 'text-primary';
  } else if (score >= 4) {
    statusLabel = 'In progress';
    statusColor = 'text-tertiary';
  } else if (isPastEvening) {
    statusLabel = 'Not secured yet';
    statusColor = 'text-error';
  } else {
    statusLabel = 'Just getting started';
    statusColor = 'text-on-surface-variant';
  }

  return (
    <div className="border border-outline-variant/15 bg-surface-container-lowest rounded-md px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-headline text-sm font-bold text-on-surface">
          Daily Progress — {score}/{maxScore}
        </span>
        <span className={`font-label text-[10px] uppercase tracking-widest font-bold ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            score >= 8 ? 'bg-primary' : score >= 4 ? 'bg-tertiary' : 'bg-error/60'
          }`}
          style={{ width: `${(score / maxScore) * 100}%` }}
        />
      </div>
    </div>
  );
}
