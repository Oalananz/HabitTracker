'use client';

import dayjs from 'dayjs';

interface FailureLog {
  id: string;
  timestamp: string;
  note: string | null;
  createdAt: string;
}

interface FailureLogListProps {
  failures: FailureLog[];
  startTime: string;
}

export default function FailureLogList({ failures, startTime }: FailureLogListProps) {
  // Calculate duration between failures
  const getFailureDuration = (index: number): string => {
    const current = dayjs(failures[index].timestamp);
    let previous: dayjs.Dayjs;

    if (index === failures.length - 1) {
      // Last (oldest) failure - duration from start
      previous = dayjs(startTime);
    } else {
      previous = dayjs(failures[index + 1].timestamp);
    }

    const diffHours = current.diff(previous, 'hour');
    const days = Math.floor(diffHours / 24);
    const hours = diffHours % 24;

    return `${days}d  ${hours}h`;
  };

  return (
    <div className="bg-surface-container-lowest rounded-md border border-outline-variant/15 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-error">error</span>
          <span className="font-label text-xs uppercase tracking-widest text-error">
            &gt; LOGS/FAILURE_EVENTS
          </span>
        </div>
      </div>

      {/* Failure List */}
      <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
        {failures.length === 0 ? (
          <div className="p-6 text-center">
            <span className="font-mono text-xs text-on-surface-variant">
              No failure events recorded.
            </span>
          </div>
        ) : (
          failures.map((failure, index) => (
            <div
              key={failure.id}
              className="px-4 py-3 hover:bg-surface-container-low/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-headline text-sm font-semibold text-on-surface">
                    Failure #{failures.length - index}
                  </div>
                  <div className="font-body text-xs text-on-surface-variant mt-1">
                    Duration: {getFailureDuration(index)}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-tertiary">
                  {dayjs(failure.timestamp).format('YYYY-MM-DD')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {failures.length > 0 && (
        <div className="px-4 py-3 border-t border-outline-variant/10">
          <button className="font-label text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors w-full text-center">
            VIEW FULL ARCHIVE →
          </button>
        </div>
      )}
    </div>
  );
}
