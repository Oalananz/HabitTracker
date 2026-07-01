'use client';

import { useState } from 'react';
import type { SkillLevel } from '@/lib/learning';

interface SkillFormInitial {
  name?: string;
  category?: string;
  level?: SkillLevel;
  targetLevel?: string;
  progressPercentage?: number;
}

interface SkillFormProps {
  onSubmit: (data: {
    name: string;
    category: string;
    level: SkillLevel;
    targetLevel: string;
    progressPercentage: number;
  }) => void;
  onCancel: () => void;
  initial?: SkillFormInitial;
}

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function SkillForm({ onSubmit, onCancel, initial }: SkillFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [level, setLevel] = useState<SkillLevel>(initial?.level || 'beginner');
  const [targetLevel, setTargetLevel] = useState(initial?.targetLevel || '');
  const [progressPercentage, setProgressPercentage] = useState(
    initial?.progressPercentage?.toString() ?? '0'
  );

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      category: category.trim(),
      level,
      targetLevel: targetLevel.trim(),
      progressPercentage: Math.min(100, Math.max(0, parseInt(progressPercentage, 10) || 0)),
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> {initial ? 'EDIT_SKILL' : 'NEW_SKILL'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; SKILL_NAME
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. TypeScript, Public Speaking"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CATEGORY (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="Programming, Soft Skills..."
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; CURRENT_LEVEL
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as SkillLevel)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l} className="bg-surface-container-lowest">
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; TARGET_LEVEL (optional)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. Advanced by Q4"
            />
          </div>
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
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {initial ? 'SAVE CHANGES' : 'ADD SKILL'} &#8629;
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
