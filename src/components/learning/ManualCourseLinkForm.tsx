'use client';

import { useState } from 'react';

interface ManualCourseLinkFormProps {
  onSubmit: (data: {
    title: string;
    courseUrl: string;
    provider: string;
    progressPercentage: number;
    targetCompletionDate: string;
  }) => void;
  onCancel: () => void;
}

/**
 * Universal fallback for tracking a course on ANY website — no API, no
 * OAuth, no login required. Never collects a username or password.
 */
export default function ManualCourseLinkForm({ onSubmit, onCancel }: ManualCourseLinkFormProps) {
  const [title, setTitle] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [provider, setProvider] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('0');
  const [targetCompletionDate, setTargetCompletionDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !courseUrl.trim()) return;
    onSubmit({
      title: title.trim(),
      courseUrl: courseUrl.trim(),
      provider: provider.trim(),
      progressPercentage: Math.min(100, Math.max(0, parseInt(progressPercentage, 10) || 0)),
      targetCompletionDate,
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> ADD_COURSE_LINK
      </h3>
      <p className="font-body text-xs text-on-surface-variant">
        Works for any learning website. We only store the link and the progress you enter — never a password.
      </p>

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
              placeholder="e.g. Machine Learning Specialization"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; PROVIDER_NAME
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Any website or platform name"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; COURSE_URL
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
            &gt; CURRENT_PROGRESS_%
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

        <div>
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

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !courseUrl.trim()}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          ADD COURSE LINK &#8629;
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
