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
      setActiveGameConfig(quest.gameConfig);
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
      // If switching to puzzle and no puzzleData, generate it
      if (mode === 'puzzle-quest' && !updated.puzzleData) {
        const fallback = generateFallbackGameConfig(
          quest.title,
          quest.courseName,
          'puzzle-quest'
        );
        updated.puzzleData = fallback.puzzleData;
      }
      setActiveGameConfig(updated);
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
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0c0f1d] border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Control Header */}
        <div className="px-5 py-3 bg-[#11152a] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
          {/* Quest Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  {quest.courseCode || 'COURSE'}
                </span>
                <h3 className="font-fantasy font-bold text-sm text-slate-100 truncate max-w-[260px] sm:max-w-md">
                  {quest.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {quest.courseName} • Reward: +{quest.xpReward} XP
              </p>
            </div>
          </div>

          {/* Game Mode Switcher & Close Button */}
          <div className="flex items-center gap-2">
            {!victoryReport && (
              <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('do-or-die')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'do-or-die'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="2D Survival Side-scroller"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Do-or-Die</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('quiz-battle')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'quiz-battle'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Monster Combat Arena"
                >
                  <Swords className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Quiz Battle</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('puzzle-quest')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    selectedGameMode === 'puzzle-quest'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Concept Matching & Step Ordering"
                >
                  <Puzzle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Puzzle Quest</span>
                </button>

                {(quest.isBoss || quest.kind === 'milestone') && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('boss-slayer')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                      selectedGameMode === 'boss-slayer'
                        ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="3-Phase Real-Time RPG Boss Fight"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Boss Slayer</span>
                  </button>
                )}
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

        {/* Game Play Area or Victory Report Card */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden flex flex-col">
          {victoryReport ? (
            /* CONQUEST VICTORY REPORT CARD */
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-[#0e1224] to-[#070914] animate-in fade-in zoom-in-95">
              <div className="max-w-md w-full bg-[#13172e] border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-5xl mx-auto shadow-xl shadow-emerald-950/50">
                  🏆
                </div>

                <div>
                  <h2 className="font-fantasy font-black text-2xl text-slate-100">
                    QUEST CONQUERED!
                  </h2>
                  <p className="text-xs text-emerald-300 font-mono mt-0.5">
                    {victoryReport.title}
                  </p>
                </div>

                {/* Score & XP details */}
                <div className="p-4 rounded-2xl bg-[#090b16] border border-purple-500/20 text-xs text-slate-300 space-y-2.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Game Mode:</span>
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      {selectedGameMode}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Knowledge Points:</span>
                    <span className="font-mono text-cyan-300 font-bold">{victoryReport.score} pts</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                    <span className="text-amber-300">XP Awarded:</span>
                    <span className="font-mono text-emerald-300 text-sm">
                      {victoryReport.alreadyCompleted
                        ? '+0 XP (Practice Mode)'
                        : `+${victoryReport.xpEarned} XP`}
                    </span>
                  </div>

                  {victoryReport.alreadyCompleted && (
                    <p className="text-[10px] text-slate-500 italic pt-1">
                      * You previously conquered this quest. No duplicate XP was awarded.
                    </p>
                  )}
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
