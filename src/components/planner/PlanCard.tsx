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
  endDate: string | null;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-secondary/20 text-secondary',
  in_progress: 'bg-tertiary/20 text-tertiary',
  completed: 'bg-primary/20 text-primary',
  cancelled: 'bg-error/20 text-error',
};

const PRIORITY_RIBBONS: Record<string, string> = {
  low: 'ribbon-muted',
  nominal: 'ribbon-info',
  critical: 'ribbon-error',
};

export default function PlanCard({
  id,
  title,
  description,
  planType,
  status,
  priority,
  category,
  prayerBlock,
  startDate,
  endDate,
  onStatusChange,
  onEdit,
  onDelete,
  compact,
}: PlanCardProps) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.planned;
  const ribbon = PRIORITY_RIBBONS[priority] || PRIORITY_RIBBONS.nominal;
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  const handleCycleStatus = () => {
    if (!onStatusChange) return;
    const cycle: Record<string, string> = {
      planned: 'in_progress',
      in_progress: 'completed',
      completed: 'planned',
      cancelled: 'planned',
    };
    onStatusChange(id, cycle[status] || 'planned');
  };

  return (
    <div
      className={`${ribbon} bg-surface-container-lowest rounded-md border border-outline-variant/15 transition-all duration-150 hover:bg-surface-container-low/50 group ${
        isCompleted || isCancelled ? 'opacity-60' : ''
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status toggle */}
          <button
            onClick={handleCycleStatus}
            className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              isCompleted
                ? 'bg-primary border-primary'
                : isCancelled
                ? 'bg-error/20 border-error'
                : status === 'in_progress'
                ? 'border-tertiary bg-tertiary/10'
                : 'border-outline-variant hover:border-primary'
            }`}
          >
            {isCompleted && (
              <span className="material-symbols-outlined text-[14px] text-on-primary font-bold">check</span>
            )}
            {isCancelled && (
              <span className="material-symbols-outlined text-[14px] text-error font-bold">close</span>
            )}
            {status === 'in_progress' && (
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h4 className={`font-headline text-sm font-semibold tracking-tight ${
              isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface'
            }`}>
              {title}
            </h4>

            {!compact && description && (
              <p className="font-body text-xs text-on-surface-variant mt-0.5 line-clamp-2">{description}</p>
            )}

            {/* Tags row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-1.5 py-0.5 rounded-[2px] font-label text-[9px] uppercase tracking-wider ${statusColor}`}>
                {status.replace('_', ' ')}
              </span>

              {category && (
                <span className="px-1.5 py-0.5 rounded-[2px] bg-surface-container-high font-label text-[9px] text-on-surface-variant uppercase tracking-wider">
                  {category}
                </span>
              )}

              {prayerBlock && (
                <span className="px-1.5 py-0.5 rounded-[2px] bg-primary/10 font-label text-[9px] text-primary uppercase tracking-wider">
                  ☪ {prayerBlock}
                </span>
              )}

              {!compact && (
                <span className="font-mono text-[9px] text-outline">
                  {planType} • {startDate}{endDate && endDate !== startDate ? ` → ${endDate}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="text-on-surface-variant hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="text-on-surface-variant hover:text-error transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
