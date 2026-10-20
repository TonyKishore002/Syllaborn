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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d0f1b]/95 border-r border-purple-500/15 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-purple-500/15">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-900/30">
            <div className="w-full h-full rounded-[10px] bg-[#0d0f1b] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-fantasy font-bold text-lg tracking-wider bg-gradient-to-r from-purple-300 via-cyan-300 to-pink-300 bg-clip-text text-transparent">
              SYLLABORN
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">The Semesterverse</p>
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-900/30 border border-purple-400/30 transition-all duration-200 active:scale-[0.98]"
          >
            <FileUp className="w-4 h-4 text-cyan-300" />
            <span>Upload Syllabus PDF</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-cyan-600/10 text-cyan-300 border border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Semester Quest Summary Box in Footer */}
        <div className="p-4 border-t border-purple-500/15">
          <div className="p-3 rounded-xl bg-[#121528] border border-purple-500/20">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-fantasy text-[11px]">Pending Quests</span>
              <span className="font-mono text-cyan-400 font-bold">{pendingQuestsCount}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
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
