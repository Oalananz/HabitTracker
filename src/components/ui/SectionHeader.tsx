interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, rightContent }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-end border-b border-outline-variant/10 pb-2.5 mb-4">
      <div>
        <h2 className="font-headline text-base md:text-lg font-semibold text-on-surface">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
        )}
      </div>
      {rightContent && (
        <div className="font-label text-xs text-on-surface-variant/70">
          {rightContent}
        </div>
      )}
    </div>
  );
}
