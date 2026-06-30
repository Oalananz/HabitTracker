'use client';

import { useState } from 'react';
import type { GoalBreakerOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId } from '@/lib/lifeAreas';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import { AiSection } from './AiPrimitives';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-error', medium: 'text-secondary', low: 'text-on-surface-variant',
};

export default function AiGoalBreakdownPreview({
  breakdown, onAddTasks, onAddHabits, addingTasks, addingHabits,
}: {
  breakdown: GoalBreakerOutput;
  onAddTasks?: () => void;
  onAddHabits?: () => void;
  addingTasks?: boolean;
  addingHabits?: boolean;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const taskCount = breakdown.milestones.reduce((n, m) => n + m.tasks.length, 0);

  return (
    <div className="space-y-5">
      {/* Strategy + meta */}
      <div className="flex items-start gap-3 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-[2px] bg-primary/10 text-primary">
          ~{breakdown.estimatedDurationWeeks} weeks
        </span>
        <LifeAreaBadge lifeArea={lifeAreaLabelToId(breakdown.lifeArea)} />
      </div>
      {breakdown.strategy && <p className="font-body text-sm text-on-surface">{breakdown.strategy}</p>}

      {/* First three actions */}
      {breakdown.firstThreeActions.length > 0 && (
        <AiSection icon="bolt" label="FIRST 3 ACTIONS">
          <ol className="space-y-1">
            {breakdown.firstThreeActions.map((a, i) => (
              <li key={i} className="font-body text-sm text-on-surface flex gap-2">
                <span className="font-headline text-primary font-bold">{i + 1}.</span>{a}
              </li>
            ))}
          </ol>
        </AiSection>
      )}

      {/* Milestones (collapsible) */}
      {breakdown.milestones.length > 0 && (
        <AiSection icon="flag" label={`MILESTONES (${breakdown.milestones.length}) · ${taskCount} TASKS`}>
          <div className="space-y-2">
            {breakdown.milestones.map((m, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-sm border border-outline-variant/10 overflow-hidden">
                <button onClick={() => toggle(i)} className="w-full flex items-center justify-between px-3 py-2 text-left">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="font-headline text-xs font-bold text-primary">M{m.order}</span>
                    <span className="font-headline text-sm font-bold text-on-surface truncate">{m.title}</span>
                  </span>
                  <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${open.has(i) ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {open.has(i) && (
                  <div className="px-3 pb-3 border-t border-outline-variant/10 animate-fade-in">
                    {m.description && <p className="font-body text-xs text-on-surface-variant py-2">{m.description}</p>}
                    <div className="space-y-1.5">
                      {m.tasks.map((t, ti) => (
                        <div key={ti} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[14px] text-outline mt-0.5">check_box_outline_blank</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-body text-sm text-on-surface">{t.title}</span>
                              <span className="font-mono text-[9px] text-on-surface-variant">{t.estimatedMinutes}m</span>
                              <span className={`font-mono text-[9px] uppercase ${PRIORITY_COLOR[t.priority] || ''}`}>{t.priority}</span>
                            </div>
                            {t.description && <p className="font-body text-[11px] text-on-surface-variant">{t.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {onAddTasks && taskCount > 0 && (
            <button onClick={onAddTasks} disabled={addingTasks} className="mt-2 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary font-label text-[10px] uppercase tracking-wider rounded-sm hover:bg-primary/10 transition-all disabled:opacity-50">
              {addingTasks ? 'Adding…' : `+ Add ${taskCount} tasks to Today`}
            </button>
          )}
        </AiSection>
      )}

      {/* Suggested habits */}
      {breakdown.suggestedHabits.length > 0 && (
        <AiSection icon="cached" label="SUGGESTED HABITS">
          <div className="space-y-1.5">
            {breakdown.suggestedHabits.map((h, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap font-body text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-primary">add_circle</span>
                <span className="font-bold text-on-surface">{h.title}</span>
                <span className="font-mono text-[9px] uppercase text-on-surface-variant">{h.frequency} · {h.estimatedMinutes}m</span>
                <LifeAreaBadge lifeArea={lifeAreaLabelToId(h.lifeArea)} />
              </div>
            ))}
          </div>
          {onAddHabits && (
            <button onClick={onAddHabits} disabled={addingHabits} className="mt-2 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary font-label text-[10px] uppercase tracking-wider rounded-sm hover:bg-primary/10 transition-all disabled:opacity-50">
              {addingHabits ? 'Adding…' : `+ Add ${breakdown.suggestedHabits.length} habits`}
            </button>
          )}
        </AiSection>
      )}

      {/* Risks */}
      {breakdown.risks.length > 0 && (
        <AiSection icon="warning" label="RISKS & SOLUTIONS">
          <div className="space-y-2">
            {breakdown.risks.map((r, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-sm p-3 border border-outline-variant/10">
                <div className="font-body text-xs text-on-surface"><span className="text-tertiary font-bold">Risk:</span> {r.risk}</div>
                <div className="font-body text-xs text-on-surface-variant mt-0.5"><span className="text-primary font-bold">Fix:</span> {r.solution}</div>
              </div>
            ))}
          </div>
        </AiSection>
      )}
    </div>
  );
}
