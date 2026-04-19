'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import AppShell from '@/components/layout/AppShell';
import HabitForm from '@/components/habits/HabitForm';

const REPEAT_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
};

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HabitsPage() {
  const {
    habits, isHabitsLoading, fetchHabits,
    createHabit, updateHabit, toggleHabit, deleteHabit,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleCreate = async (data: { title: string; description?: string; category?: string; priority?: string; repeatRule: { type: string; days?: number[] } }) => {
    await createHabit(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: { title: string; description?: string; category?: string; priority?: string; repeatRule: { type: string; days?: number[] } }) => {
    if (editingId) {
      await updateHabit(editingId, data);
      setEditingId(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleHabit(id, isActive);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this habit and all future task generation?')) {
      await deleteHabit(id);
    }
  };

  const activeHabits = habits.filter(h => h.isActive);
  const inactiveHabits = habits.filter(h => !h.isActive);

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        <header>
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            <span className="text-primary">&gt;</span> system/config --habits
          </h1>
          <p className="font-body text-on-surface-variant">
            Manage recurring behavioral protocols and track consistency streaks across system sectors.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <h2 className="font-headline text-lg font-semibold text-on-surface uppercase tracking-wide">
                  ACTIVE PROTOCOLS
                </h2>
              </div>
              <span className="font-label text-xs text-on-surface-variant uppercase">COUNT: {String(activeHabits.length).padStart(2, '0')}</span>
            </div>

            {isHabitsLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center font-mono text-sm text-on-surface-variant">
                <span className="animate-blink text-primary">▊</span> Loading protocols...
              </div>
            ) : activeHabits.length === 0 ? (
              <div className="text-center py-12">
                <span className="font-mono text-sm text-on-surface-variant">No active protocols. Define one to begin.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeHabits.map((habit) => {
                  const rule = habit.repeatRule as { type: string; days?: number[] };
                  const streakCount = habit._count?.tasks || 0;
                  const ribbonColor = habit.priority === 'critical' ? 'bg-tertiary' : habit.priority === 'low' ? 'bg-on-surface-variant' : 'bg-primary';

                  return (
                    <div key={habit.id} className="group relative bg-surface-container-low rounded-md p-4 hover:bg-surface-container-high transition-colors">
                      <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${ribbonColor} rounded-l-md`} />
                      <div className="flex justify-between items-start ml-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                              {habit.category?.includes('Health') ? 'fitness_center' : habit.category?.includes('Work') ? 'code' : habit.category?.includes('Learn') ? 'menu_book' : 'cached'}
                            </span>
                            <h3 className="font-headline font-semibold text-on-surface">{habit.title}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="px-2 py-0.5 bg-surface-container-lowest font-label text-on-surface-variant rounded-[2px] border border-outline-variant/15 uppercase text-[10px]">
                              {rule.type === 'custom' && rule.days
                                ? `Custom (${rule.days.map(d => DAYS_SHORT[d]).join(',')})`
                                : REPEAT_LABELS[rule.type] || rule.type}
                            </span>
                            <span className="flex items-center gap-1 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[14px]">category</span>
                              {habit.category}
                            </span>
                            <span className="flex items-center gap-1 text-primary font-label">
                              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                              STREAK: {streakCount}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(habit.id)}
                            className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggle(habit.id, habit.isActive)}
                            className={`toggle-switch ${habit.isActive ? 'active' : ''}`}
                            id={`habit-toggle-${habit.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inactive habits */}
            {inactiveHabits.length > 0 && (
              <div className="space-y-3 mt-8">
                <h3 className="font-headline text-sm font-semibold text-on-surface-variant uppercase tracking-wide">
                  <span className="text-outline">&gt;</span> PAUSED PROTOCOLS
                </h3>
                {inactiveHabits.map((habit) => (
                  <div key={habit.id} className="group relative bg-surface-container-low/50 rounded-md p-4 opacity-50 hover:opacity-80 transition-opacity">
                    <div className="flex justify-between items-center ml-2">
                      <div>
                        <h3 className="font-headline font-semibold text-on-surface-variant">{habit.title}</h3>
                        <span className="flex items-center gap-1 text-xs text-outline mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Paused
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(habit.id, habit.isActive)} className="toggle-switch" />
                        <button onClick={() => handleDelete(habit.id)} className="text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Panel */}
          <div>
            {showForm || editingId ? (
              <HabitForm
                onSubmit={editingId ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditingId(null); }}
                initialData={editingId ? {
                  title: habits.find(h => h.id === editingId)?.title || '',
                  description: habits.find(h => h.id === editingId)?.description || '',
                  category: habits.find(h => h.id === editingId)?.category || 'General',
                  priority: habits.find(h => h.id === editingId)?.priority || 'nominal',
                  repeatRule: habits.find(h => h.id === editingId)?.repeatRule || { type: 'daily' },
                } : undefined}
              />
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-surface-container-lowest border border-outline-variant/15 border-dashed rounded-md p-8 text-center hover:border-primary/50 transition-colors group"
                id="add-habit-btn"
              >
                <span className="material-symbols-outlined text-[32px] text-outline-variant group-hover:text-primary transition-colors mb-2 block">add_circle</span>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">
                  Define New Protocol
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
