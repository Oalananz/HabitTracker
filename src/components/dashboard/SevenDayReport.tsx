'use client';

interface DayBlock {
  date: string;
  score: number;
}

interface SevenDayReportProps {
  days: DayBlock[];
}

function scoreToColor(score: number): string {
  if (score >= 9) return 'bg-primary text-on-primary';
  if (score >= 7) return 'bg-primary/70 text-on-primary';
  if (score >= 5) return 'bg-tertiary/70 text-on-surface';
  if (score >= 3) return 'bg-tertiary/30 text-on-surface-variant';
  if (score > 0)  return 'bg-error/20 text-error';
  return 'bg-surface-container-high text-outline';
}

function scoreToBorderColor(score: number): string {
  if (score >= 9) return 'border-primary/60';
  if (score >= 7) return 'border-primary/30';
  if (score >= 5) return 'border-tertiary/40';
  if (score >= 3) return 'border-tertiary/20';
  if (score > 0)  return 'border-error/20';
  return 'border-outline-variant/10';
}

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function SevenDayReport({ days }: SevenDayReportProps) {
  const weekDays = days.slice(-7);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-5">
      <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
        &gt; LAST_7_DAYS
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d, i) => {
          const date = new Date(d.date);
          const dayName = DAY_LABELS[date.getDay()];
          return (
            <div key={d.date} className="text-center space-y-1" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="font-mono text-[8px] text-on-surface-variant uppercase">{dayName}</div>
              <div className={`rounded-sm aspect-square flex items-center justify-center border ${scoreToColor(d.score)} ${scoreToBorderColor(d.score)} transition-all duration-300`}>
                <span className="font-headline text-sm font-black">{d.score}</span>
              </div>
              <div className="font-mono text-[8px] text-outline">{date.getDate()}</div>
            </div>
          );
        })}
        {weekDays.length === 0 && (
          <div className="col-span-7 text-center py-4">
            <span className="font-mono text-xs text-outline">No data yet. Start logging!</span>
          </div>
        )}
      </div>
    </div>
  );
}
