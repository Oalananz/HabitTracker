'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/ui/TaskItem';

import Button from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import DailyProgressBar from '@/components/today/DailyProgressBar';
import TopPrioritiesCard from '@/components/today/TopPrioritiesCard';
import HabitsSection from '@/components/today/HabitsSection';
import EveningReviewCard from '@/components/today/EveningReviewCard';
import DailyTrackingGrid from '@/components/today/DailyTrackingGrid';
import NextActionCard from '@/components/today/NextActionCard';
import AchievementToast from '@/components/achievements/AchievementToast';
import OnboardingPrompt from '@/components/today/OnboardingPrompt';
import { useToast } from '@/store/useToast';
import { pullTodayState, TODAY_STATE_HYDRATED } from '@/lib/todayState';
import dayjs from 'dayjs';
import { LIFE_AREAS, type LifeAreaId } from '@/lib/lifeAreas';

export default function TodayPage() {
  const {
    tasks, isTasksLoading, fetchTasks,
    completeTask, uncompleteTask, createTask, deleteTask, updateTask,
    selectedDate, setSelectedDate,
    dayRecord, fetchDayRecord, isDayRecordLoading, updateDayRecord,
    fetchUserStats,
    fetchAchievements,
    addActivityLog,
    fetchJourneys, fetchFailures,
    fetchPrayerTimes,
    fetchHabits, generateTodayTasks,
    habits,
  } = useStore();

  const { addToast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState('nominal');
  const [newLifeArea, setNewLifeArea] = useState<LifeAreaId | ''>('');
  const [showCompleted, setShowCompleted] = useState(false);

  const today = dayjs().format('YYYY-MM-DD');
  const dateLabel = dayjs().format('dddd, MMMM D');

  useEffect(() => {
    setSelectedDate(today);
    void fetchDayRecord(today);
    void fetchUserStats();
    void fetchAchievements();
    void fetchJourneys();
    void fetchFailures();
    void fetchPrayerTimes(today);
    void fetchHabits();
    void generateTodayTasks(today).catch(() => fetchTasks(today));
    void pullTodayState(today).then(changed => {
      if (changed) window.dispatchEvent(new CustomEvent(TODAY_STATE_HYDRATED, { detail: { date: today } }));
    });
    addActivityLog('SYSTEM', 'Daily initialization complete.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the day-record tasks bonus in sync
  useEffect(() => {
    if (!dayRecord) return;
    const allTasksDone = tasks.length > 0 && tasks.every(t => t.completed);
    if (dayRecord.tasksDone !== allTasksDone) {
      void updateDayRecord(today, { tasksDone: allTasksDone });
    }
  }, [tasks, dayRecord, updateDayRecord, today]);

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      if (completed) {
        await uncompleteTask(id);
      } else {
        await completeTask(id);
        const task = tasks.find(t => t.id === id);
        if (task) addActivityLog('DONE', `'${task.title}' marked complete.`);
        addToast('Task completed!', 'success', 2000);
      }
    } catch {
      addToast('Failed to update task', 'error');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory,
        priority: newPriority,
        date: selectedDate,
        lifeArea: newLifeArea || null,
      });
      addActivityLog('TASKS', `Task '${newTaskTitle.trim()}' created.`);
      setNewTaskTitle('');
      setNewDesc('');
      setNewLifeArea('');
      setShowAddForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      addToast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      addActivityLog('TASKS', 'Task deleted.');
      addToast('Task deleted', 'info', 2000);
    } catch {
      addToast('Failed to delete task', 'error');
    }
  };

  const handleEdit = async (
    id: string,
    data: { title: string; description?: string; category?: string; priority?: string }
  ) => {
    try {
      await updateTask(id, data);
      addActivityLog('TASKS', `Task '${data.title}' updated.`);
      addToast('Task updated', 'success', 2000);
    } catch {
      addToast('Failed to update task', 'error');
    }
  };

  // Manual (non-habit) tasks only
  const manualTasks = tasks.filter(t => t.sourceType !== 'habit');
  const pendingTasks = manualTasks.filter(t => !t.completed);
  const completedTasks = manualTasks.filter(t => t.completed);

  // Unified completion count across tasks + habits
  const activeHabits = habits.filter(h => h.isActive);
  const dueHabits = activeHabits.filter(h => tasks.some(t => t.habitId === h.id && t.date === today));
  const doneHabits = dueHabits.filter(h => tasks.find(t => t.habitId === h.id && t.date === today)?.completed);
  const prayersDone = dayRecord
    ? (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).filter(k => dayRecord[k]).length
    : 0;

  // Total completable items and done count for unified progress
  const totalItems = manualTasks.length + dueHabits.length + 5; // 5 prayers
  const completedItemsCount = completedTasks.length + doneHabits.length + prayersDone;

  return (
    <div className="space-y-5 animate-page-enter">
      {/* Global toasts */}
      <AchievementToast />

      {/* Onboarding nudge */}
      <OnboardingPrompt />

      {/* ── TODAY HEADER ─────────────────────────────────────────────── */}
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/50 mb-1">
              system/today
            </p>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
              Today
            </h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">{dateLabel}</p>
          </div>
          {/* Score badge — single occurrence */}
          {dayRecord && (
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Daily Score</span>
              <span className={`font-headline text-3xl font-black tracking-tight ${
                dayRecord.dailyScore >= 8 ? 'text-primary' : dayRecord.dailyScore >= 4 ? 'text-tertiary' : 'text-on-surface-variant'
              }`}>
                {dayRecord.dailyScore}
                <span className="text-base text-on-surface-variant/40 font-normal">/10</span>
              </span>
            </div>
          )}
        </div>

        {/* Compact progress bar */}
        <div className="mt-4">
          {isDayRecordLoading && !dayRecord ? (
            <div className="h-8 bg-surface-container-lowest rounded-sm animate-shimmer" />
          ) : dayRecord ? (
            <DailyProgressBar
              score={dayRecord.dailyScore}
              maxScore={10}
              completedItems={completedItemsCount}
              totalItems={totalItems}
            />
          ) : null}
        </div>
      </header>

      {/* ── NEXT ACTION ──────────────────────────────────────────────── */}
      <NextActionCard dayRecord={dayRecord} date={today} />

      {/* ── TOP 3 PRIORITIES ─────────────────────────────────────────── */}
      <TopPrioritiesCard date={today} />

      {/* ── HABITS DUE TODAY ─────────────────────────────────────────── */}
      <HabitsSection date={today} />

      {/* ── TODAY'S TASKS ────────────────────────────────────────────── */}
      <section aria-labelledby="tasks-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="tasks-heading" className="font-headline text-base font-bold text-on-surface">
            <span className="text-primary">&gt;</span> Today&apos;s Tasks
          </h2>
          <span className="font-mono text-[10px] text-on-surface-variant">
            <span className="text-primary font-bold">{completedTasks.length}</span>/{manualTasks.length}
          </span>
        </div>

        {/* Loading state */}
        {isTasksLoading && manualTasks.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low rounded-md p-4 flex gap-4 items-start">
                <div className="w-5 h-5 animate-shimmer rounded-[2px] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-shimmer rounded-md" />
                  <div className="h-3 w-1/2 animate-shimmer rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : manualTasks.length === 0 ? (
          /* Compact empty state */
          <div className="bg-surface-container-low border border-outline-variant/15 rounded-md px-4 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm text-on-surface-variant">No tasks planned for today.</p>
              <p className="font-body text-xs text-outline mt-0.5">Add a task or generate a plan.</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-sm font-label text-xs text-primary transition-all"
            >
              + Add Task
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Pending tasks */}
            {pendingTasks.map((task, i) => (
              <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <TaskItem
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  category={task.category}
                  priority={task.priority}
                  completed={task.completed}
                  sourceType={task.sourceType}
                  lifeArea={task.lifeArea}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </div>
            ))}

            {/* Completed tasks — collapsed */}
            {completedTasks.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  aria-expanded={showCompleted}
                  aria-controls="completed-tasks"
                  className="flex items-center gap-2 w-full text-left py-1.5 px-1 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className={`material-symbols-outlined text-[16px] transition-transform ${showCompleted ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                  <span className="font-label text-xs">
                    {completedTasks.length} completed
                  </span>
                </button>
                {showCompleted && (
                  <div id="completed-tasks" className="flex flex-col gap-2 animate-fade-in">
                    {completedTasks.map((task, i) => (
                      <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                        <TaskItem
                          id={task.id}
                          title={task.title}
                          description={task.description}
                          category={task.category}
                          priority={task.priority}
                          completed={task.completed}
                          sourceType={task.sourceType}
                          lifeArea={task.lifeArea}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Add — always visible */}
        {!showAddForm ? (
          <div className="mt-3 bg-surface-container-lowest rounded-md p-3 flex items-center gap-3 border border-outline-variant/15 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-headline text-lg" aria-hidden="true">&gt;</span>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  if (e.shiftKey) { setShowAddForm(true); }
                  else { void handleQuickAdd(e); }
                }
              }}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Add task… (Enter to add, Shift+Enter for details)"
              id="quick-add-task"
              aria-label="Quick add task"
            />
            <button
              onClick={() => { if (newTaskTitle.trim()) setShowAddForm(true); }}
              aria-label="Expand task form"
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleQuickAdd}
            className="mt-3 bg-surface-container-lowest rounded-md p-4 border border-outline-variant/15 space-y-3 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="text-primary font-headline" aria-hidden="true">&gt;</span>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-transparent text-on-surface font-headline font-semibold border-none p-0 focus:ring-0"
                placeholder="Task title"
                autoFocus
                aria-label="Task title"
              />
            </div>
            <Textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              aria-label="Task description"
            />
            <div className="flex gap-2 flex-wrap">
              <Select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-auto py-1.5 text-xs"
                aria-label="Category"
              >
                {['General', 'Health', 'Work', 'Learning', 'Personal', 'Admin'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-auto py-1.5 text-xs"
                aria-label="Priority"
              >
                <option value="low">Low</option>
                <option value="nominal">Nominal</option>
                <option value="critical">Critical</option>
              </Select>
              <Select
                value={newLifeArea}
                onChange={(e) => setNewLifeArea(e.target.value as LifeAreaId | '')}
                className="w-auto py-1.5 text-xs"
                aria-label="Life area"
              >
                <option value="">No life area</option>
                {LIFE_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowAddForm(false); setNewTaskTitle(''); }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">Add task</Button>
            </div>
          </form>
        )}
      </section>

      {/* ── DAILY TRACKING ───────────────────────────────────────────── */}
      {isDayRecordLoading && !dayRecord ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-shimmer rounded-md" />
          ))}
        </div>
      ) : dayRecord ? (
        <DailyTrackingGrid dayRecord={dayRecord} date={today} />
      ) : (
        <div className="bg-surface-container-low rounded-md p-6 border border-outline-variant/15">
          <span className="font-mono text-sm text-outline">
            Could not load today&apos;s record. Try refreshing.
          </span>
        </div>
      )}

      {/* ── EVENING REVIEW ───────────────────────────────────────────── */}
      <EveningReviewCard date={today} />
    </div>
  );
}
