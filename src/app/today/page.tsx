'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import SectionHeader from '@/components/ui/SectionHeader';
import PageHeader from '@/components/ui/PageHeader';
import TaskItem from '@/components/ui/TaskItem';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonPulse from '@/components/ui/SkeletonPulse';
import DailyProgressBar from '@/components/today/DailyProgressBar';
import TodaySummaryCards from '@/components/today/TodaySummaryCards';
import TopPrioritiesCard from '@/components/today/TopPrioritiesCard';
import WorshipCard from '@/components/today/WorshipCard';
import FocusTimeCard from '@/components/today/FocusTimeCard';
import RecoveryTodayCard from '@/components/today/RecoveryTodayCard';
import SleepCard from '@/components/today/SleepCard';
import EveningReviewCard from '@/components/today/EveningReviewCard';
import TodaySidePanel from '@/components/today/TodaySidePanel';
import HabitsSection from '@/components/today/HabitsSection';
import OnboardingPrompt from '@/components/today/OnboardingPrompt';
import AiDailyPlanner from '@/components/ai/AiDailyPlanner';
import AchievementToast from '@/components/achievements/AchievementToast';
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
  } = useStore();

  const { addToast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState('nominal');
  const [newLifeArea, setNewLifeArea] = useState<LifeAreaId | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    setSelectedDate(today);
    void fetchDayRecord(today);
    void fetchUserStats();
    void fetchAchievements();
    void fetchJourneys();
    void fetchFailures();
    void fetchPrayerTimes(today);
    void fetchHabits();
    // Auto-add today's habits: ensure habit-due tasks for today exist, then
    // load the task list (falls back to a plain fetch if generation fails).
    void generateTodayTasks(today).catch(() => fetchTasks(today));
    // Sync Today's saved extras (priorities, evening review, AI plan) from the
    // DB, then tell the cards to re-read their now-hydrated localStorage.
    void pullTodayState(today).then(changed => {
      if (changed) window.dispatchEvent(new CustomEvent(TODAY_STATE_HYDRATED, { detail: { date: today } }));
    });
    addActivityLog('SYSTEM', 'Daily initialization complete.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the day-record tasks bonus in sync: all of today's tasks/habits
  // complete credits the score's TASKS_DONE point.
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

  // Today's Tasks shows manual tasks/plans only — habit-generated tasks live
  // in the "Today's Habits" section, not here.
  const manualTasks = tasks.filter(t => t.sourceType !== 'habit');

  const filteredTasks = manualTasks.filter(t => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterCategory !== 'all' && (t.category?.toLowerCase() || '') !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  const uniqueCategories = Array.from(new Set(manualTasks.map(t => t.category || 'General')));
  const activePendingCount = manualTasks.filter(t => !t.completed).length;
  const activeCompletedCount = manualTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Achievement Toast (global) */}
      <AchievementToast />

      {/* Life Areas onboarding nudge (dismissible, non-blocking) */}
      <OnboardingPrompt />

      {/* Header */}
      <PageHeader title="system/today" description="Your daily command center." />

      {/* Daily Summary Cards */}
      <TodaySummaryCards dayRecord={dayRecord} date={today} />

      {/* Daily Progress */}
      {dayRecord && <DailyProgressBar score={dayRecord.dailyScore} />}

      {/* AI Daily Plan */}
      <div>
        <SectionHeader title="AI Daily Plan" />
        <AiDailyPlanner date={today} />
      </div>

      {/* Top 3 Priorities */}
      <TopPrioritiesCard date={today} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Worship, Focus, Tasks, Recovery, Sleep, Review ─── */}
        <div className="lg:col-span-2 space-y-6">
          {isDayRecordLoading && !dayRecord ? (
            <div className="space-y-6">
              <SkeletonPulse variant="card" className="h-48" />
              <SkeletonPulse variant="card" className="h-32" />
            </div>
          ) : dayRecord ? (
            <>
              <WorshipCard dayRecord={dayRecord} date={today} />
              <FocusTimeCard dayRecord={dayRecord} date={today} />
            </>
          ) : (
            <div className="bg-surface-container-low rounded-md p-6 border border-outline-variant/15">
              <span className="font-mono text-sm text-outline">Could not load today&apos;s record. Try refreshing.</span>
            </div>
          )}

          {/* TASK LIST */}
          <div>
            <SectionHeader
              title="Today's Tasks"
              rightContent={`${activePendingCount} Pending / ${activeCompletedCount} Completed`}
            />

            {manualTasks.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center bg-surface-container-lowest p-3 rounded-md border border-outline-variant/15 -mt-2 mb-4">
                <span className="text-[10px] font-label tracking-widest text-on-surface-variant uppercase">Filter</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'completed')}
                  className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-label text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-label text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
                >
                  <option value="all">All categories</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {isTasksLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface-container-low rounded-md p-4 flex gap-4 items-start">
                    <div className="w-5 h-5 animate-shimmer rounded-[2px] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-shimmer rounded-md" />
                      <div className="h-3 w-1/2 animate-shimmer rounded-md" />
                    </div>
                    <div className="h-5 w-16 animate-shimmer rounded-[2px] flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : manualTasks.length === 0 ? (
              <EmptyState title="No tasks planned for today" description="Add one task or generate a plan." icon="task_alt" />
            ) : filteredTasks.length === 0 ? (
              <EmptyState title="No tasks match filter" description="Adjust your filters to see tasks." icon="filter_list_off" />
            ) : (
              <div className="flex flex-col gap-2">
                {pendingTasks.map((task, i) => (
                  <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
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
                {completedTasks.map((task, i) => (
                  <div key={task.id} className="animate-slide-up" style={{ animationDelay: `${(pendingTasks.length + i) * 50}ms` }}>
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

            {/* Quick Add */}
            {!showAddForm ? (
              <div className="mt-4 bg-surface-container-lowest rounded-md p-3 flex items-center gap-3 border border-outline-variant/15 focus-within:border-primary/50 transition-colors">
                <span className="text-primary font-headline text-lg">&gt;</span>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                      if (e.shiftKey) { setShowAddForm(true); }
                      else { handleQuickAdd(e); }
                    }
                  }}
                  className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                  placeholder="Add task, habit, goal, or note... (Enter to add, Shift+Enter for details)"
                  id="quick-add-task"
                />
                <button
                  onClick={() => { if (newTaskTitle.trim()) setShowAddForm(true); }}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickAdd} className="mt-4 bg-surface-container-lowest rounded-md p-4 border border-outline-variant/15 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-headline">&gt;</span>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-transparent text-on-surface font-headline font-semibold border-none p-0 focus:ring-0"
                    placeholder="Task title"
                    autoFocus
                  />
                </div>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-surface-container-low rounded-sm text-on-surface text-sm font-body placeholder:text-outline border border-outline-variant/15 p-2 focus:ring-0 focus:border-primary/50 resize-none"
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex gap-2 flex-wrap">
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-label text-on-surface-variant">
                    {['General', 'Health', 'Work', 'Learning', 'Personal', 'Admin'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-label text-on-surface-variant">
                    <option value="low">Low</option>
                    <option value="nominal">Nominal</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select value={newLifeArea} onChange={(e) => setNewLifeArea(e.target.value as LifeAreaId | '')} className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-label text-on-surface-variant">
                    <option value="">No life area</option>
                    {LIFE_AREAS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowAddForm(false); setNewTaskTitle(''); }} className="px-3 py-1.5 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90">Add Task</button>
                </div>
              </form>
            )}
          </div>

          {dayRecord && <RecoveryTodayCard dayRecord={dayRecord} date={today} />}
          {dayRecord && <SleepCard dayRecord={dayRecord} date={today} />}

          <EveningReviewCard date={today} />
        </div>

        {/* ── Right: compact side panel ───────────────────────────── */}
        <TodaySidePanel dayRecord={dayRecord} date={today} />
      </div>

      {/* ── Habits due today (collapsible, last on page) ─────────── */}
      <HabitsSection date={today} />
    </div>
  );
}
