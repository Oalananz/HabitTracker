'use client';

import { useState } from 'react';
import type { LearningCourse, Skill } from '@/lib/learning';

interface StudySessionFormProps {
  courses: LearningCourse[];
  skills: Skill[];
  onSubmit: (data: {
    courseId: string | null;
    skillId: string | null;
    title: string;
    durationMinutes: number;
    date: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function StudySessionForm({ courses, skills, onSubmit, onCancel }: StudySessionFormProps) {
  const [courseId, setCourseId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const duration = parseInt(durationMinutes, 10);
    if (!title.trim() || !duration || duration <= 0) return;
    onSubmit({
      courseId: courseId || null,
      skillId: skillId || null,
      title: title.trim(),
      durationMinutes: duration,
      date,
      notes: notes.trim(),
    });
  };

  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 animate-fade-in space-y-4">
      <h3 className="font-headline text-sm font-semibold text-on-surface uppercase tracking-wide">
        <span className="text-primary">&gt;</span> LOG_STUDY_SESSION
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; SESSION_TITLE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="e.g. Chapter 3 review"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; DURATION (minutes)
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0"
              placeholder="30"
            />
          </div>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; COURSE (optional)
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-surface-container-lowest">None</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface-container-lowest">
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; SKILL (optional)
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 text-on-surface text-sm font-body focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-surface-container-lowest">None</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id} className="bg-surface-container-lowest">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
            &gt; DATE
          </label>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 flex items-center gap-2 focus-within:border-primary/50 transition-colors">
            <span className="text-primary font-mono text-sm">&gt;</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-on-surface text-sm font-body border-none p-0 focus:ring-0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant block mb-2">
          &gt; NOTES (optional)
        </label>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-sm px-3 py-2.5 focus-within:border-primary/50 transition-colors">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-transparent text-on-surface text-sm font-body placeholder:text-outline border-none p-0 focus:ring-0 resize-none"
            rows={2}
            placeholder="What did you cover?"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !durationMinutes}
          className="px-5 py-2.5 bg-scanline-gradient text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          LOG SESSION &#8629;
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
