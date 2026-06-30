'use client';

import { useState } from 'react';
import { useToast } from '@/store/useToast';
import type { WeeklyReviewInput, WeeklyReviewOutput } from '@/lib/ai/schemas';
import { AiGenerateButton, AiLoadingState, AiErrorState, AiResultCard } from './AiPrimitives';
import AiWeeklyReviewPreview from './AiWeeklyReviewPreview';

export default function AiWeeklyReview({
  buildInput, onApply,
}: {
  buildInput: () => WeeklyReviewInput;
  onApply: (review: WeeklyReviewOutput) => void;
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<WeeklyReviewOutput | null>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const input = buildInput();
      const res = await fetch('/api/ai/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'AI request failed.'); return; }
      setReview(data.review);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!review) return;
    const text = [
      `Weekly summary (score ${review.score}/10):`, review.summary, '',
      'Wins:', ...review.wins.map((w) => `- ${w}`), '',
      'Problems:', ...review.problems.map((p) => `- ${p}`), '',
      'Next week priorities:', ...review.nextWeekPriorities.map((p) => `- ${p.title}: ${p.reason}`),
      '', `Theme: ${review.suggestedWeeklyTheme}`,
    ].join('\n');
    try { await navigator.clipboard.writeText(text); addToast('Review copied', 'success', 1500); } catch { /* ignore */ }
  };

  const save = () => {
    if (!review) return;
    setSaving(true);
    try {
      const input = buildInput();
      const now = new Date().toISOString();
      localStorage.setItem(
        `aiWeeklyReview:${input.weekStartDate}`,
        JSON.stringify({ id: `aireview_${input.weekStartDate}`, weekStartDate: input.weekStartDate, weekEndDate: input.weekEndDate, ...review, createdAt: now, updatedAt: now }),
      );
      addToast('AI review saved', 'success', 2000);
    } catch { addToast('Could not save review', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {!review && !loading && (
        <AiGenerateButton label="Generate AI Weekly Review" loadingLabel="Reviewing your week…" loading={loading} onClick={generate} />
      )}
      {loading && <AiLoadingState message="Reviewing your week…" />}
      {error && !loading && <AiErrorState message={error} onRetry={generate} />}
      {review && !loading && (
        <AiResultCard
          title="AI Weekly Review"
          onSave={save} saving={saving} saveLabel="Save as AI Review"
          onCopy={copy}
          onRegenerate={generate}
          onDismiss={() => setReview(null)}
        >
          <button
            onClick={() => onApply(review)}
            className="mb-4 px-4 py-2 bg-scanline-gradient text-on-primary font-label text-[10px] uppercase tracking-wider font-bold rounded-sm hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Apply to Review form
          </button>
          <AiWeeklyReviewPreview review={review} />
        </AiResultCard>
      )}
    </div>
  );
}
