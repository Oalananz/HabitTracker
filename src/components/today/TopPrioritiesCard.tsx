'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import type { DailyPlannerOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId } from '@/lib/lifeAreas';

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
  const { tasks, completeTask, uncompleteTask } = useStore();
  const [priorities, setPriorities] = useState<Priority[]>(() => load(date));
  const [showAdd, setShowAdd] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const idCounter = useRef(0);
  const nextId = (prefix: string) => `${prefix}_${date}_${idCounter.current++}`;

  const persist = (next: Priority[]) => { setPriorities(next); save(date, next); };

  // Reload when another card (e.g. the AI daily plan) sets priorities for today.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || detail.date === date) setPriorities(load(date));
    };
    window.addEventListener('topPriorities:updated', handler);
    return () => window.removeEventListener('topPriorities:updated', handler);
  }, [date]);

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
  };

  const addFromAiPlan = () => {
    try {
      const raw = localStorage.getItem(`aiDailyPlan:${date}`);
      if (!raw) return;
      const plan = JSON.parse(raw) as DailyPlannerOutput;
      const slots = MAX_PRIORITIES - priorities.length;
      if (slots <= 0 || !plan.topPriorities?.length) return;
      const additions: Priority[] = plan.topPriorities.slice(0, slots).map((p) => ({
        id: nextId('pr_ai'),
        title: p.title,
        lifeArea: lifeAreaLabelToId(p.lifeArea) || undefined,
        completed: false,
      }));
      persist([...priorities, ...additions]);
    } catch { /* ignore */ }
  };

  const toggle = async (p: Priority) => {
    if (p.taskId) {
      if (p.completed) await uncompleteTask(p.taskId); else await completeTask(p.taskId);
      return; // task change syncs back via effect above
    }
    persist(priorities.map(x => x.id === p.id ? { ...x, completed: !x.completed } : x));
  };

  const remove = (id: string) => persist(priorities.filter(p => p.id !== id));

  const pickableTasks = tasks.filter(t => !priorities.some(p => p.taskId === t.id));

  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-base font-bold text-on-surface">
          <span className="text-primary">&gt;</span> Top 3 Priorities
        </h3>
        {priorities.length > 0 && (
          <span className="font-mono text-[10px] text-on-surface-variant">
            <span className="text-primary font-bold">{priorities.filter(p => p.completed).length}</span>/{priorities.length}
          </span>
        )}
      </div>

      {priorities.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 py-5">
          <span className="font-body text-sm text-on-surface-variant">No priorities selected yet.</span>
          <span className="font-body text-xs text-outline">Choose from your tasks or let AI suggest your top 3.</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {priorities.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm border transition-all ${
                p.completed ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/15 bg-surface-container-lowest'
              }`}
            >
              <button onClick={() => toggle(p)} className="flex-shrink-0">
                <span className={`w-4 h-4 rounded-[2px] border flex items-center justify-center ${
                  p.completed ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant/40'
                }`}>
                  {p.completed && <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                </span>
              </button>
              <span className={`font-body text-sm flex-1 ${p.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{p.title}</span>
              <LifeAreaBadge lifeArea={p.lifeArea} />
              <button onClick={() => remove(p.id)} className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {priorities.length < MAX_PRIORITIES && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setShowAdd(v => !v); setShowPicker(false); }}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
          >
            Add Priority
          </button>
          <button
            onClick={() => { setShowPicker(v => !v); setShowAdd(false); }}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 rounded-sm font-label text-xs text-on-surface-variant hover:text-primary transition-all"
          >
            Choose From Tasks
          </button>
          <button
            onClick={addFromAiPlan}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all"
          >
            AI Suggest
          </button>
        </div>
      )}

      {showAdd && (
        <div className="flex gap-2 animate-fade-in">
          <input
            value={manualTitle}
            onChange={e => setManualTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addManual(); }}
            placeholder="Priority title…"
            autoFocus
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-1.5 text-xs font-body text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50"
          />
          <button onClick={addManual} className="px-3 py-1.5 bg-primary text-on-primary font-label text-xs rounded-sm hover:opacity-90">Add</button>
        </div>
      )}

      {showPicker && (
        <div className="space-y-1 max-h-48 overflow-y-auto animate-fade-in border-t border-outline-variant/10 pt-2">
          {pickableTasks.length === 0 ? (
            <span className="font-body text-xs text-outline">No more tasks to choose from.</span>
          ) : (
            pickableTasks.map(t => (
              <button
                key={t.id}
                onClick={() => addFromTask(t.id)}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm hover:bg-surface-container-lowest transition-colors"
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
