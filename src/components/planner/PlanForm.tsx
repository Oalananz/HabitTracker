'use client';

import { useState } from 'react';

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
    endDate?: string;
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
    endDate?: string;
    prayerBlock?: string | null;
  };
  isEdit?: boolean;
}

const PLAN_TYPES = ['daily', 'weekly', 'monthly', 'custom'];
const STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'nominal', 'critical'];
const CATEGORIES = ['General', 'Work', 'Health', 'Learning', 'Personal', 'Worship', 'Admin', 'Finance'];
const PRAYER_BLOCKS = [
  { value: '', label: 'None' },
  { value: 'fajr', label: 'Fajr' },
  { value: 'dhuhr', label: 'Dhuhr' },
  { value: 'asr', label: 'Asr' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isha', label: 'Isha' },
];

export default function PlanForm({ onSubmit, onCancel, initialData, isEdit }: PlanFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [planType, setPlanType] = useState(initialData?.planType || 'daily');
  const [status, setStatus] = useState(initialData?.status || 'planned');
  const [priority, setPriority] = useState(initialData?.priority || 'nominal');
  const [category, setCategory] = useState(initialData?.category || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [prayerBlock, setPrayerBlock] = useState(initialData?.prayerBlock || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        planType,
        status,
        priority,
        category: category || undefined,
        notes: notes.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        prayerBlock: prayerBlock || undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass = 'bg-surface-container-low border border-outline-variant/15 rounded-sm px-2 py-1.5 text-xs font-label text-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors uppercase cursor-pointer w-full';
  const inputClass = 'w-full bg-surface-container-low rounded-sm text-on-surface text-sm font-body placeholder:text-outline border border-outline-variant/15 p-2.5 focus:ring-0 focus:border-primary/50 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-md p-5 border border-outline-variant/15 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-primary font-headline text-lg">&gt;</span>
        <span className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
          {isEdit ? 'EDIT_PLAN' : 'NEW_PLAN'}
        </span>
      </div>

      {/* Title */}
      <div>
        <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Plan title..."
          autoFocus
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="Optional description..."
          rows={2}
        />
      </div>

      {/* Row: Type, Status, Priority */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Type</label>
          <select value={planType} onChange={(e) => setPlanType(e.target.value)} className={selectClass}>
            {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Category, Prayer Block */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            <option value="">None</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Prayer Block</label>
          <select value={prayerBlock} onChange={(e) => setPrayerBlock(e.target.value)} className={selectClass}>
            {PRAYER_BLOCKS.map(pb => <option key={pb.value} value={pb.value}>{pb.label}</option>)}
          </select>
        </div>
      </div>

      {/* Row: Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} resize-none`}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-label uppercase text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-5 py-2 bg-scanline-gradient text-on-primary text-xs font-label uppercase font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
        </button>
      </div>
    </form>
  );
}
