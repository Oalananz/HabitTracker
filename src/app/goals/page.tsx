'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import AppShell from '@/components/layout/AppShell';
import dayjs from 'dayjs';

type GoalTab = 'all' | 'weekly' | 'dated' | 'open';

export default function GoalsPage() {
  const {
    goals, isGoalsLoading,
    fetchGoals, createGoal, toggleGoalComplete, incrementGoal, deleteGoal,
  } = useStore();

  const [activeTab, setActiveTab] = useState<GoalTab>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'weekly' | 'dated' | 'open'>('open');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newTargetCount, setNewTargetCount] = useState(1);

  useEffect(() => {
    fetchGoals(activeTab === 'all' ? undefined : activeTab);
  }, [fetchGoals, activeTab]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createGoal({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      goalType: newType,
      targetDate: newType === 'dated' ? newTargetDate : undefined,
      targetCount: newTargetCount,
    });
    setNewTitle('');
    setNewDesc('');
    setNewType('open');
    setNewTargetDate('');
    setNewTargetCount(1);
    setShowCreate(false);
  };

  const tabs: { key: GoalTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'weekly', label: 'Weekly', icon: 'date_range' },
    { key: 'dated', label: 'By Date', icon: 'event' },
    { key: 'open', label: 'Open', icon: 'all_inclusive' },
  ];

  const getStatusColor = (goal: typeof goals[0]) => {
    if (goal.completed) return 'text-primary';
    if (goal.goalType === 'dated' && goal.targetDate) {
      const diff = dayjs(goal.targetDate).diff(dayjs(), 'day');
      if (diff < 0) return 'text-error';
      if (diff <= 3) return 'text-tertiary';
    }
    return 'text-on-surface-variant';
  };

  const getStatusLabel = (goal: typeof goals[0]) => {
    if (goal.completed) return 'COMPLETED';
    if (goal.goalType === 'dated' && goal.targetDate) {
      const diff = dayjs(goal.targetDate).diff(dayjs(), 'day');
      if (diff < 0) return `OVERDUE ${Math.abs(diff)}D`;
      if (diff === 0) return 'DUE TODAY';
      return `${diff}D LEFT`;
    }
    if (goal.goalType === 'weekly') return 'THIS WEEK';
    return 'IN PROGRESS';
  };

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
              <span className="text-primary">&gt;</span> Goals
            </h1>
            <p className="font-body text-on-surface-variant">
              Set targets. Track progress. Achieve milestones.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
            id="create-goal-btn"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Goal
          </button>
        </header>

        {/* Create Goal Form */}
        {showCreate && (
          <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
            <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
              <span className="text-primary">&gt;</span> CREATE_NEW_GOAL
            </h3>

            {/* Goal Type Selector */}
            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                &gt; GOAL_TYPE
              </label>
              <div className="flex gap-2">
                {(['weekly', 'dated', 'open'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewType(type)}
                    className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-wider transition-colors ${
                      newType === type
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  &gt; TITLE
                </label>
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                  <span className="text-primary font-mono text-sm">&gt;</span>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                    placeholder="e.g. Read 3 books, Exercise 4x, Ship feature"
                    id="goal-title"
                  />
                </div>
              </div>

              {newType === 'dated' && (
                <div>
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                    &gt; TARGET_DATE
                  </label>
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                    <span className="text-primary font-mono text-sm">&gt;</span>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
                      id="goal-target-date"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                  &gt; TARGET_COUNT
                </label>
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
                  <span className="text-primary font-mono text-sm">&gt;</span>
                  <input
                    type="number"
                    min={1}
                    value={newTargetCount}
                    onChange={(e) => setNewTargetCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
                    id="goal-target-count"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
                &gt; DESCRIPTION (optional)
              </label>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
                  rows={2}
                  placeholder="Details about this goal..."
                  id="goal-desc"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                CREATE GOAL ↵
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-bright transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container-lowest rounded-sm p-1 border border-outline-variant/15">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-label text-xs uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        {isGoalsLoading ? (
          <div className="flex items-center gap-2 py-16 justify-center font-mono text-sm text-on-surface-variant">
            <span className="animate-blink text-primary">▊</span> Loading goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 block">flag</span>
            <p className="font-body text-on-surface-variant mb-2">No goals found.</p>
            <p className="font-mono text-xs text-outline">Click &quot;New Goal&quot; to set a target.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = goal.targetCount > 0
                ? Math.min((goal.currentCount / goal.targetCount) * 100, 100)
                : 0;

              return (
                <div
                  key={goal.id}
                  className={`bg-surface-container-low rounded-md border p-4 transition-all ${
                    goal.completed
                      ? 'border-primary/20 opacity-75'
                      : 'border-outline-variant/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Checkbox + Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleGoalComplete(goal.id)}
                        className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          goal.completed
                            ? 'bg-primary border-primary'
                            : 'border-outline-variant/40 hover:border-primary/60'
                        }`}
                      >
                        {goal.completed && (
                          <span className="material-symbols-outlined text-[14px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-headline text-sm font-bold ${goal.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="font-body text-xs text-on-surface-variant mt-1 truncate">{goal.description}</p>
                        )}

                        {/* Progress bar for quantifiable goals */}
                        {goal.targetCount > 1 && (
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                              <div
                                className="h-full bg-scanline-gradient rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-on-surface-variant whitespace-nowrap">
                              {goal.currentCount}/{goal.targetCount}
                            </span>
                            {!goal.completed && (
                              <button
                                onClick={() => incrementGoal(goal.id)}
                                className="w-6 h-6 rounded-sm bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Meta */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className={`font-label text-[10px] uppercase tracking-widest block ${getStatusColor(goal)}`}>
                          {getStatusLabel(goal)}
                        </span>
                        <span className="font-mono text-[10px] text-outline block mt-0.5">
                          {goal.goalType.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this goal?')) deleteGoal(goal.id); }}
                        className="text-outline hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
