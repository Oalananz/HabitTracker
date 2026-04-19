interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, rightContent }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2 mb-4">
      <div>
        <h2 className="font-headline text-lg font-semibold text-on-surface uppercase tracking-wide">
          <span className="text-primary">&gt;</span> {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightContent && (
        <div className="font-label text-xs text-on-surface-variant uppercase">
          {rightContent}
        </div>
      )}
    </div>
  );
}
