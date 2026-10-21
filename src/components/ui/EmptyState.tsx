import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'cyan' | 'pink';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-slate-800/80 bg-[#0E1322]/90 shadow-xl">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 shadow-md shadow-indigo-500/10 flex items-center justify-center text-indigo-300 mb-4">
        {icon || <Sparkles className="w-8 h-8 text-indigo-400" />}
      </div>
      <h3 className="text-lg md:text-xl font-black font-fantasy text-slate-100 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

