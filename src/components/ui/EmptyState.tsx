interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = 'inbox' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="material-symbols-outlined text-[48px] text-outline-variant/50 mb-4">
        {icon}
      </span>
      <h3 className="font-headline text-lg font-semibold text-on-surface-variant mb-1">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-outline max-w-xs">{description}</p>
      )}
    </div>
  );
}
