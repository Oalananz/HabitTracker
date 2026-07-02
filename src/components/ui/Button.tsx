'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-scanline-gradient text-on-primary hover:opacity-90 font-bold',
  secondary: 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/20',
  tertiary: 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
  danger: 'border border-error/40 bg-error/10 text-error hover:bg-error/20',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', icon, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-sm text-xs font-label uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      {children}
    </button>
  );
});

export default Button;
