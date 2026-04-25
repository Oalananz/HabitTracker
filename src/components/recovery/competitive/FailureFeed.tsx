'use client';

import dayjs from 'dayjs';
import type { JourneyFailure } from './types';

interface FailureFeedProps {
  failures: JourneyFailure[];
}

export default function FailureFeed({ failures }: FailureFeedProps) {
  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden">
      <div className="px-4 py-3 border-b border-outline-variant/10">
        <h4 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
          <span className="text-primary">&gt;</span> FAILURE_FEED
        </h4>
      </div>

      {failures.length === 0 ? (
        <div className="p-4 font-mono text-xs text-outline">No shared failures logged.</div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto divide-y divide-outline-variant/10">
          {failures.map((failure) => (
            <div key={failure.id} className="p-3 hover:bg-surface-container-lowest/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-body text-sm text-on-surface truncate">
                      <span className="text-error">{failure.username}</span> logged a failure
                    </div>
                    <div className="font-mono text-[10px] text-on-surface-variant">
                      commit {failure.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-tertiary whitespace-nowrap">
                  {dayjs(failure.timestamp).format('MMM D, HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
