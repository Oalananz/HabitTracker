import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** small muted mono label above the title, e.g. "system/today" */
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant/50 mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface">
          {title}
        </h1>
        {description && (
          <p className="font-body text-sm text-on-surface-variant mt-1.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </header>
  );
}
