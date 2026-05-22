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
    <div className={`glass rounded-md p-5 border ${borderColor} relative overflow-hidden group hover:translate-y-[-2px] hover:shadow-xl ${glowColor} transition-all duration-300 hover-border-glow`}>
      {variant === 'primary' && (
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
      )}
      {variant === 'secondary' && (
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500" />
      )}
      {variant === 'warning' && (
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-tertiary/5 rounded-full blur-2xl group-hover:bg-tertiary/10 transition-colors duration-500" />
      )}
      <div className="flex justify-between items-start mb-3">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
          &gt; {label}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors duration-300">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-headline text-4xl font-black text-on-surface tracking-tighter animate-count" style={{ letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && (
          <span className="font-label text-sm text-on-surface-variant uppercase">
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
