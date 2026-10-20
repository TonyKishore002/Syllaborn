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
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-purple-500/20 bg-[#101322]/60 backdrop-blur-md">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-900/40 to-cyan-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-4 shadow-lg shadow-purple-900/20">
        {icon || <Sparkles className="w-8 h-8 text-cyan-400" />}
      </div>
      <h3 className="text-lg md:text-xl font-bold font-fantasy text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
