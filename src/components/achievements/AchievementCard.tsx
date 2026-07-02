'use client';

const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string; badgeBg: string }> = {
  COMMON:    { border: 'border-outline-variant/20', bg: 'bg-surface-container-low',  text: 'text-on-surface',        badge: 'text-on-surface-variant', badgeBg: 'bg-surface-container-highest' },
  UNCOMMON:  { border: 'border-primary/30',         bg: 'bg-primary/5',              text: 'text-primary',           badge: 'text-primary',            badgeBg: 'bg-primary/15' },
  RARE:      { border: 'border-secondary/40',       bg: 'bg-secondary/5',            text: 'text-secondary',         badge: 'text-secondary',          badgeBg: 'bg-secondary/15' },
  EPIC:      { border: 'border-tertiary/50',        bg: 'bg-tertiary/5',             text: 'text-tertiary',          badge: 'text-tertiary',           badgeBg: 'bg-tertiary/15' },
  LEGENDARY: { border: 'border-[#fabc45]/50',      bg: 'bg-[#fabc45]/5',            text: 'text-[#fabc45]',         badge: 'text-[#fabc45]',          badgeBg: 'bg-[#fabc45]/15' },
};

interface AchievementCardProps {
  achievementKey: string;
  name: string;
  desc: string;
  cat: string;
  rarity: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress?: { current: number; target: number } | null;
  compact?: boolean;
}

export default function AchievementCard({
  name, desc, rarity, unlocked, unlockedAt, progress, compact,
}: AchievementCardProps) {
  const s = RARITY_STYLES[rarity] || RARITY_STYLES.COMMON;

  if (compact) {
    return (
      <div className={`border ${s.border} ${s.bg} rounded-sm p-2 flex items-center gap-2 ${!unlocked ? 'opacity-50 grayscale' : ''}`}>
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: unlocked ? "'FILL' 1" : "'FILL' 0", color: unlocked ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}
        >
          {unlocked ? 'workspace_premium' : 'lock'}
        </span>
        <div className="min-w-0">
          <div className={`font-headline text-xs font-semibold truncate ${unlocked ? s.text : 'text-on-surface-variant'}`}>{name}</div>
          <div className="text-[11px] text-on-surface-variant/70 truncate">{desc}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border ${s.border} ${s.bg} rounded-md p-4 relative overflow-hidden transition-all duration-200 ${!unlocked ? 'opacity-60' : 'hover:shadow-lg hover:shadow-primary/5'}`}>
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 ${s.badgeBg}`}>
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: unlocked ? "'FILL' 1" : "'FILL' 0",
                color: unlocked ? 'var(--color-primary)' : 'var(--color-outline-variant)',
              }}
            >
              {unlocked ? 'workspace_premium' : 'lock'}
            </span>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`font-headline text-sm font-semibold ${unlocked ? s.text : 'text-on-surface-variant'}`}>
                {name}
              </span>
              <span className={`px-1.5 py-0.5 rounded-[2px] font-label text-[11px] capitalize ${s.badgeBg} ${s.text}`}>
                {rarity.toLowerCase()}
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant">{desc}</p>

            {/* Progress bar for locked */}
            {!unlocked && progress && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[11px] text-on-surface-variant/70">Progress</span>
                  <span className="text-[11px] text-on-surface-variant/70">{progress.current}/{progress.target}</span>
                </div>
                <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-outline-variant rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((progress.current / progress.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {unlocked && unlockedAt && (
              <div className="mt-1.5 text-[11px] text-on-surface-variant/60">
                Unlocked {new Date(unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Unlocked badge */}
        {unlocked && (
          <span className={`flex-shrink-0 text-xs font-label px-2 py-1 rounded-[2px] ${s.badgeBg} ${s.text}`}>
            ✓ Unlocked
          </span>
        )}
      </div>
    </div>
  );
}
