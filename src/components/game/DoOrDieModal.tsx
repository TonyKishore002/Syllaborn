import React, { useState, useMemo } from 'react';
import { X, Swords, Trophy, Sparkles, Gamepad2, Flame } from 'lucide-react';
import { Course, Milestone, QuestGameConfig } from '../../types';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { DoOrDieGame } from './DoOrDieGame';
import { QuizBattleGame } from './QuizBattleGame';
import { generateFallbackGameConfig } from '../../lib/game-generator';
import { triggerLevelUpCelebration } from '../../lib/celebration';

interface DoOrDieModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBoss?: Milestone | null;
  selectedCourse?: Course | null;
}

export const DoOrDieModal: React.FC<DoOrDieModalProps> = ({
  isOpen,
  onClose,
  selectedBoss,
  selectedCourse,
}) => {
  const { completeQuestWithGame } = useSyllaborn();
  const [activeEngine, setActiveEngine] = useState<'do-or-die' | 'boss-arena'>('do-or-die');
  const [victoryReport, setVictoryReport] = useState<{
    score: number;
    xpEarned: number;
    alreadyCompleted: boolean;
  } | null>(null);

  const weight = selectedBoss?.weightPercent || 30;
  const hp = selectedBoss?.bossHp || Math.round(weight * 10);
  const xpReward = Math.max(250, hp);

  // Generate or read game configuration
  const gameConfig: QuestGameConfig = useMemo(() => {
    if (selectedBoss?.gameConfig && selectedBoss.gameConfig.questions.length > 0) {
      return selectedBoss.gameConfig;
    }
    const topicTitle = selectedBoss?.title || 'Comprehensive Course Final';
    const cName = selectedCourse?.courseName || 'Academic Course';
    return generateFallbackGameConfig(topicTitle, cName, 'do-or-die');
  }, [selectedBoss, selectedCourse]);

  const handleGameComplete = (score: number) => {
    if (selectedBoss) {
      const res = completeQuestWithGame(selectedBoss.id, 'milestone', {
        gameMode: activeEngine,
        score,
      });

      triggerLevelUpCelebration();

      setVictoryReport({
        score,
        xpEarned: res ? res.xpAwarded : xpReward,
        alreadyCompleted: res ? res.alreadyCompleted : selectedBoss.status === 'completed',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0c0f1d] border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3 bg-[#12162a] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fantasy font-bold text-base text-slate-100 flex items-center gap-1.5">
                  <span>DO OR DIE ARENA</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedCourse?.courseCode || 'ACADEMIC BOSS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedBoss?.title
                  ? `Challenging ${selectedBoss.title} (${weight}% Weight • ${hp} HP)`
                  : 'Play the survival game to sharpen your reflexes and conquer course milestones'}
              </p>
            </div>
          </div>

          {/* Action Buttons & Engine Switcher */}
          <div className="flex items-center gap-2">
            {!victoryReport && (
              <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveEngine('do-or-die')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    activeEngine === 'do-or-die'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="2D Survival Platformer"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Survival Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEngine('boss-arena')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    activeEngine === 'boss-arena'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Turn-Based Boss Combat"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Boss Combat</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Close Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Render Container */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex flex-col">
          {victoryReport ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#0e1224] to-[#070914] animate-in fade-in zoom-in-95">
              <div className="max-w-md w-full bg-[#13172e] border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-5xl mx-auto shadow-xl shadow-emerald-950/50">
                  🏆
                </div>

                <div>
                  <h2 className="font-fantasy font-black text-2xl text-slate-100">
                    BOSS VANQUISHED!
                  </h2>
                  <p className="text-xs text-emerald-300 font-mono mt-0.5">
                    {selectedBoss?.title || 'Academic Boss Encounter'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#090b16] border border-purple-500/20 text-xs text-slate-300 space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-bold text-slate-200">
                      {selectedCourse?.courseName || 'University Course'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grading Weight Defeated:</span>
                    <span className="font-mono text-cyan-300 font-bold">{weight}% Weight</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                    <span className="text-amber-300">XP Awarded:</span>
                    <span className="font-mono text-emerald-300 text-sm">
                      {victoryReport.alreadyCompleted
                        ? '+0 XP (Replay Mode)'
                        : `+${victoryReport.xpEarned} XP`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setVictoryReport(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-fantasy text-xs font-bold transition-all"
                  >
                    Play Again 🔄
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-fantasy font-bold text-xs shadow-lg transition-all"
                  >
                    Return to Boss Fights ✓
                  </button>
                </div>
              </div>
            </div>
          ) : activeEngine === 'do-or-die' ? (
            <DoOrDieGame
              gameConfig={gameConfig}
              onComplete={handleGameComplete}
              courseCode={selectedCourse?.courseCode}
              courseTitle={selectedCourse?.courseName}
            />
          ) : (
            <QuizBattleGame
              gameConfig={gameConfig}
              onComplete={handleGameComplete}
              courseCode={selectedCourse?.courseCode}
              courseTitle={selectedCourse?.courseName}
              isBossEncounter={true}
              bossHpOverride={hp}
            />
          )}
        </div>
      </div>
    </div>
  );
};
