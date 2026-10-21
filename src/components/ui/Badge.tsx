import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'purple' | 'cyan' | 'pink' | 'emerald' | 'amber' | 'rose' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'purple',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    purple: 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 shadow-neu-raised-sm',
    cyan: 'bg-sky-950/40 text-sky-300 border border-sky-500/20 shadow-neu-raised-sm',
    pink: 'bg-violet-950/40 text-violet-300 border border-violet-500/20 shadow-neu-raised-sm',
    emerald: 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 shadow-neu-raised-sm',
    amber: 'bg-amber-950/40 text-amber-300 border border-amber-500/20 shadow-neu-raised-sm',
    rose: 'bg-rose-950/40 text-rose-300 border border-rose-500/20 shadow-neu-raised-sm',
    slate: 'bg-slate-900/60 text-slate-300 border border-slate-700/30 shadow-neu-raised-sm',
  };

  const sizes = {
    sm: 'text-[11px] px-3 py-0.5 font-bold',
    md: 'text-xs px-3.5 py-1 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full tracking-wide uppercase font-mono select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

