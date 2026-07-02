interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'warning';
}

export default function StatCard({ label, value, unit, subtitle, icon, variant = 'default' }: StatCardProps) {
  const borderColor = {
    default: 'border-outline-variant/15',
    primary: 'border-primary/30',
    secondary: 'border-secondary/30',
    warning: 'border-tertiary/30',
  }[variant];

  const glowColor = {
    default: '',
    primary: 'hover:shadow-primary/10',
    secondary: 'hover:shadow-secondary/10',
    warning: 'hover:shadow-tertiary/10',
  }[variant];

  return (
    <div className={`bg-surface-container-low rounded-md p-5 border ${borderColor} relative overflow-hidden group hover:translate-y-[-1px] hover:shadow-lg ${glowColor} transition-all duration-200`}>
      <div className="flex justify-between items-start mb-3">
        <span className="font-label text-xs text-on-surface-variant/80">
          {label}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors duration-300">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-headline text-3xl font-bold text-on-surface tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-label text-sm text-on-surface-variant">
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <span className="font-body text-xs text-on-surface-variant mt-2 block">{subtitle}</span>
      )}
    </div>
  );
}
