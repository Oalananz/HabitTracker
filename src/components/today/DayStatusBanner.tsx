'use client';

interface DayStatusBannerProps {
  score: number;
  maxScore?: number;
}

export default function DayStatusBanner({ score, maxScore = 10 }: DayStatusBannerProps) {
  const hour = new Date().getHours();
  const isPastEvening = hour >= 20;

  let status: 'secured' | 'progress' | 'failed' | 'init';
  let borderColor: string;
  let textColor: string;
  let bgColor: string;
  let label: string;
  let icon: string;

  if (score >= 8) {
    status = 'secured';
    borderColor = 'border-primary';
    textColor = 'text-primary';
    bgColor = 'bg-primary/5';
    label = `DAY SECURED ✓ ${score}/${maxScore}`;
    icon = 'verified';
  } else if (score >= 4) {
    status = 'progress';
    borderColor = 'border-tertiary';
    textColor = 'text-tertiary';
    bgColor = 'bg-tertiary/5';
    label = `DAY IN PROGRESS — ${score}/${maxScore}`;
    icon = 'pending';
  } else if (isPastEvening && score < 4) {
    status = 'failed';
    borderColor = 'border-error';
    textColor = 'text-error';
    bgColor = 'bg-error/5';
    label = `DAY NOT SECURED ✗ ${score}/${maxScore}`;
    icon = 'cancel';
  } else {
    status = 'init';
    borderColor = 'border-primary/20';
    textColor = 'text-on-surface-variant';
    bgColor = 'bg-surface-container-lowest';
    label = `INITIALIZING — ${score}/${maxScore}`;
    icon = 'radio_button_unchecked';
  }

  void status;

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-sm px-4 py-3 flex items-center justify-between transition-all duration-300`}>
      <div className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${textColor} font-bold`}>
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        {label}
      </div>
      {/* Score bar */}
      <div className="flex gap-0.5 items-center">
        {Array.from({ length: maxScore }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-2 rounded-[1px] transition-all duration-300 ${
              i < score
                ? score >= 8 ? 'bg-primary' : score >= 4 ? 'bg-tertiary' : 'bg-error'
                : 'bg-surface-container-highest'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
