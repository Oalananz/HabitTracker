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
      <div className={`relative ${iconSizes[size]}`}>
        <img
          src="/logo.png"
          alt="HabitTerminal Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Text */}
      <div className={`font-mono font-bold tracking-tight text-primary ${textSizes[size]}`}>
        HabitTerminal
      </div>
    </div>
  );
}
