'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useConfirm } from '@/components/ui/useConfirm';
import { useToast } from '@/store/useToast';
import type { LandingContent, LandingItem } from '@/lib/landingContent';

const MAX_ITEMS = 6;

interface LandingRecord {
  content: LandingContent;
  customized: boolean;
  updatedAt: string | null;
}

// ─── Small field helpers ─────────────────────────────────────────────

function Field({
  id, label, value, max, multiline, onChange,
}: {
  id: string; label: string; value: string; max: number; multiline?: boolean; onChange: (v: string) => void;
}) {
  const Control = multiline ? Textarea : Input;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="text-xs text-on-surface-variant/80">{label}</label>
        <span className={`font-mono text-[10px] ${value.length > max ? 'text-error' : 'text-outline'}`}>{value.length}/{max}</span>
      </div>
      <Control id={id} value={value} maxLength={max} rows={multiline ? 3 : undefined} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span id={id} className="text-sm text-on-surface">{label}</span>
      <button type="button" aria-labelledby={id} aria-pressed={checked} onClick={() => onChange(!checked)} className={`toggle-switch ${checked ? 'active' : ''}`} />
    </div>
  );
}

function ItemsEditor({
  idPrefix, noun, items, onChange,
}: {
  idPrefix: string; noun: string; items: LandingItem[]; onChange: (items: LandingItem[]) => void;
}) {
  const update = (i: number, patch: Partial<LandingItem>) => onChange(items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const iconButton = 'w-7 h-7 rounded-sm text-outline hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-sm border border-outline-variant/20 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline">{noun} {i + 1}</span>
            <div className="flex items-center gap-0.5">
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${noun} ${i + 1} up`} title="Move up">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
              <button type="button" className={iconButton} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${noun} ${i + 1} down`} title="Move down">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </button>
              <button type="button" className={`${iconButton} hover:text-error hover:bg-error/10`} onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label={`Delete ${noun} ${i + 1}`} title="Delete">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
          <Field id={`${idPrefix}-${i}-title`} label="Title" max={60} value={item.title} onChange={(v) => update(i, { title: v })} />
          <Field id={`${idPrefix}-${i}-detail`} label="Detail" max={240} multiline value={item.detail} onChange={(v) => update(i, { detail: v })} />
        </div>
      ))}
      <Button type="button" variant="secondary" icon="add" disabled={items.length >= MAX_ITEMS} onClick={() => onChange([...items, { title: '', detail: '' }])}>
        Add {noun} {items.length >= MAX_ITEMS ? `(max ${MAX_ITEMS})` : ''}
      </Button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function LandingEditorPage() {
  const { addToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'error' | 'ready'>('loading');
  const [record, setRecord] = useState<LandingRecord | null>(null);
  const [draft, setDraft] = useState<LandingContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/landing')
      .then(async (res) => {
        if (!active) return;
        if (res.status === 403) return setStatus('forbidden');
        if (!res.ok) return setStatus('error');
        const data: LandingRecord = await res.json();
        setRecord(data);
        setDraft(data.content);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  const dirty = !!draft && !!record && JSON.stringify(draft) !== JSON.stringify(record.content);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (status === 'loading') {
    return <div className="py-16 text-center font-mono text-sm text-on-surface-variant">Loading landing page copy…</div>;
  }
  if (status === 'forbidden') {
    return (
      <div className="space-y-6">
        <PageHeader title="Landing page" eyebrow="admin/landing" />
        <Card className="max-w-lg"><p className="text-sm text-on-surface-variant">This page is for site admins. Admins are set with <code className="font-mono text-on-surface">ADMIN_EMAILS</code> on the server.</p></Card>
      </div>
    );
  }
  if (status === 'error' || !draft || !record) {
    return <div className="py-16 text-center text-sm text-error">Could not load the landing page copy. Reload to try again.</div>;
  }

  // Typed setter for one section.
  const set = <K extends keyof LandingContent>(section: K, patch: Partial<LandingContent[K]>) =>
    setDraft((d) => (d ? { ...d, [section]: { ...d[section], ...patch } } : d));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/landing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setRecord(data);
      setDraft(data.content);
      addToast('Landing page saved. It updates on the next visit.', 'success', 3000);
    } catch (err) {
      addToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!(await confirm({ title: 'Reset landing page', message: 'Replace all custom copy with the built-in defaults? This can’t be undone.', confirmLabel: 'Reset', danger: true }))) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/landing', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset');
      setRecord(data);
      setDraft(data.content);
      addToast('Landing page reset to defaults', 'success', 2500);
    } catch (err) {
      addToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const { hero, cta, scoring, features, pillars, closing } = draft;

  return (
    <div className="space-y-6 animate-page-enter pb-24">
      {ConfirmDialog}
      <PageHeader
        title="Landing page"
        eyebrow="admin/landing"
        description="Edit the public landing page's copy. The scoring rules and product previews stay as they are."
      />

      <p className="text-xs text-on-surface-variant">
        {record.customized && record.updatedAt ? `Last saved ${new Date(record.updatedAt).toLocaleString()}` : 'Showing the built-in default copy.'}{' '}
        <a href="/?preview=1" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">Open the landing page</a>
      </p>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-on-surface">Hero</h2>
          <Field id="hero-eyebrow" label="Label above the headline" max={40} value={hero.eyebrow} onChange={(v) => set('hero', { eyebrow: v })} />
          <Field id="hero-line1" label="Headline, line 1" max={60} value={hero.titleLine1} onChange={(v) => set('hero', { titleLine1: v })} />
          <Field id="hero-line2" label="Headline, line 2 (green)" max={60} value={hero.titleLine2} onChange={(v) => set('hero', { titleLine2: v })} />
          <Field id="hero-subtitle" label="Description" max={300} multiline value={hero.subtitle} onChange={(v) => set('hero', { subtitle: v })} />
          <Field id="hero-meta" label="Small print under the buttons" max={120} value={hero.meta} onChange={(v) => set('hero', { meta: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field id="cta-primary" label="Main button" max={30} value={cta.primary} onChange={(v) => set('cta', { primary: v })} />
            <Field id="cta-secondary" label="Second button" max={20} value={cta.secondary} onChange={(v) => set('cta', { secondary: v })} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-on-surface">How scoring works</h2>
          <Toggle id="scoring-visible" label="Show this section" checked={scoring.visible} onChange={(v) => set('scoring', { visible: v })} />
          <Field id="scoring-eyebrow" label="Label" max={40} value={scoring.eyebrow} onChange={(v) => set('scoring', { eyebrow: v })} />
          <Field id="scoring-title" label="Heading" max={80} value={scoring.title} onChange={(v) => set('scoring', { title: v })} />
          <Field id="scoring-statement" label="Statement" max={240} multiline value={scoring.statement} onChange={(v) => set('scoring', { statement: v })} />
          <p className="text-xs text-outline">The seven scoring rules come from the app itself and aren’t editable here.</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-on-surface">Features</h2>
          <Toggle id="features-visible" label="Show this section" checked={features.visible} onChange={(v) => set('features', { visible: v })} />
          <Field id="features-eyebrow" label="Label" max={40} value={features.eyebrow} onChange={(v) => set('features', { eyebrow: v })} />
          <Field id="features-title" label="Heading" max={80} value={features.title} onChange={(v) => set('features', { title: v })} />
          <Field id="features-intro" label="Intro" max={300} multiline value={features.intro} onChange={(v) => set('features', { intro: v })} />
          <p className="text-xs text-outline">The planner, recovery, consistency and achievement previews mirror the app and aren’t editable here.</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-on-surface">Why HabitTerminal</h2>
          <Toggle id="pillars-visible" label="Show this section" checked={pillars.visible} onChange={(v) => set('pillars', { visible: v })} />
          <Field id="pillars-eyebrow" label="Label" max={40} value={pillars.eyebrow} onChange={(v) => set('pillars', { eyebrow: v })} />
          <Field id="pillars-title" label="Heading" max={80} value={pillars.title} onChange={(v) => set('pillars', { title: v })} />
          <h3 className="text-xs uppercase tracking-widest text-on-surface-variant pt-2">Pillars</h3>
          <ItemsEditor idPrefix="pillar" noun="pillar" items={pillars.items} onChange={(items) => set('pillars', { items })} />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-on-surface">Closing</h2>
          <Toggle id="closing-visible" label="Show this section" checked={closing.visible} onChange={(v) => set('closing', { visible: v })} />
          <Field id="closing-eyebrow" label="Label" max={40} value={closing.eyebrow} onChange={(v) => set('closing', { eyebrow: v })} />
          <Field id="closing-title" label="Heading" max={80} value={closing.title} onChange={(v) => set('closing', { title: v })} />
          <Field id="closing-subtitle" label="Line under the heading" max={240} value={closing.subtitle} onChange={(v) => set('closing', { subtitle: v })} />
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 md:left-auto md:right-0 md:w-[calc(100%-16rem)] z-30 border-t border-outline-variant/20 bg-background/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 px-4 sm:px-8 py-3">
          <span className={`text-xs ${dirty ? 'text-tertiary' : 'text-outline'}`}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="ghost" disabled={saving || !record.customized} onClick={reset}>Reset to defaults</Button>
            <Button type="button" variant="secondary" disabled={saving || !dirty} onClick={() => setDraft(record.content)}>Discard changes</Button>
            <Button type="button" variant="primary" disabled={saving || !dirty} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
