'use client';

import { useState } from 'react';

interface HabitFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    repeatRule: { type: string; days?: number[] };
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    repeatRule: { type: string; days?: number[] };
  };
}

const CATEGORIES = ['Health & Fitness', 'Work', 'Learning', 'Personal', 'Admin', 'Focus', 'General'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitForm({ onSubmit, onCancel, initialData }: HabitFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'General');
  const [priority, setPriority] = useState(initialData?.priority || 'nominal');
  const [repeatType, setRepeatType] = useState(initialData?.repeatRule?.type || 'daily');
  const [customDays, setCustomDays] = useState<number[]>(initialData?.repeatRule?.days || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      repeatRule: {
        type: repeatType,
        ...(repeatType === 'custom' ? { days: customDays } : {}),
      },
    });
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-md overflow-hidden animate-fade-in">
      {/* Terminal Header */}
      <div className="bg-surface-container-low px-4 py-2.5 flex items-center gap-2 border-b border-outline-variant/15">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-primary/60"></div>
        </div>
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          init_protocol.sh
        </span>
      </div>

      <div className="p-6">
        <h3 className="font-headline text-lg font-bold text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add_box</span>
          {initialData ? 'Edit Protocol' : 'Define New Protocol'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Protocol Name */}
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
              &gt; PROTOCOL NAME
            </label>
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
              <span className="text-primary font-mono text-sm">&gt;</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
                placeholder="e.g. Morning Hydration"
                required
                id="habit-title"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
              &gt; DESCRIPTION
            </label>
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
                placeholder="Protocol description..."
                rows={2}
                id="habit-description"
              />
            </div>
          </div>

          {/* Sector (Category) */}
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
              &gt; SECTOR
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              id="habit-category"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-surface-container-lowest">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Execution Frequency */}
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
              &gt; EXECUTION FREQUENCY
            </label>
            <div className="flex gap-2">
              {['daily', 'weekdays', 'weekends', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRepeatType(type)}
                  className={`px-4 py-2 rounded-sm font-label text-xs uppercase tracking-wider transition-colors ${
                    repeatType === type
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                  }`}
                  id={`habit-freq-${type}`}
                >
                  {type === 'weekdays' ? 'Weekdays' : type === 'weekends' ? 'Weekends' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Custom days selector */}
            {repeatType === 'custom' && (
              <div className="flex gap-2 mt-3 animate-fade-in">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-sm font-label text-xs uppercase transition-colors ${
                      customDays.includes(i)
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Level */}
          <div>
            <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
              &gt; PRIORITY LEVEL
            </label>
            <div className="flex items-center gap-4">
              {[
                { value: 'low', label: 'LOW', color: 'text-on-surface-variant' },
                { value: 'nominal', label: 'NOMINAL', color: 'text-secondary' },
                { value: 'critical', label: 'CRITICAL', color: 'text-error' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`font-label text-xs uppercase tracking-wider transition-colors px-3 py-1.5 rounded-sm ${
                    priority === p.value
                      ? `${p.color} bg-surface-container-high font-bold border border-outline-variant/30`
                      : 'text-outline hover:text-on-surface-variant'
                  }`}
                  id={`habit-priority-${p.value}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-sm font-headline font-bold text-sm uppercase tracking-wider bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 transition-colors"
              id="habit-cancel"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-sm font-headline font-bold text-sm uppercase tracking-wider bg-scanline-gradient text-on-primary hover:opacity-90 transition-opacity"
              id="habit-submit"
            >
              COMMIT ↵
            </button>
          </div>
        </form>

        {/* Terminal log footer */}
        <div className="mt-6 pt-4 border-t border-outline-variant/10 font-mono text-[11px] text-outline space-y-1">
          <div>&gt; system integrity check... OK</div>
          <div>&gt; loading protocol definitions... OK</div>
          <div className="text-primary">&gt; awaiting user input for new configuration block.</div>
          <div className="flex gap-1 mt-1 opacity-50">
            <span className="text-primary animate-blink">_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
