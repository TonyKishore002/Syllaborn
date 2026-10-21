import React from 'react';
import { Menu, Shield, User, Sparkles, FileUp } from 'lucide-react';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { ProgressBar } from '../ui/ProgressBar';

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
  onUploadClick: () => void;
  onProfileClick: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onMobileMenuToggle,
  onUploadClick,
  onProfileClick,
}) => {
  const { profile, levelInfo } = useSyllaborn();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090D16]/95 backdrop-blur-md border-b border-white/[0.04] px-4 lg:px-8 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-200 bg-[#0E1322] border border-white/[0.04] rounded-2xl shadow-neu-raised-sm active:shadow-neu-inset-sm hover:text-white transition-all active:translate-y-0.5"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-mono text-slate-400 font-medium">
            Semester Realm:{' '}
            <span className="text-indigo-300 font-bold">
              {profile?.universityName || 'Academy of Arcane Arts'}
            </span>
          </p>
        </div>
      </div>

      {/* Right: Player Level & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Level & XP Gauge - Sunken Pill Container */}
        <div className="flex items-center gap-2.5 bg-[#060810] py-1.5 px-3.5 rounded-2xl border border-white/[0.04] shadow-neu-inset">
          <div className="w-7 h-7 rounded-full neu-dial border border-indigo-400/40 shadow-neu-raised flex items-center justify-center text-xs font-bold font-mono text-amber-200">
            {levelInfo.level}
          </div>
          <div className="w-28 sm:w-36 hidden xs:block">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 font-semibold mb-0.5">
              <span className="text-[#38BDF8] truncate max-w-[80px]">
                {levelInfo.levelTitle}
              </span>
              <span className="text-slate-400">
                {levelInfo.xpInCurrentLevel}/{levelInfo.xpRequiredForNextLevel} XP
              </span>
            </div>
            <ProgressBar
              value={levelInfo.xpInCurrentLevel}
              max={levelInfo.xpRequiredForNextLevel}
              size="sm"
              variant="xp"
            />
          </div>
        </div>

        {/* Upload Shortcut for Desktop */}
        <button
          type="button"
          onClick={onUploadClick}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#111524] to-[#0a0d16] hover:from-[#151c2e] hover:to-[#0d111c] text-sky-200 border border-sky-500/20 text-xs font-semibold shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset transition-all active:translate-y-0.5"
        >
          <FileUp className="w-3.5 h-3.5 text-sky-300" />
          <span>Upload PDF</span>
        </button>

        {/* Profile Button - Tactile Convex Pill */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-gradient-to-br from-[#111524] to-[#0a0d16] hover:from-[#151c2e] hover:to-[#0d111c] border border-white/[0.05] text-slate-200 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset transition-all text-xs font-medium active:translate-y-0.5"
          title="Open Player Profile & Settings"
        >
          <div className="w-6 h-6 rounded-full bg-[#060810] border border-sky-400/20 flex items-center justify-center text-sky-300 shadow-neu-inset-sm">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline font-semibold text-slate-200 truncate max-w-[100px]">
            {profile?.displayName || 'Adventurer'}
          </span>
        </button>

        {/* Quick Settings Icon */}
        <button
          type="button"
          onClick={onProfileClick}
          className="p-2 rounded-2xl bg-gradient-to-br from-[#111524] to-[#0a0d16] hover:from-[#151c2e] hover:to-[#0d111c] border border-white/[0.05] text-slate-400 hover:text-white shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset transition-all active:translate-y-0.5"
          title="Settings & Data Sanctuary"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

