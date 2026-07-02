'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/useConfirm';
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
  const [timelineDraft, setTimelineDraft] = useState<{ startTime: string; endTime: string } | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

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
    if (!(await confirm({ title: 'Delete plan', message: 'This plan will be permanently removed. This action cannot be undone.' }))) return;
    await deletePlan(id);
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

  const dateSubtitle =
    view === 'daily' ? dayjs(plannerDate).format('dddd, MMM D') :
    view === 'weekly' ? `${weekStart.format('MMM D')} – ${weekEnd.format('MMM D, YYYY')}` :
    currentMonth.format('MMMM YYYY');

  return (
    <div className="space-y-6 animate-page-enter">
      {ConfirmDialog}

      {/* ── Header ── */}
      <PageHeader
        title="Planner"
        eyebrow="system/planner"
        description={dateSubtitle}
        actions={
          <Button variant="primary" icon="add" onClick={() => { setShowForm(true); setEditingPlan(null); }} id="new-plan-btn">
            New plan
          </Button>
        }
      />

      {/* ── Summary Stats ── */}
      {plansSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Today" value={plansSummary.todayCount} subtitle={`${plansSummary.todayCompleted} done`} icon="today" variant="primary" />
          <StatCard label="This week" value={plansSummary.weekCount} subtitle={`${plansSummary.weekCompleted} done`} icon="date_range" />
          <StatCard label="This month" value={plansSummary.monthCount} subtitle={`${plansSummary.monthCompleted} done`} icon="calendar_month" />
          <StatCard label="Overdue" value={plansSummary.overdueCount} subtitle={`${plansSummary.upcomingCount} upcoming`} icon="warning" variant="warning" />
        </div>
      )}

      {/* ── Controls Bar ── */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-3 flex flex-wrap gap-4 items-center divide-x divide-outline-variant/10">

        {/* View Tabs */}
        <div className="flex gap-0.5 bg-surface-container-lowest rounded-sm p-0.5 border border-outline-variant/10">
          {(['daily', 'weekly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`px-3 py-1.5 text-xs font-label capitalize rounded-[2px] transition-all ${
                view === v
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              id={`view-${v}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Date / Week / Month Navigation */}
        <div className="flex items-center gap-2 pl-4">
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
                <button onClick={() => setPlannerDate(today)} className="text-xs text-on-surface-variant hover:text-primary transition-colors">
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
              <span className="font-headline text-xs font-semibold text-on-surface min-w-[160px] text-center">
                {weekStart.format('MMM D')} – {weekEnd.format('MMM D')}
              </span>
              <button onClick={goWeekNext} className="text-on-surface-variant hover:text-primary transition-colors p-1" id="week-next">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              {!isCurrentWeek && (
                <button onClick={goWeekToday} className="text-xs text-on-surface-variant hover:text-primary transition-colors">
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
              <span className="font-headline text-xs font-semibold text-on-surface min-w-[120px] text-center">
                {currentMonth.format('MMM YYYY')}
              </span>
              <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Search + Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto pl-4">
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
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-auto py-1.5 text-xs"
          >
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Done</option>
            <option value="cancelled">Cancelled</option>
          </Select>
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
            lifeArea: editPlanData.lifeArea || null,
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
                <span className="text-sm font-medium text-on-surface">
                  Timeline — {dayjs(plannerDate).format('ddd, MMM D YYYY')}
                </span>
                <span className="text-xs text-on-surface-variant/70">
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
                  <span className="text-sm font-medium text-on-surface">Plan list</span>
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
                <span className="text-sm font-medium text-on-surface">
                  Week {weekStart.isoWeek()} — {weekStart.format('MMM D')} to {weekEnd.format('MMM D, YYYY')}
                </span>
                <span className="text-xs text-on-surface-variant/70">{filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}</span>
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
                        <span className={`font-label text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {DAY_NAMES[i]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {dayPlans.length > 0 && (
                            <span className="text-xs text-on-surface-variant/60">{completedCount}/{dayPlans.length}</span>
                          )}
                          <span className={`font-headline text-xs font-semibold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                            {day.format('D')}
                          </span>
                        </div>
                      </button>

                      {/* Plans list */}
                      <div className="flex flex-col gap-1 p-2 flex-1">
                        {dayPlans.length === 0 ? (
                          <span className="text-xs text-on-surface-variant/40 text-center mt-6">Nothing planned</span>
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
                        className="flex items-center justify-center gap-1 py-1.5 text-xs font-label text-on-surface-variant/60 hover:text-primary hover:bg-surface-container-low/30 transition-colors rounded-b-md border-t border-outline-variant/10"
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
              <span className="text-sm font-medium text-on-surface">
                {currentMonth.format('MMMM YYYY')} — {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''}
              </span>
              <div className="bg-surface-container-lowest rounded-md border border-outline-variant/15 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-outline-variant/15">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="py-2.5 text-center font-label text-xs text-on-surface-variant/70">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: currentMonth.startOf('month').day() }).map((_, i) => (
                    <div key={`e-${i}`} className="border-b border-r border-outline-variant/15 min-h-[80px]" />
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
                        className={`border-b border-r border-outline-variant/15 min-h-[80px] p-1.5 text-left flex flex-col transition-colors hover:bg-surface-container-low ${
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
    </div>
  );
}
