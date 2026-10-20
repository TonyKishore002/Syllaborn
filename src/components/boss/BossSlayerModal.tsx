import React, { useState, useMemo } from 'react';
import { X, Swords, Flame, Gamepad2 } from 'lucide-react';
import { Course, Milestone } from '../../types';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { BossSlayerGame } from './BossSlayerGame';
import { DoOrDieGame } from '../game/DoOrDieGame';
import { generateBossSlayerConfig } from '../../lib/boss-generator';
import { generateFallbackGameConfig } from '../../lib/game-generator';
import { BossCombatStats } from '../../types/boss';

interface BossSlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBoss?: Milestone | null;
  selectedCourse?: Course | null;
}

export const BossSlayerModal: React.FC<BossSlayerModalProps> = ({
  isOpen,
  onClose,
  selectedBoss,
  selectedCourse,
}) => {
  const { completeQuestWithGame, units } = useSyllaborn();
  const [activeEngine, setActiveEngine] = useState<'boss-slayer' | 'do-or-die'>('boss-slayer');

  // Generate 3-Phase Boss Slayer configuration
  const bossConfig = useMemo(() => {
    return generateBossSlayerConfig(selectedBoss || null, selectedCourse || null, units);
  }, [selectedBoss, selectedCourse, units]);

  // Fallback config for 2D survival platformer mode
  const platformerConfig = useMemo(() => {
    if (selectedBoss?.gameConfig && selectedBoss.gameConfig.questions.length > 0) {
      return selectedBoss.gameConfig;
    }
    const topicTitle = selectedBoss?.title || 'Comprehensive Course Final';
    const cName = selectedCourse?.courseName || 'Academic Course';
    return generateFallbackGameConfig(topicTitle, cName, 'do-or-die');
  }, [selectedBoss, selectedCourse]);

  const handleGameComplete = (score: number, _stats?: BossCombatStats) => {
    if (selectedBoss) {
      completeQuestWithGame(selectedBoss.id, 'milestone', {
        gameMode: activeEngine,
        score,
      });
    }
  };

  if (!isOpen) return null;

  const isAlreadyCompleted = selectedBoss?.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0a0d1a] border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Control Bar with Engine Switcher & Close */}
        <div className="px-4 py-2.5 bg-[#0f1429] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fantasy font-black text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                  <span>BOSS SLAYER ARENA</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedCourse?.courseCode || 'ACADEMIC BOSS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {selectedBoss?.title
                  ? `Challenging ${selectedBoss.title} (${selectedBoss.weightPercent || 30}% Weight • ${bossConfig.maxHp} HP)`
                  : 'Multi-Phase RPG Boss Encounter with Real-Time Telegraphs & Dodges'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setActiveEngine('boss-slayer')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeEngine === 'boss-slayer'
                    ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="3-Phase Real-Time RPG Combat"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Boss Slayer RPG</span>
              </button>

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
            </div>

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

        {/* Game Render Body */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex flex-col">
          {activeEngine === 'boss-slayer' ? (
            <BossSlayerGame
              config={bossConfig}
              onComplete={handleGameComplete}
              onExit={onClose}
              alreadyCompleted={isAlreadyCompleted}
            />
          ) : (
            <DoOrDieGame
              gameConfig={platformerConfig}
              onComplete={(score) => handleGameComplete(score)}
              courseCode={selectedCourse?.courseCode}
              courseTitle={selectedCourse?.courseName}
            />
          )}
        </div>
      </div>
    </div>
  );
};
