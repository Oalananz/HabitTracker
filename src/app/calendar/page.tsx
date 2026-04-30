'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import TaskItem from '@/components/ui/TaskItem';
import dayjs from 'dayjs';

type GroupByOption = 'none' | 'category' | 'priority' | 'source' | 'status';

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  completed: boolean;
  sourceType: string;
}

function groupTasks(tasks: Task[], groupBy: GroupByOption): { label: string; tasks: Task[] }[] {
  if (groupBy === 'none') return [{ label: '', tasks }];

  const groups: Record<string, Task[]> = {};

  for (const task of tasks) {
    let key = '';
    if (groupBy === 'category') key = task.category ?? 'Uncategorized';
    else if (groupBy === 'priority') key = task.priority ?? 'normal';
    else if (groupBy === 'source') key = task.sourceType === 'habit' ? 'Habit' : 'Manual';
    else if (groupBy === 'status') key = task.completed ? 'Completed' : 'Pending';

    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  // Define sort order for priority groups
  const priorityOrder: Record<string, number> = { critical: 0, normal: 1, low: 2 };
  const entries = Object.entries(groups);

  if (groupBy === 'priority') {
    entries.sort(([a], [b]) => (priorityOrder[a] ?? 99) - (priorityOrder[b] ?? 99));
  } else if (groupBy === 'status') {
    entries.sort(([a]) => (a === 'Pending' ? -1 : 1));
  } else {
    entries.sort(([a], [b]) => a.localeCompare(b));
  }

  return entries.map(([label, tasks]) => ({ label, tasks }));
}

export default function CalendarPage() {
  const { tasks, fetchTasks, completeTask, uncompleteTask, failures, fetchFailures } = useStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState<string | null>(dayjs().format('YYYY-MM-DD'));
  const [monthData, setMonthData] = useState<Record<string, { completed: number; total: number; hasFailure: boolean }>>({});
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  const loadMonthData = useCallback(async () => {
    const start = currentMonth.startOf('month');
    const end = currentMonth.endOf('month');
    const data: Record<string, { completed: number; total: number; hasFailure: boolean }> = {};

    const monthKey = currentMonth.format('YYYY-MM');

    try {
      const res = await fetch(`/api/tasks/month?month=${monthKey}`);
      const json = await res.json();
      const summary = (res.ok ? json.summary : null) || {};

      let d = start;
      while (d.isBefore(end) || d.isSame(end, 'day')) {
        const dateStr = d.format('YYYY-MM-DD');
        const hasFailure = failures.some(f => dayjs(f.timestamp).format('YYYY-MM-DD') === dateStr);
        const daySummary = summary[dateStr] || { completed: 0, total: 0 };

        data[dateStr] = {
          completed: daySummary.completed || 0,
          total: daySummary.total || 0,
          hasFailure,
        };
        d = d.add(1, 'day');
      }
    } catch {
      let d = start;
      while (d.isBefore(end) || d.isSame(end, 'day')) {
        const dateStr = d.format('YYYY-MM-DD');
        const hasFailure = failures.some(f => dayjs(f.timestamp).format('YYYY-MM-DD') === dateStr);
        data[dateStr] = { completed: 0, total: 0, hasFailure };
        d = d.add(1, 'day');
      }
    }

    setMonthData(data);
  }, [currentMonth, failures]);

  useEffect(() => {
    fetchFailures();
  }, [fetchFailures]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadMonthData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadMonthData]);

  useEffect(() => {
    if (selectedDay) fetchTasks(selectedDay);
  }, [selectedDay, fetchTasks]);

  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfWeek = currentMonth.startOf('month').day();
  const today = dayjs().format('YYYY-MM-DD');

  const handleToggle = async (id: string, completed: boolean) => {
    if (completed) await uncompleteTask(id);
    else await completeTask(id);
    if (selectedDay) {
      await fetchTasks(selectedDay);
    }
    await loadMonthData();
  };

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="space-y-8 animate-fade-in">
        <header>
          <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
            <span className="text-primary">&gt;</span> system/calendar --logs
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 space-y-4">
            {/* Month Nav */}
            <div className="flex justify-between items-center">
              <h2 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
                <span className="text-primary">&gt;</span> system/calendar --logs
              </h2>
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface min-w-[140px] text-center">
                  {currentMonth.format('MMMM_YYYY').toUpperCase()}
                </span>
                <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 bg-surface-container-low rounded-md px-4 py-2 border border-outline-variant/15">
              <div className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary"></span> PROTOCOL_MET
              </div>
              <div className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                <span className="text-error text-xs">✕</span> FAILURE_LOG
              </div>
              <div className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span> PARTIAL_COMPLETION
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-surface-container-low rounded-md border border-outline-variant/15 overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-outline-variant/15">
                {dayNames.map(d => (
                  <div key={d} className="py-2 text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square border-b border-r border-outline-variant/10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = currentMonth.date(day).format('YYYY-MM-DD');
                  const data = monthData[dateStr];
                  const isSelected = selectedDay === dateStr;
                  const isToday = dateStr === today;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(dateStr)}
                      className={`aspect-square border-b border-r border-outline-variant/10 p-1.5 text-left flex flex-col justify-between transition-colors ${
                        isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-surface-container-high'
                      }`}
                    >
                      <span className={`font-headline text-sm font-semibold ${
                        isToday ? 'text-primary' : 'text-on-surface'
                      }`}>
                        {String(day).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {data && data.completed > 0 && (
                          Array.from({ length: Math.min(data.completed, 3) }).map((_, j) => (
                            <span key={j} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))
                        )}
                        {data && data.total > 0 && data.completed < data.total && data.completed > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        )}
                        {data?.hasFailure && (
                          <span className="text-error text-[8px] font-bold">✕</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day Detail Sidebar */}
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-md border border-outline-variant/15 p-5">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
                    <span className="text-primary">&gt;</span> LOG_DETAILS
                  </h3>
                  <span className="font-mono text-xs text-on-surface-variant mt-1 block">
                    {selectedDay ? dayjs(selectedDay).format('MMM_DD_YYYY').toUpperCase() : 'Select a date'}
                  </span>
                </div>
                {selectedDay && monthData[selectedDay] && (
                  <span className={`px-2 py-0.5 rounded-[2px] font-label text-[10px] uppercase ${
                    monthData[selectedDay].total === 0
                      ? 'bg-surface-container-low text-outline'
                      : monthData[selectedDay].completed === monthData[selectedDay].total
                      ? 'bg-primary/20 text-primary'
                      : 'bg-tertiary/20 text-tertiary'
                  }`}>
                    {monthData[selectedDay].total === 0 ? 'NO DATA' : monthData[selectedDay].completed === monthData[selectedDay].total ? 'COMPLETE' : 'INCOMPLETE'}
                  </span>
                )}
              </div>

              {/* Group By Controls */}
              <div className="flex items-center gap-2 mt-3 mb-4 pt-3 border-t border-outline-variant/10">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex-shrink-0">
                  GROUP_BY
                </span>
                <div className="flex gap-1 flex-wrap">
                  {(['none', 'category', 'priority', 'source', 'status'] as GroupByOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setGroupBy(opt)}
                      className={`px-2 py-0.5 rounded-[2px] font-label text-[10px] uppercase tracking-wide border transition-colors ${
                        groupBy === opt
                          ? 'bg-primary/20 text-primary border-primary/40'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/15 hover:border-primary/30 hover:text-on-surface'
                      }`}
                      id={`group-by-${opt}`}
                    >
                      {opt === 'none' ? 'OFF' : opt}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDay && (
                <>
                  <div className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">ROUTINE_ARRAY</div>
                  {tasks.length === 0 ? (
                    <p className="font-mono text-xs text-outline text-center py-4">No tasks for this date.</p>
                  ) : (
                    <div className="space-y-4">
                      {groupTasks(tasks, groupBy).map(({ label, tasks: groupedTasks }) => (
                        <div key={label || '__all__'}>
                          {label && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                                {label === 'critical' ? 'HIGH_PRIO' : label === 'low' ? 'LOW_PRIO' : label === 'normal' ? 'MED_PRIO' : label.replace(/ /g, '_').toUpperCase()}
                              </span>
                              <span className="flex-1 h-px bg-outline-variant/15" />
                              <span className="font-mono text-[9px] text-outline">{groupedTasks.length}</span>
                            </div>
                          )}
                          <div className="space-y-2">
                            {groupedTasks.map(t => (
                              <TaskItem
                                key={t.id}
                                id={t.id}
                                title={t.title}
                                description={t.description}
                                category={t.category}
                                priority={t.priority}
                                completed={t.completed}
                                sourceType={t.sourceType}
                                onToggle={handleToggle}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Failure incidents for selected day */}
                  {failures.filter(f => dayjs(f.timestamp).format('YYYY-MM-DD') === selectedDay).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-[14px] text-error">error</span>
                        <span className="font-label text-[10px] uppercase tracking-widest text-error">INCIDENT_REPORTS</span>
                      </div>
                      {failures.filter(f => dayjs(f.timestamp).format('YYYY-MM-DD') === selectedDay).map(f => (
                        <div key={f.id} className="bg-error-container/10 border border-error/20 rounded-sm p-3 mt-2">
                          <div className="font-label text-xs text-error uppercase">TRIGGER_EVENT</div>
                          <div className="font-mono text-[10px] text-on-surface-variant mt-1">
                            {dayjs(f.timestamp).format('HH:mm_A')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
