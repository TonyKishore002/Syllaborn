import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  value: number; // 0 to 100 or current value
  max?: number;
  label?: React.ReactNode;
  valueDisplay?: React.ReactNode;
  variant?: 'xp' | 'boss_hp' | 'cyan' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showShimmer?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  valueDisplay,
  variant = 'xp',
  size = 'md',
  className = '',
  showShimmer = false,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const variants = {
    xp: 'bg-gradient-to-r from-indigo-500/90 to-sky-400/85 shadow-[0_0_8px_rgba(91,95,199,0.25)]',
    boss_hp: 'bg-gradient-to-r from-rose-500/90 to-rose-400/80 shadow-[0_0_8px_rgba(224,67,96,0.25)]',
    cyan: 'bg-gradient-to-r from-sky-500/90 to-sky-400/80 shadow-[0_0_8px_rgba(56,162,216,0.25)]',
    emerald: 'bg-gradient-to-r from-emerald-500/90 to-teal-500/80 shadow-[0_0_8px_rgba(20,160,122,0.25)]',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3.5',
    lg: 'h-4.5',
  };

  return (
    <div className={cn('w-full select-none', className)}>
      {(label || valueDisplay) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium font-mono">
          {label && <div className="text-slate-200 flex items-center gap-1.5 font-semibold">{label}</div>}
          {valueDisplay && <div className="text-sky-300 font-mono font-bold">{valueDisplay}</div>}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-[#060810] shadow-neu-inset rounded-full overflow-hidden p-0.5 border border-white/[0.04]',
          sizes[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full relative transition-all duration-200',
            variants[variant]
          )}
        >
          {showShimmer && percentage > 5 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse-glow" />
          )}
          {percentage > 3 && (
            <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-neu-raised-sm border border-white/50" />
          )}
        </motion.div>
      </div>
    </div>
  );
};

