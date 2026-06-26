'use client';

import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';

interface LogEntry {
  timestamp: string;
  category: string;
  message: string;
}

interface ActivityLogProps {
  entries: LogEntry[];
}

const CATEGORY_COLORS: Record<string, string> = {
  SYSTEM: 'text-secondary',
  WORSHIP: 'text-primary',
  DISCIPLINE: 'text-tertiary',
  FOCUS: 'text-secondary',
  SLEEP: 'text-on-surface-variant',
  SCORE: 'text-primary',
  ACHIEVEMENT: 'text-tertiary',
  TASKS: 'text-primary',
  DONE: 'text-surface-tint',
  ERROR: 'text-error',
};

export default function ActivityLog({ entries }: ActivityLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="flex-1 min-h-[280px] bg-surface-container-lowest border border-outline-variant/15 rounded-md overflow-hidden">
      {/* Terminal title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low border-b border-outline-variant/10">
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
        <span className="ml-2 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
          logs/activity
        </span>
      </div>

      <div className="p-4 font-mono text-xs text-on-surface-variant flex flex-col gap-1.5 overflow-y-auto max-h-[340px]">
        {entries.length === 0 && (
          <div className="flex gap-2">
            <span className="text-outline">[{dayjs().format('MMM-DD HH:mm').toUpperCase()}]</span>
            <span className="text-secondary">SYSTEM:</span>
            <span>Daily initialization complete.</span>
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-2 animate-fade-in">
            <span className="text-outline flex-shrink-0">
              [{dayjs(entry.timestamp).format('MMM-DD HH:mm').toUpperCase()}]
            </span>
            <span className={`flex-shrink-0 font-bold ${CATEGORY_COLORS[entry.category] || 'text-on-surface-variant'}`}>
              {entry.category}:
            </span>
            <span className="break-all">{entry.message}</span>
          </div>
        ))}
        <div className="flex gap-2 mt-2 opacity-50">
          <span className="text-primary animate-blink">_</span>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
