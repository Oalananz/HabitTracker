'use client';

import type { DailyPlannerOutput } from '@/lib/ai/schemas';
import { lifeAreaLabelToId } from '@/lib/lifeAreas';
import LifeAreaBadge from '@/components/ui/LifeAreaBadge';
import { AiSection } from './AiPrimitives';

export default function AiPlanPreview({ plan }: { plan: DailyPlannerOutput }) {
  return (
    <div className="space-y-5">
      {plan.summary && <p className="font-body text-sm text-on-surface">{plan.summary}</p>}

      {plan.topPriorities.length > 0 && (
        <AiSection icon="priority_high" label="TOP PRIORITIES">
          <ol className="space-y-2">
            {plan.topPriorities.map((p, i) => (
              <li key={i} className="bg-surface-container-lowest rounded-sm p-3 border border-outline-variant/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline text-xs font-bold text-primary">{i + 1}.</span>
                  <span className="font-headline text-sm font-bold text-on-surface">{p.title}</span>
                  <LifeAreaBadge lifeArea={lifeAreaLabelToId(p.lifeArea)} />
                </div>
                <p className="font-body text-xs text-on-surface-variant mt-1">{p.reason}</p>
              </li>
            ))}
          </ol>
        </AiSection>
      )}

      {plan.scheduleBlocks.length > 0 && (
        <AiSection icon="schedule" label="SCHEDULE">
          <div className="space-y-2">
            {plan.scheduleBlocks.map((b, i) => (
              <div key={i} className="flex gap-3 bg-surface-container-lowest rounded-sm p-3 border border-outline-variant/10">
                <div className="font-mono text-[10px] text-primary uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">{b.label}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline text-sm font-bold text-on-surface">{b.title}</span>
                    <span className="font-mono text-[9px] text-on-surface-variant">{b.durationMinutes}m</span>
                    <LifeAreaBadge lifeArea={lifeAreaLabelToId(b.lifeArea)} />
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </AiSection>
      )}

      {plan.habitFocus.length > 0 && (
        <AiSection icon="cached" label="HABIT FOCUS">
          <div className="space-y-1.5">
            {plan.habitFocus.map((h, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap font-body text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-primary">arrow_right</span>
                <span className="font-bold text-on-surface">{h.title}</span>
                <LifeAreaBadge lifeArea={lifeAreaLabelToId(h.lifeArea)} />
                <span className="text-xs">— {h.suggestion}</span>
              </div>
            ))}
          </div>
        </AiSection>
      )}

      {plan.warnings.length > 0 && (
        <div className="bg-tertiary/5 border border-tertiary/20 rounded-sm p-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-tertiary mb-1">⚠ WARNINGS</div>
          <ul className="space-y-0.5">
            {plan.warnings.map((w, i) => (
              <li key={i} className="font-body text-xs text-on-surface-variant">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.eveningReviewQuestions.length > 0 && (
        <AiSection icon="bedtime" label="EVENING REVIEW">
          <ul className="space-y-0.5">
            {plan.eveningReviewQuestions.map((q, i) => (
              <li key={i} className="font-body text-xs text-on-surface-variant">— {q}</li>
            ))}
          </ul>
        </AiSection>
      )}
    </div>
  );
}
