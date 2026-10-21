import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'pink' | 'emerald' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50 disabled:pointer-events-none select-none rounded-2xl active:translate-y-0.5 active:shadow-neu-inset';

    const variants = {
      primary:
        'bg-gradient-to-r from-[#5357c8] to-[#474bc0] hover:from-[#5b5fe0] hover:to-[#4e53cd] text-white border border-indigo-400/25 shadow-neu-raised hover:shadow-neo-purple active:shadow-neu-inset',
      secondary:
        'bg-gradient-to-br from-[#131828] to-[#0d121e] hover:from-[#182033] hover:to-[#101626] text-sky-200 border border-sky-500/20 shadow-neu-raised-sm active:shadow-neu-inset-sm',
      cyan:
        'bg-gradient-to-r from-sky-500/90 to-cyan-500/90 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold border border-sky-300/30 shadow-neu-raised active:shadow-neu-inset',
      pink:
        'bg-gradient-to-r from-[#6e4cb8] to-[#5547b0] hover:from-[#7b55ce] hover:to-[#6152c6] text-white border border-violet-400/25 shadow-neu-raised active:shadow-neu-inset',
      emerald:
        'bg-gradient-to-r from-[#149573] to-[#118063] hover:from-[#16a781] hover:to-[#138e6e] text-white border border-emerald-400/25 shadow-neu-raised active:shadow-neu-inset',
      danger:
        'bg-gradient-to-r from-[#c93b54] to-[#b33248] hover:from-[#dc435e] hover:to-[#c43951] text-white border border-rose-400/25 shadow-neu-raised active:shadow-neu-inset',
      ghost:
        'text-slate-300 hover:text-white hover:bg-[#101524] hover:shadow-neu-raised-sm active:shadow-neu-inset-sm border border-transparent',
      outline:
        'bg-[#0a0d16] border border-indigo-500/25 text-indigo-200 hover:bg-indigo-500/10 hover:border-indigo-400/40 shadow-neu-raised-sm active:shadow-neu-inset-sm',
    };


    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

