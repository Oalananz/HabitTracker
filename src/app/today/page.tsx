'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import SectionHeader from '@/components/ui/SectionHeader';
import TaskItem from '@/components/ui/TaskItem';
import EmptyState from '@/components/ui/EmptyState';
import DayStatusBanner from '@/components/today/DayStatusBanner';
import DisciplineCard from '@/components/today/DisciplineCard';
import ScoreDisplay from '@/components/today/ScoreDisplay';
import ActivityLog from '@/components/today/ActivityLog';
import AchievementToast from '@/components/achievements/AchievementToast';
import { useToast } from '@/store/useToast';
import dayjs from 'dayjs';

export default function TodayPage() {
  const {
    tasks, isTasksLoading, fetchTasks,
    completeTask, uncompleteTask, createTask, deleteTask,
    selectedDate, setSelectedDate,
    dayRecord, fetchDayRecord, isDayRecordLoading,
    userStats, fetchUserStats,
    fetchAchievements,
    activityLog, addActivityLog,
    journeys, fetchJourneys,
  } = useStore();

  const { addToast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState('nominal');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    setSelectedDate(today);
    void fetchTasks(today);
    void fetchDayRecord(today);
    void fetchUserStats();
    void fetchAchievements();
    void fetchJourneys();
    addActivityLog('SYSTEM', 'Daily initialization complete.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      });
      addActivityLog('TASKS', `Task '${newTaskTitle.trim()}' created.`);
      setNewTaskTitle('');
      setNewDesc('');
      setShowAddForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      addToast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      addToast('Task deleted', 'info', 2000);
    } catch {
      addToast('Failed to delete task', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterCategory !== 'all' && (t.category?.toLowerCase() || '') !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  const uniqueCategories = Array.from(new Set(tasks.map(t => t.category || 'General')));
  const activePendingCount = tasks.filter(t => !t.completed).length;
  const activeCompletedCount = tasks.filter(t => t.completed).length;
  const activeTotalCount = tasks.length;

  // Build log from activityLog + task completions
  const logEntries = activityLog.slice().reverse().slice(0, 50);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Achievement Toast (global) */}
      <AchievementToast />

      {/* Header */}
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> system/tasks --date=today
        </h1>
        <p className="font-body text-on-surface-variant">
          System initialized. Awaiting user input.
        </p>
      </header>

      {/* Day Status Banner */}
      {dayRecord && (
        <DayStatusBanner score={dayRecord.dailyScore} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Tasks + Discipline ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* DISCIPLINE CARD */}
          <div>
            <SectionHeader title="DISCIPLINE_CARD" />
            {isDayRecordLoading && !dayRecord ? (
              <div className="bg-surface-container-low rounded-md p-8 flex items-center justify-center">
                <span className="animate-blink text-primary font-mono text-sm">▊</span>
                <span className="font-mono text-sm text-on-surface-variant ml-2">Loading day record...</span>
              </div>
            ) : dayRecord ? (
              <DisciplineCard
                dayRecord={dayRecord}
                date={today}
                journeys={journeys.map(j => ({ id: j.id, title: j.title, startTime: j.startTime }))}
              />
            ) : (
              <div className="bg-surface-container-low rounded-md p-6 border border-outline-variant/15">
                <span className="font-mono text-sm text-outline">Discipline card offline. Reconnect to sync.</span>
              </div>
            )}
          </div>

          {/* TASK LIST */}
          <div>
            <SectionHeader
              title="ACTIVE_ROUTINES"
              rightContent={`${activePendingCount} Pending / ${activeCompletedCount} Completed`}
            />

            {tasks.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center bg-surface-container-lowest p-3 rounded-md border border-outline-variant/15 -mt-2 mb-4">
                <span className="text-[10px] font-label tracking-widest text-on-surface-variant uppercase">&gt; FILTER</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'completed')}
                  className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-label text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors uppercase cursor-pointer"
                >
                  <option value="all">ALL_STATUS</option>
                  <option value="pending">PENDING</option>
                  <option value="completed">COMPLETED</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-label text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors uppercase cursor-pointer"
                >
                  <option value="all">ALL_CATEGORIES</option>
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
            ) : tasks.length === 0 ? (
              <EmptyState title="No tasks for today" description="Create a manual task to get started." icon="task_alt" />
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
                      onToggle={handleToggle}
                      onDelete={handleDelete}
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
                      onToggle={handleToggle}
                      onDelete={handleDelete}
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
                  placeholder="Add new task... (Enter to add, Shift+Enter for details)"
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
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowAddForm(false); setNewTaskTitle(''); }} className="px-3 py-1.5 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90">Add Task</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Right: Score + Log ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Score Display */}
          <ScoreDisplay dayRecord={dayRecord} userStats={userStats} />

          {/* Stats quick card */}
          <div className="bg-surface-container-lowest p-4 rounded-md border border-outline-variant/15 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; TASK_STATUS</span>
            <div className="flex items-end gap-2 mt-2">
              <span className="font-headline text-4xl font-black text-primary tracking-tighter">{activeCompletedCount}</span>
              <span className="text-on-surface-variant font-headline text-xl mb-0.5">/ {activeTotalCount}</span>
            </div>
            <span className="font-body text-sm text-on-surface-variant block mt-1">Tasks completed today.</span>
          </div>

          {/* Activity Log */}
          <ActivityLog entries={logEntries} />
        </div>
      </div>
    </div>
  );
}
