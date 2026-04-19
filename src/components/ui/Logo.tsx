import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'vertical';
}

export default function Logo({ className = '', size = 'md', layout = 'vertical' }: LogoProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  return (
    <div className={`flex ${layout === 'vertical' ? 'flex-col items-center gap-4' : 'flex-row items-center gap-3'} ${className}`}>
      {/* Icon */}
      <svg
        className={`${iconSizes[size]} text-primary`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Terminal Window Box */}
        <path
          d="M 65 25 L 25 25 C 19.477 25 15 29.477 15 35 L 15 75 C 15 80.523 19.477 85 25 85 L 75 85 C 80.523 85 85 80.523 85 75 L 85 45"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Terminal '>' */}
        <path
          d="M 22 45 L 36 55 L 22 65"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Terminal '_' */}
        <line
          x1="65" y1="75" x2="80" y2="75"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Diagonal Ribbon */}
        <g transform="translate(50, 60) rotate(-45)">
          <path 
            d="M -16,-12 L 16,-12 L 16,12 L -16,12 Z M -8,-6 L -14,0 L -8,6 L -2,0 Z M 8,-6 L 2,0 L 8,6 L 14,0 Z" 
            fill="currentColor" 
            fillRule="evenodd" 
          />
        </g>

        {/* Blocky Checkmark */}
        <path
          d="M 55 45 L 70 60 L 95 20"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>

      {/* Text */}
      <div className={`font-mono font-bold tracking-tight text-primary ${textSizes[size]}`}>
        HabitTerminal
      </div>
    </div>
  );
}
