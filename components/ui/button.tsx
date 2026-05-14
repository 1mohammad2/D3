'use client';

import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const buttonStyles = {
  default: 'bg-orange-500 text-slate-950 hover:bg-orange-400',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-100 hover:bg-white/10'
};

const sizeStyles = {
  default: 'h-12 px-6',
  sm: 'h-10 px-4 text-sm',
  lg: 'h-14 px-8 text-base'
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        buttonStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
