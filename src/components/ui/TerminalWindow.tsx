interface TerminalWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  dots?: string[];
}

const defaultDots = ['bg-error/60', 'bg-tertiary/60', 'bg-primary/60'];

export default function TerminalWindow({
  title,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  dots = defaultDots,
}: TerminalWindowProps) {
  return (
    <div className={`rounded-md overflow-hidden flex flex-col ${className}`}>
      <div className={`bg-surface-container-low px-4 py-2.5 flex items-center gap-3 border-b border-outline-variant/15 ${headerClassName}`}>
        <div className="flex gap-1.5">
          {dots.slice(0, 3).map((dotClass, index) => (
            <div key={index} className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
          ))}
        </div>
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className={`bg-surface-container-lowest border border-outline-variant/15 border-t-0 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}
