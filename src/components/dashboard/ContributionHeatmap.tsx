'use client';

import dayjs from 'dayjs';

interface HeatmapData {
  date: string;
  count: number;
  total: number;
}

interface ContributionHeatmapProps {
  data: HeatmapData[];
}

export default function ContributionHeatmap({ data }: ContributionHeatmapProps) {
  const getIntensity = (count: number, total: number): string => {
    if (total === 0) return 'bg-surface-container-lowest';
    const ratio = count / total;
    if (ratio === 0) return 'bg-surface-container-lowest';
    if (ratio < 0.25) return 'bg-primary/20';
    if (ratio < 0.5) return 'bg-primary/40';
    if (ratio < 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  const weeks: HeatmapData[][] = [];
  let currentWeek: HeatmapData[] = [];

  if (data.length > 0) {
    const firstDay = dayjs(data[0].date).day();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', count: 0, total: 0 });
    }
  }

  data.forEach((d) => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const months: { label: string; col: number }[] = [];
  let lastMonth = '';
  weeks.forEach((week, i) => {
    const validDay = week.find((d) => d.date);
    if (validDay) {
      const month = dayjs(validDay.date).format('MMM');
      if (month !== lastMonth) {
        months.push({ label: month.toUpperCase(), col: i });
        lastMonth = month;
      }
    }
  });

  const dayLabels = ['', 'MON', '', 'WED', '', 'FRI', ''];

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
          <span className="text-primary">&gt;</span> CONSISTENCY/HEATMAP
        </h3>
        <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">LAST 365 DAYS</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-[700px]">
          <div className="flex gap-[2px] mb-1 ml-8">
            {months.map((m, i) => {
              const nextCol = months[i + 1]?.col ?? weeks.length;
              const span = nextCol - m.col;
              return (
                <div key={i} className="font-label text-[9px] text-on-surface-variant" style={{ width: `${span * 13}px` }}>
                  {m.label}
                </div>
              );
            })}
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-[2px] mb-[2px]">
              <span className="font-label text-[9px] text-on-surface-variant w-7 text-right pr-1">{dayLabels[dayIndex]}</span>
              {weeks.map((week, wi) => {
                const cell = week[dayIndex];
                if (!cell || !cell.date) return <div key={wi} className="w-[11px] h-[11px]" />;
                return (
                  <div
                    key={wi}
                    className={`w-[11px] h-[11px] rounded-[2px] ${getIntensity(cell.count, cell.total)} hover:ring-1 hover:ring-primary/50 cursor-pointer`}
                    title={`${cell.date}: ${cell.count}/${cell.total}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="font-label text-[9px] text-on-surface-variant">Less</span>
        {['bg-surface-container-lowest', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary/90'].map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
        ))}
        <span className="font-label text-[9px] text-on-surface-variant">More</span>
      </div>
    </div>
  );
}
