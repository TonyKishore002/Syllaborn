import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Heart,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  Clock,
  Swords,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BossSlayerConfig, BossPhaseId, BossCombatStats } from '../../types/boss';
import { GameQuestion } from '../../types';
import { soundFX } from '../../lib/audio-effects';
import { getProfessorPanicComment, PanicMood } from '../../lib/professor-panic';
import { triggerLevelUpCelebration } from '../../lib/celebration';

interface BossSlayerGameProps {
  config: BossSlayerConfig;
  onComplete: (score: number, stats: BossCombatStats) => void;
  onExit?: () => void;
  alreadyCompleted?: boolean;
}

interface FloatingText {
  id: string;
  text: string;
  type: 'damage-boss' | 'crit-boss' | 'damage-player' | 'dodge' | 'heal' | 'phase';
  x: number;
  y: number;
}

export const BossSlayerGame: React.FC<BossSlayerGameProps> = ({
  config,
  onComplete,
  onExit,
  alreadyCompleted = false,
}) => {
  // Combat State
  const [gameState, setGameState] = useState<'intro' | 'combat' | 'phase_transition' | 'victory' | 'defeat'>('intro');
  const [currentPhaseId, setCurrentPhaseId] = useState<BossPhaseId>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const maxPlayerHp = 100;
  const [bossHp, setBossHp] = useState<number>(config.maxHp);
  const [potionsLeft, setPotionsLeft] = useState<number>(2);
  const [streak, setStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundFX.getMuted());

  // Dodge state
  const [dodgeCooldown, setDodgeCooldown] = useState<boolean>(false);
  const [isDodging, setIsDodging] = useState<boolean>(false);

  // Attack timer & telegraph
  const [currentAttackIndex, setCurrentAttackIndex] = useState<number>(0);
  const [attackTimerMs, setAttackTimerMs] = useState<number>(8000);
  const [attackMaxMs, setAttackMaxMs] = useState<number>(8000);
  const [isTelegraphing, setIsTelegraphing] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Question State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Professor Panic companion feedback
  const [panicDialogue, setPanicDialogue] = useState<string>(config.lore);

  // Floating combat text
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Finalized Combat Stats for Victory/Defeat screen rendering
  const [finalStats, setFinalStats] = useState<BossCombatStats | null>(null);

  // Combat Stats

  const statsRef = useRef<BossCombatStats>({
    damageDealt: 0,
    damageTaken: 0,
    attacksDodged: 0,
    attacksFailed: 0,
    potionsUsed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    maxStreak: 0,
    phaseReached: 1,
    durationSeconds: 0,
  });

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
  }, []);

  const activePhase = config.phases[currentPhaseId - 1];
  const activeQuestions = activePhase.questions;
  const currentQuestion: GameQuestion | undefined = activeQuestions[currentQuestionIndex % activeQuestions.length];
  const activeAttack = config.attacks[currentAttackIndex % config.attacks.length];

  // Spawn floating combat indicator
  const addFloatingText = useCallback(
    (text: string, type: FloatingText['type'], x: number = 50, y: number = 50) => {
      const id = `ft-${Date.now()}-${Math.random()}`;
      setFloatingTexts((prev) => [...prev, { id, text, type, x, y }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1200);
    },
    []
  );

  // Trigger brief screen shake on heavy impacts
  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 450);
  }, []);

  // Set Panic reaction
  const triggerPanic = useCallback((mood: PanicMood, customContext?: string) => {
    setPanicDialogue(getProfessorPanicComment(mood, customContext));
  }, []);

  // Advance to next question in the current phase
  const advanceQuestion = useCallback(() => {
    setSelectedOption(null);
    setAnsweredState('idle');
    setShowHint(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % activeQuestions.length);
  }, [activeQuestions.length]);

  // Setup attack cooldown for current phase
  const resetAttackTimer = useCallback(() => {
    const nextAtkIdx = Math.floor(Math.random() * config.attacks.length);
    setCurrentAttackIndex(nextAtkIdx);
    const atk = config.attacks[nextAtkIdx];
    const multiplier = activePhase.attackCooldownMultiplier || 1.0;
    const duration = Math.max(4500, Math.round(atk.cooldownSeconds * 1000 * multiplier));
    setAttackMaxMs(duration);
    setAttackTimerMs(duration);
    setIsTelegraphing(false);
  }, [activePhase.attackCooldownMultiplier, config.attacks]);

  // Execute dodge action
  const handleDodge = useCallback(() => {
    if (gameState !== 'combat' || dodgeCooldown || isDodging) return;

    setIsDodging(true);
    setDodgeCooldown(true);
    soundFX.playDodge();

    // Check if player successfully dodged an active telegraph window
    const dodgeWindow = activeAttack.dodgeWindowMs || 2000;
    if (attackTimerMs <= dodgeWindow && attackTimerMs > 0) {
      // Parried / Evaded!
      statsRef.current.attacksDodged += 1;
      addFloatingText('⚡ DODGED! 0 DMG', 'dodge', 60, 40);
      triggerPanic('boss_dodge_success');

      // Stagger boss and reset attack timer
      resetAttackTimer();
    } else {
      addFloatingText('Dodge Ready', 'dodge', 50, 60);
    }

    setTimeout(() => setIsDodging(false), 300);
    setTimeout(() => setDodgeCooldown(false), 1200);
  }, [
    activeAttack.dodgeWindowMs,
    addFloatingText,
    attackTimerMs,
    dodgeCooldown,
    gameState,
    isDodging,
    resetAttackTimer,
    triggerPanic,
  ]);

  // Drink healing potion
  const handleDrinkPotion = useCallback(() => {
    if (gameState !== 'combat' || potionsLeft <= 0 || playerHp >= maxPlayerHp) return;

    soundFX.playHeal();
    const healAmount = 35;
    const newHp = Math.min(maxPlayerHp, playerHp + healAmount);
    setPlayerHp(newHp);
    setPotionsLeft((prev) => prev - 1);
    statsRef.current.potionsUsed += 1;

    addFloatingText(`+${healAmount} HP (Potion)`, 'heal', 40, 65);
    triggerPanic('boss_potion_used');
  }, [addFloatingText, gameState, maxPlayerHp, playerHp, potionsLeft, triggerPanic]);

  // Answer selection
  const handleSelectOption = useCallback(
    (index: number) => {
      if (gameState !== 'combat' || answeredState !== 'idle' || !currentQuestion) return;

      setSelectedOption(index);
      statsRef.current.questionsAnswered += 1;

      const isCorrect = index === currentQuestion.correctAnswerIndex;

      if (isCorrect) {
        setAnsweredState('correct');
        statsRef.current.correctAnswers += 1;
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > statsRef.current.maxStreak) {
          statsRef.current.maxStreak = newStreak;
        }

        // Calculate damage
        const baseDmg = 35;
        const streakBonus = Math.min(1.5, 1 + newStreak * 0.1);
        const isWeaknessTargeted = currentQuestion.question
          .toLowerCase()
          .includes(config.weakness.toLowerCase().slice(0, 10));
        const weaknessMult = isWeaknessTargeted ? config.weaknessMultiplier : 1.0;
        const finalDamage = Math.round(baseDmg * streakBonus * weaknessMult);

        soundFX.playAttack();
        setTimeout(() => soundFX.playCorrect(), 100);

        statsRef.current.damageDealt += finalDamage;
        const newBossHp = Math.max(0, bossHp - finalDamage);
        setBossHp(newBossHp);

        if (weaknessMult > 1.0 || newStreak >= 3) {
          addFloatingText(`💥 CRITICAL! -${finalDamage} DMG!`, 'crit-boss', 65, 30);
        } else {
          addFloatingText(`⚔️ -${finalDamage} DMG`, 'damage-boss', 65, 30);
        }

        // Interrupt / delay incoming boss attack
        setAttackTimerMs((prev) => Math.min(attackMaxMs, prev + 2500));
        triggerPanic('correct');

        // Check for phase transitions or boss victory
        const hpPercent = (newBossHp / config.maxHp) * 100;

        if (newBossHp <= 0) {
          // BOSS VICTORY!
          setTimeout(() => {
            statsRef.current.durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
            const final = { ...statsRef.current };
            setFinalStats(final);
            setGameState('victory');
            soundFX.playVictory();
            triggerLevelUpCelebration();
            triggerPanic('boss_victory');
            const score = Math.max(
              300,
              Math.round(
                final.damageDealt +
                  final.attacksDodged * 50 +
                  final.correctAnswers * 40 -
                  final.damageTaken
              )
            );
            onComplete(score, final);
          }, 800);
        } else if (currentPhaseId === 1 && hpPercent <= 66) {
          // Trigger Phase 2 Transition
          setGameState('phase_transition');
          soundFX.playPhaseShift();
          triggerShake();
          setCurrentPhaseId(2);
          statsRef.current.phaseReached = 2;
          triggerPanic('boss_phase2');
          addFloatingText('⚠️ PHASE 2: BOSS ENRAGED!', 'phase', 50, 40);

          setTimeout(() => {
            setGameState('combat');
            resetAttackTimer();
            advanceQuestion();
          }, 2400);
        } else if (currentPhaseId === 2 && hpPercent <= 33) {
          // Trigger Phase 3 Transition
          setGameState('phase_transition');
          soundFX.playPhaseShift();
          triggerShake();
          setCurrentPhaseId(3);
          statsRef.current.phaseReached = 3;
          triggerPanic('boss_phase3');
          addFloatingText('🔥 PHASE 3: FINAL EXAM OVERDRIVE!', 'phase', 50, 40);

          setTimeout(() => {
            setGameState('combat');
            resetAttackTimer();
            advanceQuestion();
          }, 2400);
        } else {
          // Normal advance
          setTimeout(() => {
            advanceQuestion();
          }, 1200);
        }
      } else {
        // WRONG ANSWER: Boss counters immediately!
        setAnsweredState('wrong');
        setStreak(0);
        soundFX.playWrong();
        soundFX.playBossRoar();
        triggerShake();

        const counterDamage = 18;
        statsRef.current.damageTaken += counterDamage;
        const newPlayerHp = Math.max(0, playerHp - counterDamage);
        setPlayerHp(newPlayerHp);

        addFloatingText(`❌ COUNTER! -${counterDamage} HP`, 'damage-player', 40, 60);

        if (newPlayerHp <= 0) {
          setTimeout(() => {
            statsRef.current.durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
            setFinalStats({ ...statsRef.current });
            setGameState('defeat');
            triggerPanic('boss_defeat');
          }, 700);
        } else {
          if (newPlayerHp <= 30) {
            triggerPanic('boss_player_low_hp');
          } else {
            triggerPanic('wrong');
          }

          // Advance question after viewing explanation
          setTimeout(() => {
            advanceQuestion();
          }, 1800);
        }
      }
    },
    [
      addFloatingText,
      advanceQuestion,
      answeredState,
      attackMaxMs,
      bossHp,
      config.maxHp,
      config.weakness,
      config.weaknessMultiplier,
      currentPhaseId,
      currentQuestion,
      gameState,
      onComplete,
      playerHp,
      resetAttackTimer,
      streak,
      triggerPanic,
      triggerShake,
    ]
  );

  // Real-time tick loop for boss attacks
  useEffect(() => {
    if (gameState !== 'combat') return;

    const interval = setInterval(() => {
      setAttackTimerMs((prev) => {
        const next = prev - 100;
        const dodgeWindow = activeAttack.dodgeWindowMs || 2000;

        // Check if entered telegraph window
        if (next <= dodgeWindow && next > 0) {
          setIsTelegraphing(true);
        }

        // If attack timer has expired
        if (next <= 0) {
          // Boss attack hits the player!
          soundFX.playBossRoar();
          soundFX.playWrong();
          triggerShake();
          statsRef.current.attacksFailed += 1;

          const dmg = activeAttack.damage || 22;
          statsRef.current.damageTaken += dmg;

          setPlayerHp((p) => {
            const nextHp = Math.max(0, p - dmg);
            if (nextHp <= 0) {
              statsRef.current.durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
              setFinalStats({ ...statsRef.current });
              setGameState('defeat');
              triggerPanic('boss_defeat');
            } else if (nextHp <= 30) {
              triggerPanic('boss_player_low_hp');
            }
            return nextHp;
          });

          addFloatingText(`💥 ${activeAttack.name}! -${dmg} HP`, 'damage-player', 40, 60);
          resetAttackTimer();
          return 0;
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [
    activeAttack.damage,
    activeAttack.dodgeWindowMs,
    activeAttack.name,
    addFloatingText,
    gameState,
    resetAttackTimer,
    triggerPanic,
    triggerShake,
  ]);

  // Global Keyboard Event Handlers (Space = Dodge, H = Heal, 1-4 = Answers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for dodge
      if (e.code === 'Space') {
        e.preventDefault();
        handleDodge();
      }
      // 'H' or 'h' for potion
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleDrinkPotion();
      }
      // Number keys 1-4 or letters A-D
      if (answeredState === 'idle' && gameState === 'combat' && currentQuestion) {
        if (e.key === '1' || e.key === 'a' || e.key === 'A') {
          handleSelectOption(0);
        } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
          handleSelectOption(1);
        } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
          handleSelectOption(2);
        } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
          handleSelectOption(3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answeredState, currentQuestion, gameState, handleDodge, handleDrinkPotion, handleSelectOption]);

  // Restart Encounter (Rematch)
  const handleRestart = () => {
    setPlayerHp(maxPlayerHp);
    setBossHp(config.maxHp);
    setPotionsLeft(2);
    setStreak(0);
    setCurrentPhaseId(1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setAnsweredState('idle');
    setGameState('combat');
    resetAttackTimer();
    startTimeRef.current = Date.now();
    statsRef.current = {
      damageDealt: 0,
      damageTaken: 0,
      attacksDodged: 0,
      attacksFailed: 0,
      potionsUsed: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      maxStreak: 0,
      phaseReached: 1,
      durationSeconds: 0,
    };
    triggerPanic('retry');
  };

  // Start battle from intro screen
  const handleStartCombat = () => {
    setGameState('combat');
    resetAttackTimer();
    startTimeRef.current = Date.now();
  };

  // Boss HP calculation & Phase color
  const bossHpPercent = Math.max(0, Math.min(100, (bossHp / config.maxHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / maxPlayerHp) * 100));
  const attackProgress = Math.max(0, Math.min(100, (1 - attackTimerMs / attackMaxMs) * 100));

  return (
    <div
      className={`relative w-full h-full min-h-[580px] flex flex-col select-none bg-[#0a0d1a] text-slate-100 overflow-hidden font-sans transition-transform duration-75 ${
        screenShake ? 'animate-bounce translate-x-1 -translate-y-1' : ''
      }`}
    >
      {/* Top Combat HUD: Audio Toggle, Phase Indicator, Boss & Player HP */}
      <div className="px-4 py-2.5 bg-[#0f1429] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg shadow-sm">
            {config.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-fantasy font-black text-sm text-slate-100">
                {config.bossName}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {config.courseCode || 'COURSE'} • {config.weightPercent}% Weight
              </span>
            </div>
            <div className="text-[11px] text-purple-300 flex items-center gap-2">
              <span>{activePhase.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 font-mono">Weakness: {config.weakness}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {streak > 1 && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>{streak}x Streak</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsMuted(soundFX.toggleMute())}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-all"
            >
              Exit Arena
            </button>
          )}
        </div>
      </div>

      {/* Real-time Health Bars & Boss Attack Cooldown Bar */}
      <div className="px-4 py-2 bg-[#121730]/90 border-b border-purple-500/15 grid grid-cols-1 md:grid-cols-2 gap-3 z-20">
        {/* Boss HP Bar with 3-Phase Notches */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-fantasy font-bold flex items-center gap-1.5 text-rose-300">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Boss Health</span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              {bossHp} / {config.maxHp} HP ({Math.round(bossHpPercent)}%)
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-rose-500/30 shadow-inner">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                currentPhaseId === 3
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 animate-pulse'
                  : currentPhaseId === 2
                  ? 'bg-gradient-to-r from-amber-600 to-rose-500'
                  : 'bg-gradient-to-r from-purple-600 to-rose-600'
              }`}
              style={{ width: `${bossHpPercent}%` }}
            />
            {/* Phase divider notches at 66% and 33% */}
            <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-slate-950/80 z-10" title="Phase 2 Threshold" />
            <div className="absolute top-0 bottom-0 left-[33%] w-0.5 bg-slate-950/80 z-10" title="Phase 3 Threshold" />
          </div>
        </div>

        {/* Player HP Bar and Potion Counter */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-fantasy font-bold flex items-center gap-1.5 text-cyan-300">
              <Heart className={`w-3.5 h-3.5 text-cyan-400 fill-cyan-400 ${playerHp <= 30 ? 'animate-ping' : ''}`} />
              <span>Player Health</span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              {playerHp} / {maxPlayerHp} HP
            </span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30 shadow-inner">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                playerHp <= 30
                  ? 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-emerald-500'
              }`}
              style={{ width: `${playerHpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Floating Combat Text Container */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className={`absolute font-fantasy font-black text-sm sm:text-base animate-out fade-out slide-out-to-top duration-1000 ${
              ft.type === 'damage-boss'
                ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]'
                : ft.type === 'crit-boss'
                ? 'text-rose-400 text-lg sm:text-xl drop-shadow-[0_2px_12px_rgba(244,63,94,0.9)] animate-bounce'
                : ft.type === 'damage-player'
                ? 'text-red-500 text-lg drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]'
                : ft.type === 'dodge'
                ? 'text-cyan-300 text-base drop-shadow-[0_2px_8px_rgba(6,182,212,0.8)]'
                : ft.type === 'heal'
                ? 'text-emerald-300 text-base drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]'
                : 'text-purple-300 text-xl font-black drop-shadow-[0_2px_12px_rgba(168,85,247,0.9)]'
            }`}
            style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* MAIN GAMEPLAY CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-y-auto p-3 sm:p-5">
        {/* INTRO SCREEN */}
        {gameState === 'intro' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#11162d] border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 rounded-3xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-6xl mx-auto shadow-xl shadow-purple-950/60">
                {config.avatar}
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold block mb-1">
                  SEMESTER BOSS ENCOUNTER
                </span>
                <h2 className="font-fantasy font-black text-2xl sm:text-3xl text-slate-100">
                  {config.bossName}
                </h2>
                <p className="text-xs text-purple-300 font-mono mt-1">
                  {config.bossTitle} • {config.maxHp} HP
                </p>
              </div>

              <blockquote className="p-3.5 rounded-2xl bg-[#090c1a] border border-purple-500/20 text-xs italic text-slate-300">
                {config.lore}
              </blockquote>

              {/* Combat Rules Brief */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-300 flex items-center gap-1 font-fantasy">
                    <Swords className="w-3.5 h-3.5" /> 3 Combat Phases
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Phase 1 (Basics) → Phase 2 (Application) → Phase 3 (Comprehensive Final).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1 font-fantasy">
                    <Shield className="w-3.5 h-3.5" /> Real-time Dodge
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Boss charges attacks on a timer. Hit DODGE or Spacebar during the red warning!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartCombat}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 text-white font-fantasy font-black text-base shadow-xl shadow-purple-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                ENTER ARENA & COMMENCE FIGHT ⚔️
              </button>
            </div>
          </div>
        )}

        {/* PHASE TRANSITION BANNER OVERLAY */}
        {gameState === 'phase_transition' && (
          <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className="max-w-md w-full bg-[#18112e] border-2 border-rose-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-4xl mx-auto animate-bounce">
                ⚡
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                  PHASE SHIFT DETECTED
                </span>
                <h3 className="font-fantasy font-black text-2xl text-slate-100">
                  {activePhase.name}
                </h3>
                <p className="text-xs text-rose-300 font-medium mt-1">
                  {activePhase.subtitle}
                </p>
              </div>

              <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-rose-500/30">
                {activePhase.bossStance}
              </p>

              <div className="text-[11px] font-mono text-cyan-300 animate-pulse">
                Attacks charging faster! Prepare your answers and dodge reflexes!
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE COMBAT VIEW */}
        {gameState === 'combat' && currentQuestion && (
          <div className="flex-1 flex flex-col justify-between max-w-3xl mx-auto w-full gap-4">
            {/* Real-time Boss Attack Telegraph Warning Bar */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isTelegraphing
                  ? 'bg-rose-950/60 border-rose-500 animate-pulse shadow-lg shadow-rose-950/50'
                  : 'bg-[#101429] border-purple-500/20'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-fantasy font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className={`w-4 h-4 ${isTelegraphing ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
                  <span>
                    {isTelegraphing
                      ? activeAttack.telegraphText
                      : `Boss preparing: ${activeAttack.name}`}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {(attackTimerMs / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Telegraph progress bar */}
              <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full transition-all duration-100 ${
                    isTelegraphing
                      ? 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 to-cyan-500'
                  }`}
                  style={{ width: `${attackProgress}%` }}
                />
              </div>
            </div>

            {/* Question Card Grounded in Syllabus */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#11162e]/90 border border-purple-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length} • {activePhase.subtitle}
                </span>

                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Academic Hint'}</span>
                </button>
              </div>

              <h3 className="font-fantasy font-bold text-sm sm:text-base text-slate-100 leading-snug">
                {currentQuestion.question}
              </h3>

              {showHint && currentQuestion.hint && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  💡 <strong>Professor Hint:</strong> {currentQuestion.hint}
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentQuestion.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctAnswerIndex;

                  let btnStyle = 'bg-slate-900/80 border-purple-500/20 hover:border-purple-500/50 text-slate-200';
                  if (answeredState !== 'idle') {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/40';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-lg shadow-rose-950/40';
                    } else {
                      btnStyle = 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={answeredState !== 'idle'}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle} hover:scale-[1.01] active:scale-[0.99]`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {letter}
                      </span>
                      <span className="leading-relaxed flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant feedback on question answer */}
              {answeredState !== 'idle' && (
                <div
                  className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    answeredState === 'correct'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {answeredState === 'correct' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block mb-0.5">
                      {answeredState === 'correct' ? 'Correct Strike!' : 'Incorrect - Boss Countered!'}
                    </span>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Combat Action Bar: DODGE & HEAL POTION */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Giant DODGE button */}
              <button
                type="button"
                disabled={dodgeCooldown}
                onClick={handleDodge}
                className={`py-3.5 px-4 rounded-2xl font-fantasy font-black text-sm sm:text-base border transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isTelegraphing
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white border-red-400 animate-pulse shadow-red-950/60 scale-[1.02]'
                    : dodgeCooldown
                    ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/40'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>{dodgeCooldown ? 'DODGING...' : isTelegraphing ? 'DODGE NOW! (SPACE)' : 'DODGE (SPACE)'}</span>
              </button>

              {/* HEAL POTION button */}
              <button
                type="button"
                disabled={potionsLeft <= 0 || playerHp >= maxPlayerHp}
                onClick={handleDrinkPotion}
                className={`py-3.5 px-4 rounded-2xl font-fantasy font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 shadow-lg ${
                  potionsLeft > 0 && playerHp < maxPlayerHp
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40 shadow-emerald-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="text-base">🧪</span>
                <span>Potion (x{potionsLeft}) • +35 HP [H]</span>
              </button>
            </div>

            {/* Professor Panic Live Commentary */}
            <div className="p-3 rounded-2xl bg-[#0c0f20] border border-purple-500/20 flex items-center gap-3">
              <span className="text-2xl shrink-0" role="img" aria-label="Professor Panic">
                👨‍🏫
              </span>
              <p className="text-xs text-purple-200 italic leading-snug">
                "{panicDialogue}"
              </p>
            </div>
          </div>
        )}

        {/* DEFEAT SCREEN */}
        {gameState === 'defeat' && (
          <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className="max-w-md w-full bg-[#160d1b] border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-5xl mx-auto shadow-xl shadow-rose-950/50">
                💀
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold block mb-1">
                  EXAMINATION OVER
                </span>
                <h2 className="font-fantasy font-black text-2xl sm:text-3xl text-slate-100">
                  DEFEATED BY THE BOSS!
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {config.bossName} ({config.bossTitle})
                </p>
              </div>

              {/* Combat Summary Stats */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-rose-500/20 text-xs text-slate-300 text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phase Reached:</span>
                  <span className="font-bold text-amber-300">Phase {finalStats?.phaseReached ?? 1} of 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Damage Dealt:</span>
                  <span className="font-mono text-cyan-300 font-bold">{finalStats?.damageDealt ?? 0} DMG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attacks Dodged:</span>
                  <span className="font-mono text-emerald-300 font-bold">{finalStats?.attacksDodged ?? 0}</span>
                </div>
              </div>

              <blockquote className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs italic text-purple-200">
                "{panicDialogue}"
              </blockquote>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-fantasy font-bold text-xs shadow-lg transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Try Again (Rematch) 🔄
                </button>

                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-fantasy font-bold text-xs transition-all"
                  >
                    Return to Syllabus
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VICTORY SCREEN */}
        {gameState === 'victory' && (
          <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
            <div className="max-w-md w-full bg-[#11192e] border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-5xl mx-auto shadow-xl shadow-emerald-950/50 animate-bounce">
                👑
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  BOSS SLAYER CONQUEST
                </span>
                <h2 className="font-fantasy font-black text-2xl sm:text-3xl text-slate-100">
                  BOSS VANQUISHED!
                </h2>
                <p className="text-xs text-emerald-300 font-mono mt-1">
                  {config.bossName} ({config.bossTitle})
                </p>
              </div>

              {/* Combat Stats Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/25 text-xs text-slate-300 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Course Assessment:</span>
                  <span className="font-bold text-slate-200">{config.courseName || 'Curriculum'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grading Weight Defeated:</span>
                  <span className="font-mono text-cyan-300 font-bold">{config.weightPercent}% Weight</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attacks Dodged:</span>
                  <span className="font-mono text-emerald-300 font-bold">{finalStats?.attacksDodged ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="font-mono text-purple-300 font-bold">
                    {finalStats?.correctAnswers ?? 0} / {finalStats?.questionsAnswered ?? 0}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                  <span className="text-amber-300">XP Reward:</span>
                  <span className="font-mono text-emerald-300 text-sm">
                    {alreadyCompleted ? '+0 XP (Practice Replay)' : `+${Math.max(250, config.maxHp)} XP`}
                  </span>
                </div>
              </div>

              <blockquote className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs italic text-emerald-200">
                "{panicDialogue}"
              </blockquote>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-fantasy font-bold text-xs transition-all"
                >
                  Fight Again 🔄
                </button>

                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-fantasy font-bold text-xs shadow-lg transition-all"
                  >
                    Claim Victory ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
