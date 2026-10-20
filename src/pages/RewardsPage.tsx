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
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-slate-100">
              Rewards &amp; Level
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Level {levelInfo.level}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete study quests to earn XP, advance your academic level, and unlock semester milestones.
          </p>
        </div>
      </div>

      {/* Main Level Progress Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/60 via-[#101428] to-[#0d162b] border border-purple-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-fantasy font-black text-2xl sm:text-3xl text-white shadow-xl shadow-purple-900/40 shrink-0 border border-purple-400/30">
              {levelInfo.level}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Academic Rank
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">
                  {profile?.characterName || profile?.displayName || 'Adventurer'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-fantasy font-bold text-slate-100">
                {levelInfo.levelTitle}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Total Experience: <span className="text-amber-300 font-mono font-bold">{levelInfo.totalXp} XP</span>
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left md:text-right">
            <span className="text-xs text-slate-400 block mb-0.5">Next Rank Threshold</span>
            <span className="font-fantasy font-bold text-base text-purple-300">
              Level {levelInfo.level + 1}
            </span>
            <p className="text-[11px] text-slate-500 font-mono">
              {levelInfo.xpRequiredForNextLevel - levelInfo.xpInCurrentLevel} XP remaining
            </p>
          </div>
        </div>

        {/* Progress Gauge */}
        <div className="mt-6 pt-5 border-t border-purple-500/15 relative z-10 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-purple-300 font-medium">Level Progression</span>
            <span className="font-mono text-cyan-300 font-bold">
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
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-fantasy font-bold text-lg text-slate-100">
              Semester Achievements
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
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
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-[#12162e] border-amber-500/30 shadow-md'
                    : 'bg-[#0f1122]/60 border-purple-500/15 opacity-70'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                    isUnlocked
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : 'bg-slate-800/60 border border-slate-700/50'
                  }`}
                >
                  {isUnlocked ? ach.icon : '🔒'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="font-fantasy font-bold text-xs sm:text-sm text-slate-200 truncate">
                      {ach.title}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-bold">
                        ✓ Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
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
        <h3 className="font-fantasy font-bold text-base text-slate-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Recent Academic XP History</span>
        </h3>

        {xpTransactions.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#101324] border border-purple-500/15 text-xs text-slate-500">
            No XP transactions recorded yet. Complete your first study quest to earn experience!
          </div>
        ) : (
          <div className="rounded-2xl bg-[#101324] border border-purple-500/15 divide-y divide-purple-500/10 overflow-hidden">
            {xpTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 flex items-center justify-between text-xs text-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium">
                    {tx.transactionType === 'milestone_completed'
                      ? 'Quest Successfully Conquered'
                      : 'Bonus Progress Awarded'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-bold">
                    +{tx.amount} XP
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
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
