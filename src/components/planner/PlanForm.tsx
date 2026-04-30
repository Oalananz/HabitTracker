'use client';

import { useState } from 'react';
import dayjs from 'dayjs';

interface PlanFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    planType?: string;
    status?: string;
    priority?: string;
    category?: string;
    notes?: string;
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    dayOfWeek?: string;
    prayerBlock?: string;
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    title?: string;
    description?: string;
    planType?: string;
    status?: string;
    priority?: string;
    category?: string;
    notes?: string;
    startDate?: string;
    startTime?: string | null;
    endDate?: string;
    endTime?: string | null;
    dayOfWeek?: string | null;
    prayerBlock?: string | null;
  };
  isEdit?: boolean;
}

const PLAN_TYPES = ['daily', 'weekly', 'monthly', 'custom'];
const STATUSES   = ['planned', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'nominal', 'critical'];
const CATEGORIES = ['General', 'Work', 'Health', 'Learning', 'Personal', 'Worship', 'Admin', 'Finance'];
const DAYS_OF_WEEK = [
  { value: '',    label: 'None' },
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];
const PRAYER_BLOCKS = [
  { value: '',        label: 'None',    emoji: '' },
  { value: 'fajr',   label: 'Fajr',    emoji: '🌙' },
  { value: 'dhuhr',  label: 'Dhuhr',   emoji: '☀️' },
  { value: 'asr',    label: 'Asr',     emoji: '🌤' },
  { value: 'maghrib',label: 'Maghrib', emoji: '🌅' },
  { value: 'isha',   label: 'Isha',    emoji: '🌠' },
];

export default function PlanForm({ onSubmit, onCancel, initialData, isEdit }: PlanFormProps) {
  const [title,       setTitle]       = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [planType,    setPlanType]    = useState(initialData?.planType || 'daily');
  const [status,      setStatus]      = useState(initialData?.status || 'planned');
  const [priority,    setPriority]    = useState(initialData?.priority || 'nominal');
  const [category,    setCategory]    = useState(initialData?.category || '');
  const [notes,       setNotes]       = useState(initialData?.notes || '');
  const [startDate,   setStartDate]   = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [startTime,   setStartTime]   = useState(initialData?.startTime || '');
  const [endDate,     setEndDate]     = useState(initialData?.endDate || '');
  const [endTime,     setEndTime]     = useState(initialData?.endTime || '');
  const [dayOfWeek,   setDayOfWeek]   = useState(initialData?.dayOfWeek || '');
  const [prayerBlock, setPrayerBlock] = useState(initialData?.prayerBlock || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initialData?.startTime || initialData?.endTime || initialData?.notes));

  const normalizeTimeRange = (start: string, end: string) => {
    if (!start && !end) return { startTime: '', endTime: '' };
    if (start && !end) return { startTime: start, endTime: dayjs(`2000-01-01T${start}`).add(1, 'hour').format('HH:mm') };
    if (!start && end) return { startTime: dayjs(`2000-01-01T${end}`).subtract(1, 'hour').format('HH:mm'), endTime: end };
    if (!dayjs(`2000-01-01T${end}`).isAfter(dayjs(`2000-01-01T${start}`))) {
      return { startTime: start, endTime: dayjs(`2000-01-01T${start}`).add(1, 'hour').format('HH:mm') };
    }
    return { startTime: start, endTime: end };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setIsSubmitting(true);
    try {
      const normalized = normalizeTimeRange(startTime, endTime);
      await onSubmit({
        title:       title.trim(),
        description: description.trim() || undefined,
        planType,
        status,
        priority,
        category:    category || undefined,
        notes:       notes.trim() || undefined,
        startDate,
        startTime:   normalized.startTime || undefined,
        endDate:     endDate || undefined,
        endTime:     normalized.endTime || undefined,
        dayOfWeek:   dayOfWeek || undefined,
        prayerBlock: prayerBlock || undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-surface-container border border-outline-variant/20 rounded-sm px-3 py-2 text-sm font-body text-on-surface placeholder:text-outline focus:border-primary/60 transition-colors';
  const selectCls = 'w-full bg-surface-container border border-outline-variant/20 rounded-sm px-3 py-2 text-xs font-label text-on-surface-variant uppercase tracking-wide cursor-pointer focus:border-primary/60 transition-colors';
  const labelCls = 'block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-md overflow-hidden animate-fade-in shadow-xl">
      {/* Form header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15 bg-surface-container-low">
        <div className="flex items-center gap-2">
          <span className="text-primary font-headline font-bold">&gt;</span>
          <span className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
            {isEdit ? 'Edit Plan' : 'New Plan'}
          </span>
        </div>
        <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={inputCls}
            placeholder="What are you planning?"
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Optional details..."
            rows={2}
          />
        </div>

        {/* Row 1: Type · Status · Priority */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Type</label>
            <select value={planType} onChange={e => { setPlanType(e.target.value); if (e.target.value !== 'weekly') setDayOfWeek(''); }} className={selectCls}>
              {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Category · Prayer Block */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
              <option value="">None</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Prayer Block</label>
            <select value={prayerBlock} onChange={e => setPrayerBlock(e.target.value)} className={selectCls}>
              {PRAYER_BLOCKS.map(pb => (
                <option key={pb.value} value={pb.value}>{pb.emoji ? `${pb.emoji} ` : ''}{pb.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of week (weekly type only) */}
        {planType === 'weekly' && (
          <div>
            <label className={labelCls}>Day of Week</label>
            <div className="flex gap-1">
              {DAYS_OF_WEEK.filter(d => d.value).map(d => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDayOfWeek(dayOfWeek === d.value ? '' : d.value)}
                  className={`flex-1 py-1.5 text-[10px] font-label uppercase tracking-wide rounded-sm border transition-colors ${
                    dayOfWeek === d.value
                      ? 'bg-primary/20 text-primary border-primary/40'
                      : 'bg-surface-container border-outline-variant/15 text-on-surface-variant hover:border-primary/30'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">{showAdvanced ? 'expand_less' : 'expand_more'}</span>
          {showAdvanced ? 'Hide' : 'Show'} time &amp; notes
        </button>

        {showAdvanced && (
          <div className="space-y-4 animate-fade-in">
            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>End Time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <span className="animate-blink text-on-primary/80">▊</span>}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
