'use client';

interface TodaySummaryCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: string;
  children?: React.ReactNode;
}

export default function TodaySummaryCard({ label, value, sub, icon, children }: TodaySummaryCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md p-4 flex flex-col gap-1.5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
      <div className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px] text-primary">{icon}</span>
        {label}
      </div>
      <div className="font-headline text-xl font-bold text-on-surface">{value}</div>
      {sub && <div className="font-body text-xs text-on-surface-variant">{sub}</div>}
      {children}
    </div>
  );
}
