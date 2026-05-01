'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/ui/StatCard';
import PlanCard from '@/components/planner/PlanCard';
import PlanForm from '@/components/planner/PlanForm';
import DayTimeline from '@/components/planner/DayTimeline';
import type { TimelineEvent } from '@/components/planner/DayTimeline';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

type ViewMode = 'daily' | 'weekly' | 'monthly';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function PlannerPage() {
  const {
    plans, plansSummary, isPlansLoading,
    fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary,
    createPlan, updatePlan, deletePlan,
    plannerDate, setPlannerDate,
  } = useStore();

  const [view, setView] = useState<ViewMode>('weekly');
  const [weekAnchor, setWeekAnchor] = useState(() => dayjs().startOf('week'));
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'));
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [timelineDraft, setTimelineDraft] = useState<{ startTime: string; endTime: string } | null>(null);

  // Derived week range (stable strings for deps)
  const weekStartStr = weekAnchor.startOf('week').format('YYYY-MM-DD');
  const weekEndStr = weekAnchor.endOf('week').format('YYYY-MM-DD');
  const weekStart = dayjs(weekStartStr);
  const weekEnd = dayjs(weekEndStr);
  const monthStr = currentMonth.format('YYYY-MM');

  const loadData = () => {
    if (view === 'daily') {
      fetchPlans(plannerDate);
    } else if (view === 'weekly') {
      fetchWeeklyPlans(weekStartStr);
    } else {
      fetchMonthlyPlans(monthStr);
    }
    fetchPlansSummary();
  };

  useEffect(() => {
    if (view === 'daily') {
      fetchPlans(plannerDate);
    } else if (view === 'weekly') {
      fetchWeeklyPlans(weekStartStr);
    } else {
      fetchMonthlyPlans(monthStr);
    }
    fetchPlansSummary();
  }, [view, plannerDate, weekStartStr, monthStr, fetchPlans, fetchWeeklyPlans, fetchMonthlyPlans, fetchPlansSummary]);

  // When switching to daily from weekly, jump to that week's Monday
  const switchView = (v: ViewMode) => {
    setView(v);
    if (v === 'daily') {
      // keep plannerDate as-is
    }
  };

  // --- Handlers ---
  const handleCreate = async (data: Parameters<typeof createPlan>[0]) => {
    await createPlan(data);
    setShowForm(false);
    setTimelineDraft(null);
    loadData();
  };

  const handleUpdate = async (data: Parameters<typeof updatePlan>[1]) => {
    if (!editingPlan) return;
    await updatePlan(editingPlan, data);
    setEditingPlan(null);
    setTimelineDraft(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    await deletePlan(id);
    setDeleteConfirm(null);
    loadData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePlan(id, { status: newStatus });
    loadData();
  };

  // --- Filtering ---
  const filteredPlans = useMemo(() => {
    const seenOccurrences = new Set<string>();

    return plans.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      }

      const occurrenceKey = p.occurrenceKey || `${p.id}:${p.occurrenceDate || p.startDate}`;
      if (seenOccurrences.has(occurrenceKey)) return false;
      seenOccurrences.add(occurrenceKey);

      return true;
    });
  }, [plans, filterStatus, searchQuery]);

  const plansByDate = useMemo(() => filteredPlans.reduce<Record<string, typeof plans>>((acc, plan) => {
    const key = plan.occurrenceDate || plan.startDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {}), [filteredPlans]);

  const editPlanData = editingPlan ? plans.find(p => p.id === editingPlan) : null;

  // Timeline events for daily view
  const timelineEvents: TimelineEvent[] = useMemo(() => filteredPlans.map(p => ({
    id: p.id,
    occurrenceKey: p.occurrenceKey || `${p.id}:${p.occurrenceDate || p.startDate}`,
    title: p.title,
    status: p.status,
    priority: p.priority,
    category: p.category,
    prayerBlock: p.prayerBlock,
    startTime: p.startTime,
    endTime: p.endTime,
  })), [filteredPlans]);

  // Timeline handlers
  const handleTimelineCreate = (startTime: string, endTime: string) => {
    setTimelineDraft({ startTime, endTime });
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleTimelineMove = async (id: string, startTime: string, endTime: string) => {
    await updatePlan(id, { startTime, endTime });
    loadData();
  };

  const handleTimelineResize = async (id: string, startTime: string, endTime: string) => {
    await updatePlan(id, { startTime, endTime });
    loadData();
  };

  const handleTimelineSelect = (id: string) => {
    setEditingPlan(id);
    setShowForm(false);
    setTimelineDraft(null);
  };
  const today = dayjs().format('YYYY-MM-DD');

  // --- Nav helpers ---
  const goWeekPrev = () => setWeekAnchor(a => a.subtract(1, 'week'));
  const goWeekNext = () => setWeekAnchor(a => a.add(1, 'week'));
  const goWeekToday = () => setWeekAnchor(dayjs().startOf('week'));
  const isCurrentWeek = weekStart.format('YYYY-MM-DD') === dayjs().startOf('week').format('YYYY-MM-DD');

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tighter text-on-surface">
            <span className="text-primary">&gt;</span> system/planner
          </h1>
          <p className="font-mono text-xs text-on-surface-variant mt-1">
            {view === 'daily' && `-- date ${plannerDate}`}
            {view === 'weekly' && `-- week ${weekStart.format('MMM D')} → ${weekEnd.format('MMM D, YYYY')}`}
            {view === 'monthly' && `-- month ${currentMonth.format('MMMM YYYY')}`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingPlan(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity tracking-wider"
          id="new-plan-btn"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Plan
        </button>
      </header>

      {/* ── Summary Stats ── */}
      {plansSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="TODAY" value={plansSummary.todayCount} subtitle={`${plansSummary.todayCompleted} done`} icon="today" variant="primary" />
          <StatCard label="THIS_WEEK" value={plansSummary.weekCount} subtitle={`${plansSummary.weekCompleted} done`} icon="date_range" />
          <StatCard label="THIS_MONTH" value={plansSummary.monthCount} subtitle={`${plansSummary.monthCompleted} done`} icon="calendar_month" />
          <StatCard label="OVERDUE" value={plansSummary.overdueCount} subtitle={`${plansSummary.upcomingCount} upcoming`} icon="warning" variant="warning" />
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-3 flex flex-wrap gap-3 items-center">

        {/* View Tabs */}
        <div className="flex gap-0.5 bg-surface-container-lowest rounded-sm p-0.5 border border-outline-variant/10">
          {(['daily', 'weekly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`px-3 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-[2px] transition-all ${
                view === v
                  ? 'bg-primary/20 text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              id={`view-${v}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date / Week / Month Navigation */}
        <div className="flex items-center gap-2 ml-auto">
          {view === 'daily' && (
            <>
              <button onClick={() => setPlannerDate(dayjs(plannerDate).subtract(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <input
                type="date"
                value={plannerDate}
                onChange={e => setPlannerDate(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-2 py-1 text-xs font-mono text-on-surface"
              />
              <button onClick={() => setPlannerDate(dayjs(plannerDate).add(1, 'day').format('YYYY-MM-DD'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {plannerDate !== today && (
                <button onClick={() => setPlannerDate(today)} className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                  Today
                </button>
              )}
            </>
          )}

          {view === 'weekly' && (
            <>
              <button onClick={goWeekPrev} className="text-on-surface-variant hover:text-primary transition-colors p-1" id="week-prev">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="font-headline text-xs font-bold text-on-surface min-w-[160px] text-center uppercase tracking-wide">
                {weekStart.format('MMM D')} – {weekEnd.format('MMM D')}
              </span>
              <button onClick={goWeekNext} className="text-on-surface-variant hover:text-primary transition-colors p-1" id="week-next">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {!isCurrentWeek && (
                <button onClick={goWeekToday} className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
                  This week
                </button>
              )}
            </>
          )}

          {view === 'monthly' && (
            <>
              <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="font-headline text-xs font-bold text-on-surface min-w-[120px] text-center uppercase tracking-wide">
                {currentMonth.format('MMM YYYY')}
              </span>
              <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Search + Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[180px]">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-outline">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-sm pl-7 pr-3 py-1.5 text-xs font-body text-on-surface placeholder:text-outline focus:border-primary/50 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-2 py-1.5 text-[10px] font-label text-on-surface-variant uppercase tracking-widest cursor-pointer focus:border-primary/50 transition-colors"
          >
            <option value="all">ALL</option>
            <option value="planned">PLANNED</option>
            <option value="in_progress">IN PROG</option>
            <option value="completed">DONE</option>
            <option value="cancelled">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* ── Form (Create / Edit) ── */}
      {showForm && (
        <PlanForm
          onSubmit={handleCreate}
          onCancel={() => { setShowForm(false); setTimelineDraft(null); }}
          initialData={{
            startDate: plannerDate,
            ...(timelineDraft ? { startTime: timelineDraft.startTime, endTime: timelineDraft.endTime } : {}),
          }}
        />
      )}
      {editingPlan && editPlanData && (
        <PlanForm
          isEdit
          onSubmit={handleUpdate}
          onCancel={() => setEditingPlan(null)}
          initialData={{
            title: editPlanData.title,
            description: editPlanData.description || '',
            planType: editPlanData.planType,
            status: editPlanData.status,
            priority: editPlanData.priority,
            category: editPlanData.category || '',
            notes: editPlanData.notes || '',
            startDate: editPlanData.startDate,
            startTime: editPlanData.startTime,
            endDate: editPlanData.endDate || '',
            endTime: editPlanData.endTime,
            dayOfWeek: editPlanData.dayOfWeek,
            prayerBlock: editPlanData.prayerBlock,
          }}
        />
      )}

      {/* ── Main Content ── */}
      {isPlansLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-on-surface-variant font-mono text-sm">
          <span className="animate-blink text-primary text-xl">▊</span>
          Loading plans...
        </div>
      ) : (
        <>
          {/* DAILY VIEW */}
          {view === 'daily' && (
            <div className="space-y-4">
              {/* Timeline header */}
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <span className="text-primary">&gt;</span> Timeline — {dayjs(plannerDate).format('ddd, MMM D YYYY')}
                </span>
                <span className="font-mono text-[10px] text-outline">
                  {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} · drag to add
                </span>
              </div>

              {/* Day Timeline */}
              <DayTimeline
                date={plannerDate}
                events={timelineEvents}
                onCreateSlot={handleTimelineCreate}
                onMoveEvent={handleTimelineMove}
                onResizeEvent={handleTimelineResize}
                onSelectEvent={handleTimelineSelect}
                onDeleteEvent={handleDelete}
              />

              {/* Plan cards list below timeline */}
              {filteredPlans.length > 0 && (
                <div className="space-y-2">
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    <span className="text-primary">&gt;</span> Plan list
                  </span>
                  <div className="flex flex-col gap-2">
                    {filteredPlans.map(plan => (
                      <PlanCard
                        key={plan.occurrenceKey || plan.id}
                        {...plan}
                        onStatusChange={handleStatusChange}
                        onEdit={id => { setEditingPlan(id); setShowForm(false); }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WEEKLY VIEW */}
          {view === 'weekly' && (
            <div className="space-y-3">
              {/* Week summary bar */}
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <span className="text-primary">&gt;</span> Week {weekStart.isoWeek()} — {weekStart.format('MMM D')} to {weekEnd.format('MMM D, YYYY')}
                </span>
                <span className="font-mono text-[10px] text-outline">{filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}</span>
              </div>

              {/* 7-day grid */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = weekStart.add(i, 'day');
                  const dayStr = day.format('YYYY-MM-DD');
                  const dayPlans = plansByDate[dayStr] || [];
                  const isToday = dayStr === today;
                  const completedCount = dayPlans.filter(p => p.status === 'completed').length;

                  return (
                    <div
                      key={dayStr}
                      className={`rounded-md border flex flex-col min-h-[160px] transition-colors ${
                        isToday
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-outline-variant/15 bg-surface-container-lowest'
                      }`}
                    >
                      {/* Day header — click to drill into daily */}
                      <button
                        onClick={() => { setPlannerDate(dayStr); setWeekAnchor(day.startOf('week')); switchView('daily'); }}
                        className={`flex items-center justify-between px-3 py-2 border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors rounded-t-md ${
                          isToday ? 'border-primary/20' : ''
                        }`}
                        title={`View ${day.format('ddd D')}`}
                      >
                        <span className={`font-label text-[10px] uppercase tracking-widest font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {DAY_NAMES[i]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {dayPlans.length > 0 && (
                            <span className="font-mono text-[9px] text-outline">{completedCount}/{dayPlans.length}</span>
                          )}
                          <span className={`font-headline text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                            {day.format('D')}
                          </span>
                        </div>
                      </button>

                      {/* Plans list */}
                      <div className="flex flex-col gap-1 p-2 flex-1">
                        {dayPlans.length === 0 ? (
                          <span className="font-mono text-[9px] text-outline text-center mt-6">—</span>
                        ) : (
                          dayPlans.map(plan => (
                            <PlanCard
                              key={plan.occurrenceKey || plan.id}
                              {...plan}
                              compact
                              onStatusChange={handleStatusChange}
                              onEdit={id => { setEditingPlan(id); setShowForm(false); }}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </div>

                      {/* Quick-add for this day */}
                      <button
                        onClick={() => { setPlannerDate(dayStr); setShowForm(true); setEditingPlan(null); }}
                        className="flex items-center justify-center gap-1 py-1.5 text-[9px] font-label uppercase tracking-widest text-outline hover:text-primary hover:bg-surface-container-low/30 transition-colors rounded-b-md border-t border-outline-variant/10"
                        title={`Add plan for ${day.format('ddd D')}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">add</span>
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTHLY VIEW */}
          {view === 'monthly' && (
            <div className="space-y-3">
              <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                <span className="text-primary">&gt;</span> {currentMonth.format('MMMM YYYY')} — {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}
              </span>
              <div className="bg-surface-container-lowest rounded-md border border-outline-variant/15 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-outline-variant/15">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-2.5 text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: currentMonth.startOf('month').day() }).map((_, i) => (
                    <div key={`e-${i}`} className="border-b border-r border-outline-variant/10 min-h-[80px]" />
                  ))}
                  {Array.from({ length: currentMonth.daysInMonth() }).map((_, i) => {
                    const day = currentMonth.date(i + 1);
                    const dateStr = day.format('YYYY-MM-DD');
                    const dayPlans = plansByDate[dateStr] || [];
                    const isToday = dateStr === today;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setPlannerDate(dateStr); setWeekAnchor(day.startOf('week')); switchView('daily'); }}
                        className={`border-b border-r border-outline-variant/10 min-h-[80px] p-1.5 text-left flex flex-col transition-colors hover:bg-surface-container-low ${
                          isToday ? 'bg-primary/8 ring-1 ring-inset ring-primary/30' : ''
                        }`}
                      >
                        <span className={`font-headline text-xs font-semibold mb-1 ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                          {dayPlans.slice(0, 3).map(p => (
                            <div key={p.occurrenceKey || p.id} className={`text-[7px] font-label truncate px-1 py-0.5 rounded-[1px] ${
                              p.status === 'completed' ? 'bg-primary/20 text-primary' :
                              p.status === 'in_progress' ? 'bg-tertiary/20 text-tertiary' :
                              p.status === 'cancelled' ? 'bg-error/15 text-error' :
                              'bg-secondary/10 text-secondary'
                            }`}>
                              {p.title}
                            </div>
                          ))}
                          {dayPlans.length > 3 && (
                            <span className="text-[7px] text-outline font-mono">+{dayPlans.length - 3} more</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-surface-container border border-outline-variant/20 rounded-md p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
              <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
                Confirm Delete
              </h3>
            </div>
            <p className="font-body text-sm text-on-surface-variant mb-5">
              This plan will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 bg-error/90 text-on-error text-xs font-label uppercase font-bold rounded-sm hover:bg-error transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
