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
          'rounded-2xl border p-5 backdrop-blur-md',
          'bg-[#121526]/80 border-purple-500/15 shadow-[0_4px_24px_rgba(0,0,0,0.3)]',
          hoverEffect &&
            'transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/35 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)] cursor-pointer',
          glow === 'purple' && 'shadow-[0_0_20px_rgba(168,85,247,0.25)] border-purple-500/40',
          glow === 'cyan' && 'shadow-[0_0_20px_rgba(6,182,212,0.25)] border-cyan-500/40',
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
