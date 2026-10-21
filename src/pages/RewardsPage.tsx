import React, { useMemo } from 'react';
import { Sparkles, Trophy, Flame } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useSyllaborn } from '../hooks/useSyllaborn';

export const RewardsPage: React.FC = () => {
  const { profile, levelInfo, data, achievements } = useSyllaborn();

  const xpTransactions = useMemo(() => {
    return [...data.xpTransactions].reverse().slice(0, 8);
  }, [data.xpTransactions]);

  const unlockedAchievementsCount = useMemo(() => {
    return achievements.filter((a) => a.unlockedAt !== null).length;
  }, [achievements]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-slate-100">
              Rewards &amp; Level
            </h1>
            <span className="text-xs font-mono font-black px-3 py-0.5 rounded-full bg-[#070b14] text-indigo-300 border border-indigo-500/30 shadow-neu-inset-sm">
              Level {levelInfo.level}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Complete study quests to earn XP, advance your academic level, and unlock semester milestones.
          </p>
        </div>
      </div>

      {/* Main Level Progress Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#101524] to-[#0a0d17] border border-white/[0.05] shadow-neu-raised relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Center Dial directly modeled on the reference music player dial (Sunken moat -> Raised disc -> Inner well) */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full neu-dial-moat p-2 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full neu-dial shadow-neu-raised flex items-center justify-center border border-white/[0.14] p-1.5">
                <div className="w-full h-full rounded-full bg-[#070b14] shadow-neu-inset-sm flex items-center justify-center font-fantasy font-black text-3xl sm:text-4xl text-amber-200 border border-white/[0.08]">
                  <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{levelInfo.level}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-black text-sky-400 uppercase tracking-widest">
                  Academic Rank
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-bold font-mono">
                  {profile?.characterName || profile?.displayName || 'Adventurer'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-fantasy font-black text-white">
                {levelInfo.levelTitle}
              </h2>

              <p className="text-xs text-slate-300 mt-1 font-medium">
                Total Experience: <span className="text-amber-300 font-mono font-black">{levelInfo.totalXp} XP</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left md:text-right">
            <span className="text-xs text-slate-300 font-mono font-bold block mb-0.5 uppercase tracking-wider">Next Rank Threshold</span>
            <span className="font-fantasy font-black text-lg text-sky-400">
              Level {levelInfo.level + 1}
            </span>
            <p className="text-[11px] text-slate-400 font-mono font-bold">
              {levelInfo.xpRequiredForNextLevel - levelInfo.xpInCurrentLevel} XP remaining
            </p>
          </div>
        </div>

        {/* Progress Gauge */}
        <div className="mt-6 pt-5 border-t border-white/[0.04] relative z-10 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-amber-300 font-fantasy">Level Progression</span>
            <span className="text-sky-400">
              {levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForNextLevel} XP ({levelInfo.progressPercent}%)
            </span>
          </div>

          <ProgressBar
            value={levelInfo.xpInCurrentLevel}
            max={levelInfo.xpRequiredForNextLevel}
            size="lg"
            variant="xp"
          />
        </div>
      </div>

      {/* Simple Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-300" />
            <h3 className="font-fantasy font-black text-lg text-slate-100">
              Semester Achievements
            </h3>
            <span className="text-xs font-mono font-black px-3 py-0.5 rounded-full bg-[#070b14] text-indigo-300 border border-indigo-500/30 shadow-neu-inset-sm">
              {unlockedAchievementsCount} / {achievements.length} Unlocked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlockedAt !== null;

            return (
              <Card
                key={ach.id}
                className={`p-5 rounded-3xl border border-white/[0.04] shadow-neu-raised hover:shadow-neu-raised-lg transition-all flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-[#0E1322]'
                    : 'bg-[#0E1322] opacity-75'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                    isUnlocked
                      ? 'neu-dial border-indigo-400/40 text-amber-300 shadow-neu-raised-sm'
                      : 'bg-[#070b14] text-slate-400 border-white/[0.03] shadow-neu-inset-sm'
                  }`}
                >
                  {isUnlocked ? ach.icon : '🔒'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="font-fantasy font-black text-xs sm:text-sm text-slate-100 truncate">
                      {ach.title}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-black">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight font-medium">
                    {ach.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Simple XP Log */}
      <div className="space-y-3">
        <h3 className="font-fantasy font-black text-base text-slate-100 flex items-center gap-2">
          <Flame className="w-4 h-4 text-indigo-400" />
          <span>Recent Academic XP History</span>
        </h3>

        {xpTransactions.length === 0 ? (
          <div className="p-6 text-center rounded-3xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm text-xs text-slate-400 font-medium">
            No XP transactions recorded yet. Complete your first study quest to earn experience!
          </div>
        ) : (
          <div className="rounded-3xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset divide-y divide-white/[0.04] overflow-hidden">
            {xpTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 flex items-center justify-between text-xs text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                  <span className="font-bold">
                    {tx.transactionType === 'milestone_completed'
                      ? 'Quest Successfully Conquered'
                      : 'Bonus Progress Awarded'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-amber-300 font-black text-sm">
                    +{tx.amount} XP
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
