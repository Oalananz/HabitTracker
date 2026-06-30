'use client';

import type { WeeklyReviewOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId, lifeAreaColor } from '@/lib/lifeAreas';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import { AiSection } from './AiPrimitives';

function List({ items, marker = '•' }: { items: string[]; marker?: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((s, i) => (
        <li key={i} className="font-body text-xs text-on-surface-variant">{marker} {s}</li>
      ))}
    </ul>
  );
}

function AreaCard({ label, area, reason, tone }: { label: string; area?: string; reason?: string; tone: string }) {
  if (!area) return null;
  const color = lifeAreaColor(lifeAreaLabelToId(area));
  return (
    <div className="bg-surface-container-lowest rounded-sm p-3 border" style={{ borderColor: `${color}33` }}>
      <div className="font-mono text-[9px] uppercase tracking-widest" style={{ color: tone }}>{label}</div>
      <div className="font-headline text-sm font-bold text-on-surface mt-0.5">{area}</div>
      {reason && <p className="font-body text-[11px] text-on-surface-variant mt-1">{reason}</p>}
    </div>
  );
}

export default function AiWeeklyReviewPreview({ review }: { review: WeeklyReviewOutput }) {
  const scoreColor = review.score >= 8 ? 'text-primary' : review.score >= 4 ? 'text-tertiary' : 'text-error';
  return (
    <div className="space-y-5">
      {/* Summary + score */}
      <div className="flex items-start gap-4">
        <div className="flex-1">{review.summary && <p className="font-body text-sm text-on-surface">{review.summary}</p>}</div>
        <div className="text-right flex-shrink-0">
          <div className={`font-headline text-4xl font-black tracking-tighter ${scoreColor}`}>{review.score}<span className="text-lg text-on-surface-variant/40">/10</span></div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">SCORE</div>
        </div>
      </div>

      {/* Best / weakest */}
      {(review.bestLifeArea || review.weakestLifeArea) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AreaCard label="BEST AREA" area={review.bestLifeArea?.lifeArea} reason={review.bestLifeArea?.reason} tone="#6cdd81" />
          <AreaCard label="NEEDS ATTENTION" area={review.weakestLifeArea?.lifeArea} reason={review.weakestLifeArea?.reason} tone="#ffb4ab" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {review.wins.length > 0 && <AiSection icon="trophy" label="WINS"><List items={review.wins} marker="✓" /></AiSection>}
        {review.problems.length > 0 && <AiSection icon="report" label="PROBLEMS"><List items={review.problems} marker="✗" /></AiSection>}
      </div>

      {review.patterns.length > 0 && (
        <AiSection icon="insights" label="PATTERNS"><List items={review.patterns} /></AiSection>
      )}

      {review.recommendations.length > 0 && (
        <AiSection icon="lightbulb" label="RECOMMENDATIONS">
          <div className="space-y-2">
            {review.recommendations.map((r, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-sm p-3 border border-outline-variant/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline text-sm font-bold text-on-surface">{r.title}</span>
                  <LifeAreaBadge lifeArea={lifeAreaLabelToId(r.lifeArea)} />
                </div>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">{r.description}</p>
              </div>
            ))}
          </div>
        </AiSection>
      )}

      {review.nextWeekPriorities.length > 0 && (
        <AiSection icon="east" label="NEXT WEEK PRIORITIES">
          <ol className="space-y-1.5">
            {review.nextWeekPriorities.map((p, i) => (
              <li key={i} className="flex items-center gap-2 flex-wrap">
                <span className="font-headline text-xs font-bold text-primary">{i + 1}.</span>
                <span className="font-body text-sm text-on-surface">{p.title}</span>
                <LifeAreaBadge lifeArea={lifeAreaLabelToId(p.lifeArea)} />
                <span className="font-body text-[11px] text-on-surface-variant">— {p.reason}</span>
              </li>
            ))}
          </ol>
        </AiSection>
      )}

      {review.suggestedWeeklyTheme && (
        <div className="bg-primary/5 border border-primary/20 rounded-sm p-3 text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">SUGGESTED THEME</div>
          <div className="font-headline text-base font-bold text-primary">{review.suggestedWeeklyTheme}</div>
        </div>
      )}

      {review.reviewQuestions.length > 0 && (
        <AiSection icon="quiz" label="REVIEW QUESTIONS"><List items={review.reviewQuestions} marker="—" /></AiSection>
      )}
    </div>
  );
}
