'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'stat' | 'list-item' | 'circle';
  count?: number;
}

function SkeletonBase({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`animate-shimmer rounded-md ${className}`} style={style} />
  );
}

export function SkeletonText({ className = '', count = 1 }: { className?: string; count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase
          key={i}
          className={`h-3 ${i === count - 1 ? 'w-3/4' : 'w-full'} ${className}`}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-surface-container-low rounded-md p-5 border border-outline-variant/15 space-y-3">
      <SkeletonBase className="h-2.5 w-24" />
      <SkeletonBase className="h-10 w-20" />
      <SkeletonBase className="h-2.5 w-32" />
    </div>
  );
}

export function SkeletonTaskItem() {
  return (
    <div className="bg-surface-container-low rounded-md p-4 flex gap-4 items-start">
      <SkeletonBase className="w-5 h-5 flex-shrink-0 rounded-[2px]" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
      <SkeletonBase className="h-5 w-16 flex-shrink-0 rounded-[2px]" />
    </div>
  );
}

export function SkeletonHeatmap() {
  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 space-y-3">
      <SkeletonBase className="h-3 w-40" />
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 52 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, j) => (
              <SkeletonBase key={j} className="w-3 h-3 rounded-[2px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface-container-low rounded-md border border-outline-variant/15 p-5 space-y-3">
      <SkeletonBase className="h-3 w-32" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SkeletonPulse({ className = '', variant = 'text', count = 1 }: SkeletonProps) {
  switch (variant) {
    case 'stat':
      return <>{Array.from({ length: count }).map((_, i) => <SkeletonStatCard key={i} />)}</>;
    case 'list-item':
      return <>{Array.from({ length: count }).map((_, i) => <SkeletonTaskItem key={i} />)}</>;
    case 'card':
      return <SkeletonBase className={`h-32 ${className}`} />;
    case 'circle':
      return <SkeletonBase className={`rounded-full ${className}`} />;
    case 'text':
    default:
      return <SkeletonText className={className} count={count} />;
  }
}
