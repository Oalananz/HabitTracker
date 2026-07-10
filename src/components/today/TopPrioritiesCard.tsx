'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/store/useToast';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import type { DailyPlannerOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId } from '@/lib/lifeAreas';
import { buildDailyPlannerInput } from '@/lib/ai/buildDailyPlannerInput';
import { pushTodayState, TODAY_STATE_HYDRATED } from '@/lib/todayState';

interface Priority {
  id: string;
  title: string;
  taskId?: string;
  lifeArea?: string | null;
  completed: boolean;
}

const MAX_PRIORITIES = 3;

function storageKey(date: string) {
  return `topPriorities:${date}`;
}

function load(date: string): Priority[] {
  try {
    const raw = localStorage.getItem(storageKey(date));
    return raw ? (JSON.parse(raw) as Priority[]) : [];
  } catch {
    return [];
  }
}

function save(date: string, priorities: Priority[]) {
  try { localStorage.setItem(storageKey(date), JSON.stringify(priorities)); } catch { /* ignore */ }
}

export default function TopPrioritiesCard({ date }: { date: string }) {
  const { tasks, completeTask, uncompleteTask, fetchGoals, prayerTimes } = useStore();
  const { addToast } = useToast();
  const [priorities, setPriorities] = useState<Priority[]>(() => load(date));
  const [showAdd, setShowAdd] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const idCounter = useRef(0);
  const nextId = (prefix: string) => `${prefix}_${date}_${idCounter.current++}`;
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const persist = (next: Priority[]) => { setPriorities(next); save(date, next); pushTodayState(date); };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || detail.date === date) setPriorities(load(date));
    };
    window.addEventListener('topPriorities:updated', handler);
    window.addEventListener(TODAY_STATE_HYDRATED, handler);
    return () => {
      window.removeEventListener('topPriorities:updated', handler);
      window.removeEventListener(TODAY_STATE_HYDRATED, handler);
    };
  }, [date]);

  // Close "more" menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoreMenu]);

  // Keep linked priorities' completed state in sync with their source task.
  useEffect(() => {
    if (priorities.length === 0) return;
    let changed = false;
    const next = priorities.map(p => {
      if (!p.taskId) return p;
      const task = tasks.find(t => t.id === p.taskId);
      if (task && task.completed !== p.completed) { changed = true; return { ...p, completed: task.completed }; }
      return p;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local priority list with the linked task's completion state
    if (changed) persist(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const addManual = () => {
    const title = manualTitle.trim();
    if (!title || priorities.length >= MAX_PRIORITIES) return;
    persist([...priorities, { id: nextId('pr'), title, completed: false }]);
    setManualTitle('');
    setShowAdd(false);
  };

  const addFromTask = (taskId: string) => {
    if (priorities.length >= MAX_PRIORITIES || priorities.some(p => p.taskId === taskId)) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    persist([...priorities, { id: nextId('pr'), title: task.title, taskId, lifeArea: task.lifeArea, completed: task.completed }]);
    setShowPicker(false);
    setShowMoreMenu(false);
  };

  const addPriorities = (top: DailyPlannerOutput['topPriorities']) => {
    const slots = MAX_PRIORITIES - priorities.length;
    if (slots <= 0) { addToast('You already have 3 priorities', 'info', 2000); return false; }
    const existingTitles = new Set(priorities.map(p => p.title.toLowerCase()));
    const additions: Priority[] = top
      .filter(p => p.title && !existingTitles.has(p.title.toLowerCase()))
      .slice(0, slots)
      .map((p) => ({
        id: nextId('pr_ai'),
        title: p.title,
        lifeArea: lifeAreaLabelToId(p.lifeArea) || undefined,
        completed: false,
      }));
    if (additions.length === 0) { addToast('No new priorities to add', 'info', 2000); return false; }
    persist([...priorities, ...additions]);
    return true;
  };

  const aiSuggest = async () => {
    if (aiLoading) return;
    setShowMoreMenu(false);
    if (priorities.length >= MAX_PRIORITIES) { addToast('You already have 3 priorities', 'info', 2000); return; }

    try {
      const raw = localStorage.getItem(`aiDailyPlan:${date}`);
      if (raw) {
        const plan = JSON.parse(raw) as DailyPlannerOutput;
        if (plan.topPriorities?.length) { addPriorities(plan.topPriorities); return; }
      }
    } catch { /* fall through to generate */ }

    setAiLoading(true);
    try {
      if (useStore.getState().goals.length === 0) { try { await fetchGoals(); } catch { /* ignore */ } }
      const s = useStore.getState();
      const input = buildDailyPlannerInput(date, s.tasks, s.habits, s.goals, prayerTimes);
      const res = await fetch('/api/ai/daily-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error || 'AI suggestion failed.', 'error', 3000); return; }
      const top = (data.plan?.topPriorities ?? []) as DailyPlannerOutput['topPriorities'];
      if (!top.length) { addToast('AI had no priorities to suggest', 'info', 2500); return; }
      addPriorities(top);
    } catch {
      addToast('Network error. Please try again.', 'error', 3000);
    } finally {
      setAiLoading(false);
    }
  };

  const toggle = async (p: Priority) => {
    if (p.taskId) {
      if (p.completed) await uncompleteTask(p.taskId); else await completeTask(p.taskId);
      return;
    }
    persist(priorities.map(x => x.id === p.id ? { ...x, completed: !x.completed } : x));
  };

  const remove = (id: string) => persist(priorities.filter(p => p.id !== id));

  const pickableTasks = tasks.filter(t => !priorities.some(p => p.taskId === t.id));
  const canAdd = priorities.length < MAX_PRIORITIES;

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Top 3 Priorities
        </h2>
        {priorities.length > 0 && (
          <span className="font-mono text-[10px] text-on-surface-variant">
            <span className="text-primary font-bold">{priorities.filter(p => p.completed).length}</span>/{priorities.length}
          </span>
        )}
      </div>

      {/* Priority list */}
      {priorities.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <span className="font-body text-sm text-on-surface-variant flex-1">
            No priorities selected for today.
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {priorities.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-all min-h-[44px] ${
                p.completed ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/15 bg-surface-container-lowest'
              }`}
            >
              <span className="font-mono text-[10px] text-on-surface-variant/50 flex-shrink-0 w-4 text-right">
                {idx + 1}.
              </span>
              <button
                onClick={() => toggle(p)}
                aria-label={`${p.completed ? 'Uncheck' : 'Check'} priority: ${p.title}`}
                className="flex-shrink-0"
              >
                <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center ${
                  p.completed ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40'
                }`}>
                  {p.completed && (
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  )}
                </span>
              </button>
              <span className={`font-body text-sm flex-1 min-w-0 truncate ${
                p.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
              }`}>
                {p.title}
              </span>
              <LifeAreaBadge lifeArea={p.lifeArea} />
              <button
                onClick={() => remove(p.id)}
                aria-label={`Remove priority: ${p.title}`}
                className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions row */}
      {canAdd && (
        <div className="flex items-center gap-2">
          {/* Primary: Add Priority */}
          <button
            onClick={() => { setShowAdd(v => !v); setShowPicker(false); setShowMoreMenu(false); }}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all"
          >
            + Add Priority
          </button>

          {/* Secondary overflow menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => { setShowMoreMenu(v => !v); setShowAdd(false); setShowPicker(false); }}
              aria-label="More options for priorities"
              className="px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">more_horiz</span>
            </button>
            {showMoreMenu && (
              <div className="absolute left-0 top-full mt-1 bg-surface-container-high border border-outline-variant/20 rounded-md shadow-lg z-20 min-w-[180px] py-1 animate-fade-in">
                <button
                  onClick={() => { setShowPicker(v => !v); setShowAdd(false); setShowMoreMenu(false); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 font-body text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">checklist</span>
                  Choose from tasks
                </button>
                <button
                  onClick={aiSuggest}
                  disabled={aiLoading}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 font-body text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[14px] ${aiLoading ? 'animate-spin' : ''}`}>
                    {aiLoading ? 'progress_activity' : 'auto_awesome'}
                  </span>
                  {aiLoading ? 'Suggesting…' : 'AI Suggest'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual add input */}
      {showAdd && canAdd && (
        <div className="flex gap-2 animate-fade-in">
          <input
            value={manualTitle}
            onChange={e => setManualTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addManual(); if (e.key === 'Escape') { setShowAdd(false); setManualTitle(''); } }}
            placeholder="Priority title…"
            autoFocus
            aria-label="New priority title"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={addManual}
            className="px-3 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90"
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setManualTitle(''); }}
            aria-label="Cancel"
            className="px-2 py-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Task picker */}
      {showPicker && (
        <div className="space-y-1 max-h-48 overflow-y-auto animate-fade-in border-t border-outline-variant/10 pt-2">
          <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Choose a task</div>
          {pickableTasks.length === 0 ? (
            <span className="font-body text-xs text-outline">No tasks to choose from.</span>
          ) : (
            pickableTasks.map(t => (
              <button
                key={t.id}
                onClick={() => addFromTask(t.id)}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm hover:bg-surface-container-lowest transition-colors min-h-[36px]"
              >
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">add</span>
                <span className="font-body text-xs text-on-surface truncate">{t.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
