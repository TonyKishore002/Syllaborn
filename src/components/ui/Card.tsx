import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'purple' | 'cyan' | 'none';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, glow = 'none', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl border border-white/[0.05] p-5.5',
          'bg-gradient-to-br from-[#101524] to-[#0a0d17] shadow-neu-raised transition-all duration-200',
          hoverEffect &&
            'hover:-translate-y-1 hover:shadow-neu-raised-lg hover:border-indigo-500/30 cursor-pointer active:translate-y-0.5 active:shadow-neu-inset-sm',
          glow === 'purple' && 'border-indigo-500/30 shadow-neo-purple',
          glow === 'cyan' && 'border-sky-500/30 shadow-neo-cyan',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

