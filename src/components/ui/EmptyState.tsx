'use client';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Decorative background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 bg-primary/3 rounded-full blur-3xl" />
      </div>
      {icon && (
        <span className="material-symbols-outlined text-[56px] text-on-surface-variant/25 mb-4 animate-float">
          {icon}
        </span>
      )}
      <h3 className="font-headline text-lg font-bold text-on-surface-variant mb-1">{title}</h3>
      <p className="font-body text-sm text-outline max-w-xs">{description}</p>
    </div>
  );
}
