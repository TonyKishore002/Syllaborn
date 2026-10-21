import React, { useState, useEffect } from 'react';
import {
  X,
  Swords,
  Gamepad2,
  Puzzle,
  Flame,
  Sparkles,
  Trophy,
  Crown,
} from 'lucide-react';
import { GameMode, QuestGameConfig } from '../../types';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { DoOrDieGame } from './DoOrDieGame';
import { QuizBattleGame } from './QuizBattleGame';
import { PuzzleQuestGame } from './PuzzleQuestGame';
import { BossSlayerGame } from '../boss/BossSlayerGame';
import { generateBossSlayerConfig } from '../../lib/boss-generator';
import { generateFallbackGameConfig, selectIntelligentGameMode } from '../../lib/game-generator';
import { triggerQuestCelebration, triggerLevelUpCelebration } from '../../lib/celebration';

export interface PlayableQuestItem {
  id: string;
  kind: 'topic' | 'milestone';
  title: string;
  description?: string;
  courseId: string;
  courseCode?: string;
  courseName?: string;
  xpReward: number;
  status: 'pending' | 'completed';
  gameConfig?: QuestGameConfig;
  weightPercent?: number | null;
  bossHp?: number | null;
  isBoss?: boolean;
}

interface PlayQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: PlayableQuestItem | null;
}

export const PlayQuestModal: React.FC<PlayQuestModalProps> = ({
  isOpen,
  onClose,
  quest,
}) => {
  const { completeQuestWithGame, saveTopicGameConfig, saveMilestoneGameConfig, units } = useSyllaborn();

  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('quiz-battle');
  const [activeGameConfig, setActiveGameConfig] = useState<QuestGameConfig | null>(null);
  const [victoryReport, setVictoryReport] = useState<{
    score: number;
    xpEarned: number;
    alreadyCompleted: boolean;
    title: string;
  } | null>(null);

  // Initialize game configuration when modal opens with a quest
  useEffect(() => {
    if (!quest) return;
    setVictoryReport(null);

    // Initial game mode determination
    let initialMode: GameMode = 'quiz-battle';
    if (quest.gameConfig?.gameMode) {
      initialMode = quest.gameConfig.gameMode;
    } else {
      initialMode = selectIntelligentGameMode(quest.title, quest.description);
    }
    setSelectedGameMode(initialMode);

    // Ensure valid gameConfig exists
    if (quest.gameConfig && quest.gameConfig.questions && quest.gameConfig.questions.length > 0) {
      let config = quest.gameConfig;
      if (
        initialMode === 'puzzle-quest' &&
        (!config.puzzleData || (!config.puzzleData.pairs?.length && !config.puzzleData.steps?.length))
      ) {
        const fallback = generateFallbackGameConfig(
          quest.title,
          quest.courseName || quest.courseCode,
          'puzzle-quest'
        );
        config = {
          ...config,
          puzzleData: fallback.puzzleData,
        };
      }
      setActiveGameConfig(config);
    } else {
      const generated = generateFallbackGameConfig(
        quest.title,
        quest.courseName || quest.courseCode,
        initialMode
      );
      setActiveGameConfig(generated);

      // Persist generated game config so it stays saved
      if (quest.kind === 'topic') {
        saveTopicGameConfig(quest.id, generated);
      } else {
        saveMilestoneGameConfig(quest.id, generated);
      }
    }
  }, [quest, saveTopicGameConfig, saveMilestoneGameConfig]);

  // When player toggles game mode in the UI
  const handleModeSwitch = (mode: GameMode) => {
    setSelectedGameMode(mode);
    if (!quest) return;

    if (activeGameConfig) {
      const updated: QuestGameConfig = {
        ...activeGameConfig,
        gameMode: mode,
      };
      // If switching to puzzle and no valid puzzleData, generate it
      if (
        mode === 'puzzle-quest' &&
        (!updated.puzzleData || (!updated.puzzleData.pairs?.length && !updated.puzzleData.steps?.length))
      ) {
        const fallback = generateFallbackGameConfig(
          quest.title,
          quest.courseName || quest.courseCode,
          'puzzle-quest'
        );
        updated.puzzleData = fallback.puzzleData;
      }
      setActiveGameConfig(updated);
    } else {
      const generated = generateFallbackGameConfig(
        quest.title,
        quest.courseName || quest.courseCode,
        mode
      );
      setActiveGameConfig(generated);
    }
  };

  // Called when player clears the game
  const handleGameComplete = (score: number) => {
    if (!quest) return;

    const res = completeQuestWithGame(quest.id, quest.kind, {
      gameMode: selectedGameMode,
      score,
    });

    if (quest.isBoss || quest.kind === 'milestone') {
      triggerLevelUpCelebration();
    } else {
      triggerQuestCelebration();
    }

    setVictoryReport({
      score,
      xpEarned: res ? res.xpAwarded : quest.xpReward,
      alreadyCompleted: res ? res.alreadyCompleted : quest.status === 'completed',
      title: res ? res.title : quest.title,
    });
  };

  if (!isOpen || !quest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0B0F19] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Control Header */}
        <div className="px-5 py-3 bg-[#0E1322]/95 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          {/* Quest Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/25 border border-indigo-500/40 shadow-neo-sm flex items-center justify-center text-indigo-300">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-neo-sm font-bold">
                  {quest.courseCode || 'COURSE'}
                </span>
                <h3 className="font-fantasy font-bold text-sm text-slate-100 truncate max-w-[260px] sm:max-w-md">
                  {quest.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-300">
                {quest.courseName} • Reward: +{quest.xpReward} XP
              </p>
            </div>
          </div>

          {/* Game Mode Switcher & Close Button */}
          <div className="flex items-center gap-2">
            {!victoryReport && (
              <div className="flex items-center bg-[#131B2E] p-1 rounded-xl border border-slate-700/80 text-xs gap-1">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('do-or-die')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'do-or-die'
                      ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-neo-purple font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  title="3D Cyber Runner / Platformer"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Do-or-Die 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('quiz-battle')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'quiz-battle'
                      ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-neo-purple font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  title="Monster Combat Arena"
                >
                  <Swords className="w-3.5 h-3.5 text-sky-400" />
                  <span>Quiz Battle</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('puzzle-quest')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'puzzle-quest'
                      ? 'bg-indigo-600 text-white border border-indigo-400/40 shadow-neo-purple font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  title="3D Runic Dungeon Chamber"
                >
                  <Puzzle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Puzzle Quest 3D</span>
                </button>

                {(quest.isBoss || quest.kind === 'milestone') && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('boss-slayer')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      selectedGameMode === 'boss-slayer'
                        ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white border border-indigo-400/40 shadow-neo-purple font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                    title="3D Isometric Action-RPG Boss Fight"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Boss Slayer 3D</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/80 shadow-neo-sm transition-all"
              title="Close Arena"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Play Area or Victory Report Card */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex flex-col">
          {victoryReport ? (
            /* CONQUEST VICTORY REPORT CARD */
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#0e1224] to-[#070914] animate-in fade-in zoom-in-95">
              <div className="max-w-md w-full bg-[#0E1322] border border-slate-800/80 shadow-2xl rounded-3xl p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-400/40 shadow-neo-purple flex items-center justify-center text-5xl mx-auto">
                  🏆
                </div>

                <div>
                  <h2 className="font-fantasy font-black text-2xl text-slate-100">
                    QUEST CONQUERED!
                  </h2>
                  <p className="text-xs text-sky-400 font-mono mt-0.5 font-bold">
                    {victoryReport.title}
                  </p>
                </div>

                {/* Score & XP details */}
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800/80 shadow-neo-sm text-xs text-slate-300 space-y-2.5 text-left font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Game Mode:</span>
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      {selectedGameMode}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Knowledge Points:</span>
                    <span className="font-mono text-sky-400 font-bold">{victoryReport.score} pts</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold">
                    <span className="text-slate-200">XP Awarded:</span>
                    <span className="font-mono text-amber-300 text-sm">
                      {victoryReport.alreadyCompleted
                        ? '+0 XP (Practice Mode)'
                        : `+${victoryReport.xpEarned} XP`}
                    </span>
                  </div>

                  {victoryReport.alreadyCompleted && (
                    <p className="text-[10px] text-slate-400 italic pt-1">
                      * You previously conquered this quest. No duplicate XP was awarded.
                    </p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setVictoryReport(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-fantasy font-bold text-xs border border-slate-700/80 shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    Play Again 🔄
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-fantasy font-black text-xs border border-indigo-400/40 shadow-neo-purple hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    Return to Quests ✓
                  </button>
                </div>
              </div>
            </div>
          ) : activeGameConfig ? (
            /* ACTIVE MINI-GAME RENDERER */
            selectedGameMode === 'boss-slayer' ? (
              <BossSlayerGame
                config={generateBossSlayerConfig(
                  {
                    id: quest.id,
                    title: quest.title,
                    courseId: quest.courseId,
                    weightPercent: quest.weightPercent ?? null,
                    bossHp: quest.bossHp ?? null,
                    status: quest.status,
                    gameConfig: quest.gameConfig,
                    difficultyCategory: quest.isBoss ? 'boss_fight' : 'normal_quest',
                    milestoneType: 'midterm',
                    sourceType: 'ai_extracted',
                    dueDate: null,
                    dueTime: null,
                    createdAt: '',
                    updatedAt: '',
                    xpReward: quest.xpReward,
                  },
                  {
                    id: quest.courseId,
                    courseName: quest.courseName || '',
                    courseCode: quest.courseCode || '',
                    color: '#8b5cf6',
                    createdAt: '',
                    updatedAt: '',
                  },
                  units
                )}
                onComplete={handleGameComplete}
                onExit={onClose}
                alreadyCompleted={quest.status === 'completed'}
              />
            ) : selectedGameMode === 'do-or-die' ? (
              <DoOrDieGame
                gameConfig={activeGameConfig}
                onComplete={handleGameComplete}
                courseCode={quest.courseCode}
                courseTitle={quest.courseName}
              />
            ) : selectedGameMode === 'puzzle-quest' ? (
              <PuzzleQuestGame
                gameConfig={activeGameConfig}
                onComplete={handleGameComplete}
                courseCode={quest.courseCode}
                courseTitle={quest.courseName}
              />
            ) : (
              <QuizBattleGame
                gameConfig={activeGameConfig}
                onComplete={handleGameComplete}
                courseCode={quest.courseCode}
                courseTitle={quest.courseName}
                isBossEncounter={quest.isBoss || quest.kind === 'milestone'}
                bossHpOverride={quest.bossHp || undefined}
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
