'use client';

import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';

const FEATURES: { icon: string; title: string; description: string }[] = [
  {
    icon: 'wb_sunny',
    title: 'Daily check-ins',
    description: 'A quick conversation each morning to set priorities and each evening to reflect on how the day went.',
  },
  {
    icon: 'flag',
    title: 'Goal coaching',
    description: 'Talk through a goal that feels stuck, get it broken into a realistic plan, and stay accountable to it.',
  },
  {
    icon: 'healing',
    title: 'Recovery support',
    description: 'A judgment-free space to process a setback and get back on track without losing your streak data.',
  },
  {
    icon: 'insights',
    title: 'Weekly patterns',
    description: 'Ask what\'s actually working across your habits, tasks, and life areas — not just raw numbers.',
  },
];

export default function AiCoachPage() {
  return (
    <div className="space-y-8 animate-page-enter max-w-3xl">
      <PageHeader
        title="AI Coach"
        description="Coming soon — a conversational coach for your goals, habits, life areas, and weekly reviews."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="space-y-2">
            <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-primary">{f.icon}</span>
            </div>
            <h3 className="font-headline text-sm font-semibold text-on-surface">{f.title}</h3>
            <p className="text-sm text-on-surface-variant">{f.description}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
        <span className="material-symbols-outlined text-[16px]">lock</span>
        Chat is disabled until it ships with its own privacy filters and backend route.
      </div>
    </div>
  );
}
