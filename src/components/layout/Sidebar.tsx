import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  FileUp,
  Swords,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSyllaborn } from '../../hooks/useSyllaborn';

interface SidebarProps {
  onUploadClick: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onUploadClick,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { courses, milestones } = useSyllaborn();
  const pendingQuestsCount = milestones.filter((m) => m.status === 'pending').length;
  // High-stakes boss count
  const bossCount = milestones.filter(
    (m) =>
      m.status === 'pending' &&
      (m.difficultyCategory === 'boss_fight' ||
        m.difficultyCategory === 'final_raid' ||
        (m.weightPercent && m.weightPercent >= 20))
  ).length;

  const navLinks = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/quests',
      label: 'My Quests',
      icon: Swords,
      badge: pendingQuestsCount > 0 ? pendingQuestsCount : null,
    },
    {
      to: '/courses',
      label: 'My Courses',
      icon: BookOpen,
      badge: courses.length > 0 ? courses.length : null,
    },
    {
      to: '/bosses',
      label: 'Boss Fights',
      icon: ShieldAlert,
      badge: bossCount > 0 ? bossCount : null,
    },
    {
      to: '/rewards',
      label: 'Rewards',
      icon: Sparkles,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/[0.04] bg-[#0E1322]">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-neu-raised-sm flex items-center justify-center border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-fantasy font-black text-lg tracking-wider text-white">
              SYLLABORN
            </span>
            <p className="text-[10px] text-[#38BDF8] font-mono font-bold tracking-wider uppercase">
              The Semesterverse
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => {
              onUploadClick();
              if (onMobileClose) onMobileClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs border border-indigo-400/30 shadow-neu-raised active:shadow-neu-inset transition-all active:translate-y-0.5 duration-150"
          >
            <FileUp className="w-4 h-4 text-sky-200" />
            <span>Upload Syllabus PDF</span>
          </button>
        </div>

        {/* Navigation Items (Sunken active slot inspired by reference image 'Player' pill) */}
        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-200 select-none',
                  isActive
                    ? 'bg-[#060912] text-sky-300 shadow-neu-inset border border-sky-400/30 font-bold scale-[0.99]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-gradient-to-br hover:from-[#13192c] hover:to-[#0c101c] hover:shadow-neu-raised-sm border border-transparent font-medium active:shadow-neu-inset-sm'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    {/* Active glowing indicator inside sunken well like reference image */}
                    {isActive ? (
                      <div className="w-4 h-4 rounded-full bg-[#070b14] shadow-neu-inset-sm border border-sky-500/30 flex items-center justify-center shrink-0">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] shrink-0" />
                      </div>
                    ) : (
                      <item.icon className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border',
                        isActive
                          ? 'bg-sky-500/20 text-sky-200 border-sky-400/30 shadow-neu-raised-sm'
                          : 'bg-[#0b0f1a] text-slate-400 border-slate-700/40 shadow-neu-inset-sm'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Semester Quest Summary Box in Footer */}
        <div className="p-4 border-t border-white/[0.04] bg-[#0A0E1A]">
          <div className="p-3.5 rounded-2xl bg-[#0E1322] shadow-neu-raised-sm border border-white/[0.03]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-fantasy text-[11px] font-bold">Pending Quests</span>
              <span className="font-mono text-[#38BDF8] font-bold">{pendingQuestsCount}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              {pendingQuestsCount === 0
                ? 'All quests cleared! Peace in the realm.'
                : `${pendingQuestsCount} quests awaiting conquest.`}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

