import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift the border/background slightly on hover — use for clickable cards */
  hover?: boolean;
  /** Tint the border with the primary color — use for selected/active cards */
  active?: boolean;
}

export default function Card({ hover, active, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface-container-low border rounded-md p-5 md:p-6 transition-colors duration-150 ${
        active ? 'border-primary/40' : 'border-outline-variant/15'
      } ${hover ? 'hover:border-outline-variant/30 hover:bg-surface-container cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
