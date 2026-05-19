import React from 'react';
import { cn } from '../../lib/utils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl', className)}>
      {children}
    </div>
  );
}
