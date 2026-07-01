'use client';

import { useState } from 'react';
import type { CourseStatus } from '@/lib/learning';

interface CourseFormInitial {
  title?: string;
  provider?: string;
  courseUrl?: string;
  description?: string;
  status?: CourseStatus;
  targetCompletionDate?: string;
  progressPercentage?: number;
}

interface CourseFormProps {
  onSubmit: (data: {
    title: string;
    provider: string;
    courseUrl: string;
    description: string;
    status: CourseStatus;
    targetCompletionDate: string;
    progressPercentage: number;
  }) => void;
  onCancel: () => void;
  initial?: CourseFormInitial;
}

const STATUSES: CourseStatus[] = ['not_started', 'in_progress', 'completed', 'paused'];

export default function CourseForm({ onSubmit, onCancel, initial }: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [provider, setProvider] = useState(initial?.provider || '');
  const [courseUrl, setCourseUrl] = useState(initial?.courseUrl || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState<CourseStatus>(initial?.status || 'not_started');
  const [targetCompletionDate, setTargetCompletionDate] = useState(initial?.targetCompletionDate || '');
  const [progressPercentage, setProgressPercentage] = useState(
    initial?.progressPercentage?.toString() ?? '0'
  );

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      provider: provider.trim(),
      courseUrl: courseUrl.trim(),
      description: description.trim(),
      status,
      targetCompletionDate,
      progressPercentage: Math.min(100, Math.max(0, parseInt(progressPercentage, 10) || 0)),
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_COURSE' : 'NEW_COURSE'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; COURSE_TITLE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. Advanced React Patterns"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PROVIDER (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Udemy, Coursera, self-study..."
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; COURSE_URL (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="url"
              value={courseUrl}
              onChange={(e) => setCourseUrl(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; STATUS
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface-container-lowest">
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PROGRESS_%
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={0}
              max={100}
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="0"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TARGET_COMPLETION_DATE (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={targetCompletionDate}
              onChange={(e) => setTargetCompletionDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
          &gt; DESCRIPTION (optional)
        </label>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
            rows={2}
            placeholder="What is this course about?"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD COURSE'} &#8629;
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-container-high text-on-surface-variant font-label text-xs uppercase rounded-sm hover:bg-surface-bright transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
