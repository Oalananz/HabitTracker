'use client';

import type { ReactNode } from 'react';

// ── AiGenerateButton ────────────────────────────────────────────────
export function AiGenerateButton({
  label, loadingLabel, loading, disabled, onClick, icon = 'auto_awesome', className = '',
}: {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-sm font-headline font-semibold text-sm transition-all disabled:opacity-50 border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 ${className}`}
    >
      <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
        {loading ? 'progress_activity' : icon}
      </span>
      {loading ? (loadingLabel || 'Generating…') : label}
    </button>
  );
}

// ── AiLoadingState ──────────────────────────────────────────────────
export function AiLoadingState({ message = 'Generating…' }: { message?: string }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/15 rounded-md p-6 flex items-center gap-3 animate-fade-in">
      <span className="material-symbols-outlined text-[20px] text-primary animate-spin">progress_activity</span>
      <span className="font-mono text-sm text-on-surface-variant">{message}</span>
      <span className="animate-blink text-primary font-mono">▊</span>
    </div>
  );
}

// ── AiErrorState ────────────────────────────────────────────────────
export function AiErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-error-container/10 border border-error/25 rounded-md p-4 flex items-start gap-3 animate-fade-in">
      <span className="material-symbols-outlined text-[20px] text-error flex-shrink-0">error</span>
      <div className="flex-1 min-w-0">
        <div className="font-headline text-sm font-bold text-error mb-0.5">AI error</div>
        <p className="font-mono text-xs text-on-surface-variant break-words">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="px-3 py-1.5 font-label text-xs text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

// ── AiResultCard ────────────────────────────────────────────────────
// Wrapper providing the AI header + the standard action row. Only buttons
// whose handlers are provided are rendered.
export function AiResultCard({
  title, children, onSave, onCopy, onRegenerate, onDismiss, saveLabel = 'Save', saving, regenerating,
}: {
  title: string;
  children: ReactNode;
  onSave?: () => void;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onDismiss?: () => void;
  saveLabel?: string;
  saving?: boolean;
  regenerating?: boolean;
}) {
  return (
    <div className="bg-surface-container-low border border-primary/25 rounded-md overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/15 bg-surface-container-lowest/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
          <span className="font-headline text-sm font-semibold text-on-surface">{title}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] bg-primary/15 text-primary">AI</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-on-surface-variant hover:text-on-surface transition-colors p-1" title="Dismiss">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <div className="p-5">{children}</div>

      {(onSave || onCopy || onRegenerate) && (
        <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-outline-variant/10 bg-surface-container-lowest/30">
          {onSave && (
            <button onClick={onSave} disabled={saving} className="px-4 py-1.5 bg-scanline-gradient text-on-primary font-label text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Saving…' : saveLabel}
            </button>
          )}
          {onCopy && (
            <button onClick={onCopy} className="px-4 py-1.5 border border-outline-variant/20 text-on-surface-variant font-label text-xs rounded-sm hover:text-on-surface transition-colors">
              Copy
            </button>
          )}
          {onRegenerate && (
            <button onClick={onRegenerate} disabled={regenerating} className="px-4 py-1.5 border border-outline-variant/20 text-on-surface-variant font-label text-xs rounded-sm hover:text-primary transition-colors disabled:opacity-50">
              {regenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Subtle section header reused inside previews.
export function AiSection({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/80 mb-2 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[13px] text-primary">{icon}</span>{label}
      </div>
      {children}
    </div>
  );
}
