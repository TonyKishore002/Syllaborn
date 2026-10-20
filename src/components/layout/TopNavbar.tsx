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
    <header className="sticky top-0 z-30 h-16 bg-[#08090f]/80 backdrop-blur-xl border-b border-purple-500/15 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs text-slate-400 font-medium">
            Semester Realm:{' '}
            <span className="text-slate-200 font-semibold">
              {profile?.universityName || 'Academy of Arcane Arts'}
            </span>
          </p>
        </div>
      </div>

      {/* Right: Player Level & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Level & XP Gauge */}
        <div className="flex items-center gap-2.5 bg-[#121528] py-1.5 px-3 rounded-xl border border-purple-500/25 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-bold font-mono text-white shadow-md shadow-purple-900/30">
            {levelInfo.level}
          </div>
          <div className="w-28 sm:w-36 hidden xs:block">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-0.5">
              <span className="text-cyan-300 font-semibold truncate max-w-[80px]">
                {levelInfo.levelTitle}
              </span>
              <span>
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
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors"
        >
          <FileUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload PDF</span>
        </button>

        {/* Profile Button */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#15192c] hover:bg-[#1e233d] border border-slate-700/60 hover:border-purple-500/40 text-slate-200 transition-all text-xs"
          title="Open Player Profile & Settings"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline font-medium text-slate-300 truncate max-w-[100px]">
            {profile?.displayName || 'Adventurer'}
          </span>
        </button>

        {/* Quick Settings Icon */}
        <button
          type="button"
          onClick={onProfileClick}
          className="p-2 rounded-xl bg-[#15192c] hover:bg-[#1e233d] border border-slate-700/60 hover:border-purple-500/40 text-slate-400 hover:text-cyan-300 transition-colors"
          title="Settings & Data Sanctuary"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
