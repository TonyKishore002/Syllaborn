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
  showShimmer = true,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const variants = {
    xp: 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400',
    boss_hp: 'bg-gradient-to-r from-rose-600 via-red-500 to-pink-500',
    cyan: 'bg-gradient-to-r from-cyan-600 to-teal-400',
    emerald: 'bg-gradient-to-r from-emerald-600 to-teal-400',
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full select-none', className)}>
      {(label || valueDisplay) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          {label && <div className="text-slate-300 flex items-center gap-1.5">{label}</div>}
          {valueDisplay && <div className="text-slate-400 font-mono">{valueDisplay}</div>}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-[#0a0d18] border border-purple-500/20 rounded-full overflow-hidden p-0.5 shadow-inner',
          sizes[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full relative transition-all duration-300',
            variants[variant]
          )}
        >
          {showShimmer && percentage > 5 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse-glow" />
          )}
        </motion.div>
      </div>
    </div>
  );
};
