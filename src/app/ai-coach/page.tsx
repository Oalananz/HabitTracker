'use client';

const EXAMPLE_PROMPTS = [
  'What should I focus on today?',
  'Why am I not consistent?',
  'Help me plan next week.',
];

export default function AiCoachPage() {
  return (
    <div className="space-y-8 animate-page-enter max-w-2xl">
      <header>
        <h1 className="font-headline text-3xl md:text-5xl font-bold tracking-tighter text-on-surface mb-2">
          <span className="text-primary">&gt;</span> AI Coach
        </h1>
        <p className="font-body text-on-surface-variant">
          Coming soon: ask for help with your goals, habits, life areas, and weekly reviews.
        </p>
      </header>

      <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-5 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">EXAMPLE PROMPTS</div>
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            disabled
            className="w-full text-left bg-surface-container-lowest border border-outline-variant/15 rounded-sm px-4 py-3 font-body text-sm text-on-surface-variant opacity-60 cursor-not-allowed flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">chat_bubble</span>
            {p}
          </button>
        ))}
        <div className="flex items-center gap-2 pt-2">
          <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
          <span className="font-mono text-[11px] text-on-surface-variant">
            Chat is disabled until it ships with its own privacy filters and backend route.
          </span>
        </div>
      </div>
    </div>
  );
}
