'use client';

interface PlanCardProps {
  id: string;
  title: string;
  description: string | null;
  planType: string;
  status: string;
  priority: string;
  category: string | null;
  prayerBlock: string | null;
  startDate: string;
  startTime?: string | null;
  endDate: string | null;
  endTime?: string | null;
  dayOfWeek?: string | null;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const STATUS_CYCLE: Record<string, string> = {
  planned: 'in_progress',
  in_progress: 'completed',
  completed: 'planned',
  cancelled: 'planned',
};

const STATUS_STYLES: Record<string, { badge: string; ribbon: string; icon: string }> = {
  planned:     { badge: 'bg-secondary/15 text-secondary',  ribbon: 'border-l-secondary/60',  icon: 'radio_button_unchecked' },
  in_progress: { badge: 'bg-tertiary/15 text-tertiary',   ribbon: 'border-l-tertiary/60',   icon: 'pending' },
  completed:   { badge: 'bg-primary/15 text-primary',     ribbon: 'border-l-primary/60',    icon: 'check_circle' },
  cancelled:   { badge: 'bg-error/15 text-error',         ribbon: 'border-l-error/60',      icon: 'cancel' },
};

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-error',
  nominal:  'bg-secondary',
  low:      'bg-on-surface-variant/40',
};

const PRAYER_EMOJI: Record<string, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤', maghrib: '🌅', isha: '🌠',
};

const WEEKDAY_LABELS: Record<string, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export default function PlanCard({
  id, title, description, planType, status, priority,
  category, prayerBlock, startDate, startTime, endDate, endTime,
  dayOfWeek, onStatusChange, onEdit, onDelete, compact,
}: PlanCardProps) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.planned;
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const timeLabel = startTime ? `${startTime}${endTime ? `–${endTime}` : ''}` : null;
  const weekdayLabel = dayOfWeek
    ? dayOfWeek.split(',').map(day => WEEKDAY_LABELS[day] || day).join(', ')
    : null;

  return (
    <div className={`relative border-l-2 ${st.ribbon} bg-surface-container-low rounded-r-md border border-l-0 border-outline-variant/10 group transition-all hover:bg-surface-container-high/50 ${
      isCompleted || isCancelled ? 'opacity-55' : ''
    } ${compact ? 'p-2' : 'p-3.5'}`}>

      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={() => onStatusChange?.(id, STATUS_CYCLE[status] || 'planned')}
          title={`Status: ${status} — click to advance`}
          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
        >
          <span className={`material-symbols-outlined text-[18px] ${
            isCompleted ? 'text-primary' : isCancelled ? 'text-error' :
            status === 'in_progress' ? 'text-tertiary' : 'text-outline'
          }`} style={status === 'in_progress' ? { fontVariationSettings: "'FILL' 1" } : undefined}>
            {st.icon}
          </span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-headline text-sm font-semibold leading-snug ${
              isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface'
            }`}>
              {title}
            </h4>

            {/* Action buttons — show on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {onEdit && (
                <button onClick={() => onEdit(id)} className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded-sm" title="Edit">
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(id)} className="p-1 text-on-surface-variant hover:text-error transition-colors rounded-sm" title="Delete">
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              )}
            </div>
          </div>

          {!compact && description && (
            <p className="font-body text-xs text-on-surface-variant mt-0.5 line-clamp-2">{description}</p>
          )}

          {/* Meta tags */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {/* Priority dot */}
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority] || PRIORITY_DOT.nominal}`} title={`Priority: ${priority}`} />

            <span className={`px-1.5 py-0.5 rounded-[2px] font-label text-[9px] uppercase tracking-wide ${st.badge}`}>
              {status.replace('_', ' ')}
            </span>

            {category && (
              <span className="px-1.5 py-0.5 rounded-[2px] bg-surface-container-highest font-label text-[9px] text-on-surface-variant uppercase tracking-wide">
                {category}
              </span>
            )}

            {planType === 'weekly' && weekdayLabel && (
              <span className="px-1.5 py-0.5 rounded-[2px] bg-secondary/10 font-label text-[9px] text-secondary uppercase tracking-wide">
                {weekdayLabel}
              </span>
            )}

            {prayerBlock && (
              <span className="px-1.5 py-0.5 rounded-[2px] bg-primary/10 font-label text-[9px] text-primary uppercase tracking-wide">
                {PRAYER_EMOJI[prayerBlock] || '🕌'} {prayerBlock}
              </span>
            )}

            {timeLabel && (
              <span className="font-mono text-[9px] text-outline ml-auto">⏱ {timeLabel}</span>
            )}

            {!compact && !timeLabel && (
              <span className="font-mono text-[9px] text-outline ml-auto">
                {planType} · {startDate}{endDate && endDate !== startDate ? ` → ${endDate}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
