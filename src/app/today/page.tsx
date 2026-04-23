'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import SectionHeader from '@/components/ui/SectionHeader';
import TaskItem from '@/components/ui/TaskItem';
import EmptyState from '@/components/ui/EmptyState';
import dayjs from 'dayjs';

export default function TodayPage() {
  const {
    tasks, taskSummary, isTasksLoading, fetchTasks,
    completeTask, uncompleteTask, createTask, deleteTask,
    selectedDate, setSelectedDate, metrics, fetchMetrics,
  } = useStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newPriority, setNewPriority] = useState('nominal');

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    setSelectedDate(today);

    void fetchTasks(today);

    const metricsTimer = setTimeout(() => {
      void fetchMetrics();
    }, 250);

    return () => clearTimeout(metricsTimer);
  }, [fetchTasks, setSelectedDate, fetchMetrics]);

  const handleToggle = async (id: string, completed: boolean) => {
    if (completed) {
      await uncompleteTask(id);
    } else {
      await completeTask(id);
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
      setNewTaskTitle('');
      setNewDesc('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTask(id); } catch (err) { console.error(err); }
  };

  const nonHabitTasks = tasks.filter(t => t.sourceType !== 'habit');

  const filteredTasks = nonHabitTasks.filter(t => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterCategory !== 'all' && (t.category?.toLowerCase() || '') !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const uniqueCategories = Array.from(new Set(nonHabitTasks.map(t => t.category || 'General')));

  const activePendingCount = nonHabitTasks.filter(t => !t.completed).length;
  const activeCompletedCount = nonHabitTasks.filter(t => t.completed).length;
  const activeTotalCount = nonHabitTasks.length;

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <header>
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            <span className="text-primary">&gt;</span> system/tasks --date=today
          </h1>
          <p className="font-body text-on-surface-variant">
            System initialized. Awaiting user input.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Area */}
          <div className="lg:col-span-2 space-y-6">
            <SectionHeader
              title="ACTIVE_ROUTINES"
              rightContent={`${activePendingCount} Pending / ${activeCompletedCount} Completed`}
            />

            {nonHabitTasks.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center bg-surface-container-lowest p-3 rounded-md border border-outline-variant/15 -mt-2">
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
              <div className="flex items-center gap-2 py-8 justify-center font-mono text-sm text-on-surface-variant">
                <span className="animate-blink text-primary">▊</span> Loading tasks...
              </div>
            ) : nonHabitTasks.length === 0 ? (
              <EmptyState title="No tasks for today" description="Create a manual task to get started." icon="task_alt" />
            ) : filteredTasks.length === 0 ? (
              <EmptyState title="No tasks match filter" description="Adjust your filters to see tasks." icon="filter_list_off" />
            ) : (
              <div className="flex flex-col gap-2">
                {pendingTasks.map(task => (
                  <TaskItem
                    key={task.id}
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
                ))}
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
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
                ))}
              </div>
            )}

            {/* Quick Add */}
            {!showAddForm ? (
              <div className="bg-surface-container-lowest rounded-md p-3 flex items-center gap-3 border border-outline-variant/15 focus-within:border-primary/50 transition-colors">
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
              <form onSubmit={handleQuickAdd} className="bg-surface-container-lowest rounded-md p-4 border border-outline-variant/15 space-y-3 animate-fade-in">
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

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Streak Card */}
            <div className="bg-surface-container-lowest p-6 rounded-md border border-outline-variant/15 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">&gt; CURRENT_STREAK</span>
              <div className="font-headline text-5xl font-black text-primary tracking-tighter mt-2" style={{ letterSpacing: '-0.02em' }}>
                {metrics?.currentStreak ?? 0}
              </div>
              <span className="font-body text-sm text-on-surface-variant mt-1 block">Days operational without failure.</span>
            </div>

            {/* Terminal Log */}
            <div className="flex-1 bg-surface-container-lowest rounded-md border border-outline-variant/15 flex flex-col min-h-[280px]">
              <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant/15 flex justify-between items-center rounded-t-md">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">&gt; logs/activity</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                  <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
                </div>
              </div>
              <div className="p-4 font-mono text-xs text-on-surface-variant flex flex-col gap-2 overflow-y-auto flex-1">
                <div className="flex gap-2">
                  <span className="text-outline">[{dayjs().format('HH:mm')}]</span>
                  <span className="text-secondary">SYSTEM:</span>
                  <span>Daily initialization complete.</span>
                </div>
                {nonHabitTasks.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-outline">[{dayjs().format('HH:mm')}]</span>
                    <span className="text-primary">TASKS:</span>
                    <span>{activeTotalCount} loaded, {activeCompletedCount} complete.</span>
                  </div>
                )}
                {completedTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex gap-2">
                    <span className="text-outline">[{dayjs(t.completedAt).format('HH:mm')}]</span>
                    <span className="text-surface-tint">DONE:</span>
                    <span>&apos;{t.title}&apos; marked complete.</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-4 opacity-50">
                  <span className="text-primary animate-blink">_</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
