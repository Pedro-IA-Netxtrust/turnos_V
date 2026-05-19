import React from 'react';
import { cn } from '../../lib/utils';

type InputProps = {
  label?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ label, className, ...props }: InputProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm text-slate-400">{label}</label>}
      <input
        className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
        {...props}
      />
    </div>
  );
}
