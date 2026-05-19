import React from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium transition-all active:scale-95 rounded-xl flex items-center justify-center gap-2',
        variant === 'primary' && 'bg-primary-600 hover:bg-primary-700 text-white',
        variant === 'secondary' && 'bg-slate-800 hover:bg-slate-700 text-white',
        variant === 'ghost' && 'hover:bg-slate-800 text-white',
        variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3',
        size === 'lg' && 'px-8 py-4 text-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
