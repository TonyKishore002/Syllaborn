import React, { useState, useEffect } from 'react';
import {
  Puzzle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trophy,
  Volume2,
  VolumeX,
  Lightbulb,
  GripVertical,
} from 'lucide-react';
import { QuestGameConfig, PuzzleMatchingPair, PuzzleStepItem } from '../../types';
import { getProfessorPanicComment } from '../../lib/professor-panic';
import { soundFX } from '../../lib/audio-effects';
import { PuzzleQuest3D } from '../game3d/PuzzleQuest3D';

interface PuzzleQuestGameProps {
  gameConfig: QuestGameConfig;
  onComplete: (score: number) => void;
  courseCode?: string;
  courseTitle?: string;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class Puzzle3DErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Caught error in 3D Puzzle Quest, rendering 2D fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const PuzzleQuestGame: React.FC<PuzzleQuestGameProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
}) => {
  const [use3DEngine, setUse3DEngine] = useState<boolean>(true);

  if (use3DEngine) {
    return (
      <Puzzle3DErrorBoundary
        fallback={
          <PuzzleQuestGame2D
            gameConfig={gameConfig}
            onComplete={onComplete}
            courseCode={courseCode}
            courseTitle={courseTitle}
          />
        }
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Toggle back to 2D */}
          <div className="absolute top-3.5 right-24 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={() => setUse3DEngine(false)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1322]/90 hover:bg-[#131B2E] text-[10px] font-bold text-slate-200 border border-slate-700/60 shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              title="Switch to Classic 2D Puzzle Cards"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>3D Dungeon (Switch to 2D)</span>
            </button>
          </div>
          <PuzzleQuest3D
            gameConfig={gameConfig}
            onComplete={onComplete}
            courseCode={courseCode}
            courseTitle={courseTitle}
            onFallbackTo2D={() => setUse3DEngine(false)}
          />
        </div>
      </Puzzle3DErrorBoundary>
    );
  }

  return (
    <PuzzleQuestGame2D
      gameConfig={gameConfig}
      onComplete={onComplete}
      courseCode={courseCode}
      courseTitle={courseTitle}
      onSwitchTo3D={() => setUse3DEngine(true)}
    />
  );
};

interface PuzzleQuestGame2DProps extends PuzzleQuestGameProps {
  onSwitchTo3D?: () => void;
}

const PuzzleQuestGame2D: React.FC<PuzzleQuestGame2DProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
  onSwitchTo3D,
}) => {

  const [isMuted, setIsMuted] = useState(soundFX.getMuted());
  const puzzleData = gameConfig.puzzleData;

  // Determine initial active mode ('matching' vs 'ordering')
  const initialMode =
    puzzleData?.type === 'ordering' || puzzleData?.type === 'step-ordering'
      ? 'ordering'
      : 'matching';
  const [activeMode, setActiveMode] = useState<'matching' | 'ordering'>(initialMode);

  // Score & Hints
  const [score, setScore] = useState(100);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [highlightedPairId, setHighlightedPairId] = useState<string | null>(null);
  const [highlightedStepId, setHighlightedStepId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Matching Mode State
  // ---------------------------------------------------------------------------
  const defaultPairs: PuzzleMatchingPair[] =
    puzzleData?.pairs && puzzleData.pairs.length > 0
      ? puzzleData.pairs
      : [
          {
            id: 'p1',
            left: `${gameConfig.topic} (Definition)`,
            right: 'Primary theoretical formulation, formal scope, and core model',
            term: `${gameConfig.topic} (Definition)`,
            definition: 'Primary theoretical formulation, formal scope, and core model',
            explanation: `Establishes the foundational academic definition of ${gameConfig.topic}.`,
            hint: 'This concept defines the theoretical scope of the subject.',
          },
          {
            id: 'p2',
            left: 'Core Principle',
            right: 'Fundamental operational rule that must remain preserved across all state transitions',
            term: 'Core Principle',
            definition: 'Fundamental operational rule that must remain preserved across all state transitions',
            explanation: 'Guarantees execution invariants and prevents system corruption.',
            hint: 'The foundational constraint that governs valid operations.',
          },
          {
            id: 'p3',
            left: 'Practical Application',
            right: 'Concrete implementation in coursework problem sets, labs, and real-world systems',
            term: 'Practical Application',
            definition: 'Concrete implementation in coursework problem sets, labs, and real-world systems',
            explanation: 'Bridges theoretical principles with hands-on technical execution.',
            hint: 'How this theory is put into practice in projects and assignments.',
          },
          {
            id: 'p4',
            left: 'Analytical Verification',
            right: 'Systematic testing of edge cases, boundary parameters, and output accuracy',
            term: 'Analytical Verification',
            definition: 'Systematic testing of edge cases, boundary parameters, and output accuracy',
            explanation: 'Confirms that the implementation satisfies all grading constraints and edge cases.',
            hint: 'The formal testing stage ensuring correctness under all conditions.',
          },
        ];

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [mismatchedLeft, setMismatchedLeft] = useState<string | null>(null);
  const [mismatchedRight, setMismatchedRight] = useState<string | null>(null);
  const [draggedLeftId, setDraggedLeftId] = useState<string | null>(null);
  const [shuffledRights, setShuffledRights] = useState<
    Array<{ id: string; text: string; explanation?: string }>
  >([]);

  // ---------------------------------------------------------------------------
  // Step Ordering Mode State
  // ---------------------------------------------------------------------------
  const defaultSteps: PuzzleStepItem[] =
    puzzleData?.steps && puzzleData.steps.length > 0
      ? puzzleData.steps
      : [
          {
            id: 's1',
            order: 1,
            text: `Review the foundational definitions and prerequisites of ${gameConfig.topic}`,
            explanation: 'Preparation and review of prerequisite concepts.',
          },
          {
            id: 's2',
            order: 2,
            text: `Construct the initial model or setup input parameters`,
            explanation: 'Problem formulation and boundary parameter configuration.',
          },
          {
            id: 's3',
            order: 3,
            text: `Apply the core transformation while preserving boundary invariants`,
            explanation: 'Core algorithmic or procedural execution.',
          },
          {
            id: 's4',
            order: 4,
            text: `Evaluate final correctness against expected academic constraints`,
            explanation: 'Verification of solution output and rubric satisfaction.',
          },
        ];

  const [orderedSteps, setOrderedSteps] = useState<PuzzleStepItem[]>([]);
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [dragOverStepIndex, setDragOverStepIndex] = useState<number | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState(false);

  // ---------------------------------------------------------------------------
  // Game & Professor Panic State
  // ---------------------------------------------------------------------------
  const [isPuzzleCompleted, setIsPuzzleCompleted] = useState(false);
  const [professorMessage, setProfessorMessage] = useState<string>(
    initialMode === 'ordering'
      ? 'Drag or click-to-swap the steps into their verified sequential syllabus order!'
      : 'Match each syllabus concept on the left with its definition on the right!'
  );

  // Initialize and shuffle puzzle elements
  useEffect(() => {
    // Shuffle rights for matching
    const rights = defaultPairs.map((p) => ({
      id: p.id,
      text: p.right || p.definition || '',
      explanation: p.explanation,
    }));
    for (let i = rights.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rights[i], rights[j]] = [rights[j], rights[i]];
    }
    setShuffledRights(rights);

    // Shuffle steps for ordering
    const steps = [...defaultSteps];
    for (let i = steps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [steps[i], steps[j]] = [steps[j], steps[i]];
    }
    setOrderedSteps(steps);
    setMatchedPairs(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsPuzzleCompleted(false);
  }, [gameConfig.topic, puzzleData]);

  // ---------------------------------------------------------------------------
  // Matching Handlers
  // ---------------------------------------------------------------------------
  const handleLeftClick = (id: string) => {
    if (matchedPairs.has(id)) return;
    setSelectedLeft(id);
    setMismatchedLeft(null);
    setMismatchedRight(null);

    if (selectedRight) {
      checkMatch(id, selectedRight);
    }
  };

  const handleRightClick = (id: string) => {
    if (matchedPairs.has(id)) return;
    setSelectedRight(id);
    setMismatchedLeft(null);
    setMismatchedRight(null);

    if (selectedLeft) {
      checkMatch(selectedLeft, id);
    }
  };

  const handleLeftDragStart = (e: React.DragEvent, id: string) => {
    if (matchedPairs.has(id)) return;
    setDraggedLeftId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleRightDrop = (e: React.DragEvent, rightId: string) => {
    e.preventDefault();
    const leftId = e.dataTransfer.getData('text/plain') || draggedLeftId;
    if (leftId && !matchedPairs.has(rightId)) {
      checkMatch(leftId, rightId);
    }
    setDraggedLeftId(null);
  };

  const checkMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      soundFX.playCorrect();
      const updated = new Set(matchedPairs);
      updated.add(leftId);
      setMatchedPairs(updated);
      setSelectedLeft(null);
      setSelectedRight(null);
      setMismatchedLeft(null);
      setMismatchedRight(null);
      setProfessorMessage(getProfessorPanicComment('puzzle_match'));

      if (updated.size === defaultPairs.length) {
        soundFX.playVictory();
        setIsPuzzleCompleted(true);
        setProfessorMessage(getProfessorPanicComment('quest_complete'));
      }
    } else {
      soundFX.playWrong();
      setScore((prev) => Math.max(25, prev - 10));
      setMismatchedLeft(leftId);
      setMismatchedRight(rightId);
      setProfessorMessage(getProfessorPanicComment('puzzle_wrong'));

      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setMismatchedLeft(null);
        setMismatchedRight(null);
      }, 900);
    }
  };

  // ---------------------------------------------------------------------------
  // Step Ordering & Drag-and-Drop Sorting Handlers
  // ---------------------------------------------------------------------------
  const handleStepDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleStepDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStepIndex !== index) {
      setDragOverStepIndex(index);
    }
  };

  const handleStepDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverStepIndex(null);
    if (draggedStepIndex === null || draggedStepIndex === targetIndex) return;

    soundFX.playJump();
    const updated = [...orderedSteps];
    const [removed] = updated.splice(draggedStepIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setOrderedSteps(updated);
    setDraggedStepIndex(null);
    setIsOrderSubmitted(false);
    setOrderCorrect(false);
  };

  const handleStepDragLeave = () => {
    setDragOverStepIndex(null);
  };

  const handleStepDragEnd = () => {
    setDraggedStepIndex(null);
    setDragOverStepIndex(null);
  };

  const handleStepClickToSelect = (index: number) => {
    if (isPuzzleCompleted) return;
    if (selectedStepIndex === null) {
      setSelectedStepIndex(index);
      soundFX.playJump();
    } else if (selectedStepIndex === index) {
      setSelectedStepIndex(null);
    } else {
      soundFX.playJump();
      const updated = [...orderedSteps];
      [updated[selectedStepIndex], updated[index]] = [updated[index], updated[selectedStepIndex]];
      setOrderedSteps(updated);
      setSelectedStepIndex(null);
      setIsOrderSubmitted(false);
      setOrderCorrect(false);
    }
  };

  const moveStepUp = (idx: number) => {
    if (idx === 0) return;
    soundFX.playJump();
    const updated = [...orderedSteps];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    setOrderedSteps(updated);
    setIsOrderSubmitted(false);
    setOrderCorrect(false);
  };

  const moveStepDown = (idx: number) => {
    if (idx === orderedSteps.length - 1) return;
    soundFX.playJump();
    const updated = [...orderedSteps];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setOrderedSteps(updated);
    setIsOrderSubmitted(false);
    setOrderCorrect(false);
  };

  const handleCheckOrder = () => {
    const isCorrect = orderedSteps.every((step, idx) => step.order === idx + 1);
    setIsOrderSubmitted(true);
    setOrderCorrect(isCorrect);

    if (isCorrect) {
      soundFX.playVictory();
      setIsPuzzleCompleted(true);
      setProfessorMessage(getProfessorPanicComment('puzzle_order_correct'));
    } else {
      soundFX.playWrong();
      setScore((prev) => Math.max(25, prev - 10));
      setProfessorMessage(getProfessorPanicComment('puzzle_order_wrong'));
    }
  };

  // ---------------------------------------------------------------------------
  // Hints System
  // ---------------------------------------------------------------------------
  const handleSummonHint = () => {
    if (hintsRemaining <= 0 || isPuzzleCompleted) return;

    setHintsRemaining((prev) => Math.max(0, prev - 1));
    setScore((prev) => Math.max(25, prev - 5));

    if (activeMode === 'matching') {
      const unmatched = defaultPairs.find((p) => !matchedPairs.has(p.id));
      if (unmatched) {
        setHighlightedPairId(unmatched.id);
        const hintText =
          unmatched.hint ||
          `Look closely: "${unmatched.left}" connects with "${(unmatched.right || unmatched.definition || '').slice(0, 32)}..."`;
        setActiveHint(hintText);
        setProfessorMessage(getProfessorPanicComment('puzzle_hint'));
        setTimeout(() => setHighlightedPairId(null), 4000);
      }
    } else {
      const misplaced = orderedSteps.find((s, idx) => s.order !== idx + 1);
      if (misplaced) {
        setHighlightedStepId(misplaced.id);
        const hintText = `Syllabus Clue: "${misplaced.text.slice(0, 35)}..." belongs at Step #${misplaced.order}!`;
        setActiveHint(hintText);
        setProfessorMessage(getProfessorPanicComment('puzzle_hint'));
        setTimeout(() => setHighlightedStepId(null), 4000);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Reset Puzzle
  // ---------------------------------------------------------------------------
  const handleResetPuzzle = () => {
    soundFX.playJump();
    setIsPuzzleCompleted(false);
    setActiveHint(null);
    setHighlightedPairId(null);
    setHighlightedStepId(null);

    if (activeMode === 'matching') {
      setMatchedPairs(new Set());
      setSelectedLeft(null);
      setSelectedRight(null);
      setMismatchedLeft(null);
      setMismatchedRight(null);
      const rights = defaultPairs.map((p) => ({
        id: p.id,
        text: p.right || p.definition || '',
        explanation: p.explanation,
      }));
      for (let i = rights.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rights[i], rights[j]] = [rights[j], rights[i]];
      }
      setShuffledRights(rights);
    } else {
      setIsOrderSubmitted(false);
      setOrderCorrect(false);
      setSelectedStepIndex(null);
      const steps = [...defaultSteps];
      for (let i = steps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [steps[i], steps[j]] = [steps[j], steps[i]];
      }
      setOrderedSteps(steps);
    }

    setProfessorMessage(
      activeMode === 'ordering'
        ? 'Arrange the sequential steps in the correct academic order!'
        : 'Match each syllabus concept on the left with its definition on the right!'
    );
  };

  const handleFinish = () => {
    onComplete(score);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1022] text-slate-100 rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl">
      {/* ------------------------------------------------------------------- */}
      {/* HUD Header Bar                                                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="px-5 py-3 bg-[#131730] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Puzzle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-fantasy font-bold text-sm text-slate-100">
                PUZZLE QUEST
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {courseCode ? `${courseCode}${courseTitle ? `: ${courseTitle}` : ''}` : courseTitle || 'COURSE'} • {gameConfig.topic}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {activeMode === 'matching' ? 'Concept Matching Challenge' : 'Workflow Step Ordering & Drag-and-Drop Sorting'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mode Toggle (if student wants to try both styles) */}
          <div className="flex items-center bg-[#0d1020] p-0.5 rounded-xl border border-purple-500/20 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setActiveMode('matching');
                handleResetPuzzle();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeMode === 'matching'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matching
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('ordering');
                handleResetPuzzle();
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeMode === 'ordering'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ordering
            </button>
          </div>

          {/* Live Score Display */}
          <div className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Score: {score} XP</span>
          </div>

          {/* Hint Summon Button */}
          {!isPuzzleCompleted && (
            <button
              type="button"
              disabled={hintsRemaining <= 0}
              onClick={handleSummonHint}
              className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 disabled:opacity-40 transition-all active:scale-95"
              title="Summon Academic Hint from Professor Panic"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Hint ({hintsRemaining})</span>
            </button>
          )}

          {onSwitchTo3D && (
            <button
              type="button"
              onClick={onSwitchTo3D}
              className="px-2.5 py-1 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              title="Switch to 3D Dungeon Chamber"
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Switch to 3D</span>
            </button>
          )}

          {/* Reset Shuffle Button */}
          <button
            type="button"
            onClick={handleResetPuzzle}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset & Reshuffle Puzzle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mute Button */}
          <button
            type="button"
            onClick={() => {
              const m = soundFX.toggleMute();
              setIsMuted(m);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Professor Panic Commentary & Hint Banner                            */}
      {/* ------------------------------------------------------------------- */}
      <div className="px-5 py-2.5 bg-gradient-to-r from-purple-950/40 to-slate-900 border-b border-purple-500/15 flex items-center gap-2.5 text-xs text-purple-200">
        <span className="text-lg shrink-0">🧙‍♂️</span>
        <div className="flex-1">
          <span className="font-fantasy font-bold text-cyan-300 mr-2 text-[11px] uppercase tracking-wider">
            Professor Panic:
          </span>
          <span className="italic">{professorMessage}</span>
          {activeHint && (
            <div className="mt-1 text-[11px] font-mono text-amber-300 bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
              💡 {activeHint}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Puzzle Content Area                                                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-6 flex-1 flex flex-col justify-between gap-5 overflow-y-auto">
        {!isPuzzleCompleted ? (
          activeMode === 'matching' ? (
            /* ============================================================= */
            /* MODE 1: CONCEPT MATCHING PAIRS                                 */
            /* ============================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <p>
                  {puzzleData?.prompt ||
                    `Drag each concept onto its definition, or click to match:`}
                </p>
                <span className="text-[11px] font-mono text-slate-400">
                  {matchedPairs.size} of {defaultPairs.length} Aligned
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Concepts (Draggable & Clickable) */}
                <div className="space-y-2.5">
                  <span className="font-fantasy font-bold text-xs text-purple-300 block mb-1">
                    Syllabus Concepts (Drag or Tap):
                  </span>
                  {defaultPairs.map((pair) => {
                    const isMatched = matchedPairs.has(pair.id);
                    const isSelected = selectedLeft === pair.id;
                    const isMismatched = mismatchedLeft === pair.id;
                    const isHighlighted = highlightedPairId === pair.id;

                    let style =
                      'bg-[#141830] border-purple-500/20 text-slate-200 hover:border-purple-400/50 cursor-grab active:cursor-grabbing';
                    if (isMatched) {
                      style =
                        'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 cursor-default opacity-85';
                    } else if (isMismatched) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 animate-shake';
                    } else if (isSelected) {
                      style =
                        'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950/50';
                    } else if (isHighlighted) {
                      style =
                        'bg-amber-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400/60 animate-pulse';
                    }

                    return (
                      <div
                        key={pair.id}
                        draggable={!isMatched}
                        onDragStart={(e) => handleLeftDragStart(e, pair.id)}
                        onClick={() => handleLeftClick(pair.id)}
                        className={`p-3 rounded-2xl border text-xs transition-all flex flex-col gap-1 select-none ${style}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm">
                            {pair.left || pair.term}
                          </span>
                          {isMatched ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                        </div>
                        {isMatched && pair.explanation && (
                          <p className="text-[10px] text-emerald-300/90 italic pt-1 border-t border-emerald-500/20 font-mono">
                            ✓ {pair.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Definitions / Examples (Drop Target & Clickable) */}
                <div className="space-y-2.5">
                  <span className="font-fantasy font-bold text-xs text-cyan-300 block mb-1">
                    Definitions &amp; Behavior (Drop Target or Tap):
                  </span>
                  {shuffledRights.map((item) => {
                    const isMatched = matchedPairs.has(item.id);
                    const isSelected = selectedRight === item.id;
                    const isMismatched = mismatchedRight === item.id;
                    const isHighlighted = highlightedPairId === item.id;

                    let style =
                      'bg-[#141830] border-purple-500/20 text-slate-200 hover:border-cyan-400/50 cursor-pointer';
                    if (isMatched) {
                      style =
                        'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 cursor-default opacity-85';
                    } else if (isMismatched) {
                      style = 'bg-rose-950/80 border-rose-500 text-rose-200 animate-shake';
                    } else if (isSelected) {
                      style =
                        'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-950/50';
                    } else if (isHighlighted) {
                      style =
                        'bg-amber-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400/60 animate-pulse';
                    }

                    return (
                      <div
                        key={item.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleRightDrop(e, item.id)}
                        onClick={() => handleRightClick(item.id)}
                        className={`p-3 rounded-2xl border text-xs transition-all flex flex-col gap-1 select-none ${style}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="leading-relaxed">{item.text}</span>
                          {isMatched && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-500 font-mono pt-2">
                Tip: Drag concept cards onto matching definitions, or click one on each side.
              </div>
            </div>
          ) : (
            /* ============================================================= */
            /* MODE 2: STEP ORDERING & DRAG-AND-DROP SORTING                 */
            /* ============================================================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <p>
                  {puzzleData?.prompt ||
                    `Arrange the steps of ${gameConfig.topic} in their verified sequential execution order:`}
                </p>
                <span className="text-[11px] font-mono text-cyan-300">
                  {selectedStepIndex !== null
                    ? `Step #${selectedStepIndex + 1} Selected — Tap target to swap`
                    : 'Drag cards or tap to swap'}
                </span>
              </div>

              <div className="space-y-2.5 max-w-2xl mx-auto w-full">
                {orderedSteps.map((step, idx) => {
                  const isSelected = selectedStepIndex === idx;
                  const isDragTarget = dragOverStepIndex === idx;
                  const isHighlighted = highlightedStepId === step.id;
                  const isVerifiedCorrect = isOrderSubmitted && orderCorrect;

                  let style =
                    'bg-[#141830] border-purple-500/20 text-slate-200 hover:border-purple-400/50 cursor-grab active:cursor-grabbing';
                  if (isVerifiedCorrect) {
                    style = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200';
                  } else if (isSelected) {
                    style =
                      'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50 shadow-lg';
                  } else if (isDragTarget) {
                    style = 'bg-purple-950/90 border-cyan-400 ring-2 ring-cyan-400/60 scale-[1.02]';
                  } else if (isHighlighted) {
                    style = 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/60 animate-pulse';
                  }

                  return (
                    <div
                      key={step.id}
                      draggable={!isVerifiedCorrect}
                      onDragStart={(e) => handleStepDragStart(e, idx)}
                      onDragOver={(e) => handleStepDragOver(e, idx)}
                      onDragLeave={handleStepDragLeave}
                      onDrop={(e) => handleStepDrop(e, idx)}
                      onDragEnd={handleStepDragEnd}
                      onClick={() => handleStepClickToSelect(idx)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs select-none ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-slate-500 shrink-0 cursor-grab" />
                        <span className="w-7 h-7 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-slate-100 font-medium block">
                            {step.text}
                          </span>
                          {step.explanation && isVerifiedCorrect && (
                            <span className="text-[10px] text-emerald-300 font-mono block mt-0.5">
                              ✓ {step.explanation}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Accessible Arrow Controls for Mobile & Screen-Readers */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0 || isVerifiedCorrect}
                          onClick={() => moveStepUp(idx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition-all active:scale-95"
                          title="Nudge Step Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orderedSteps.length - 1 || isVerifiedCorrect}
                          onClick={() => moveStepDown(idx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white transition-all active:scale-95"
                          title="Nudge Step Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Verification Feedback */}
              {isOrderSubmitted && !orderCorrect && (
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 max-w-2xl mx-auto animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>
                    Sequence mismatch! Some steps violate the academic procedure.
                    Try swapping them or summon a hint from Professor Panic.
                  </span>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleCheckOrder}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-fantasy font-bold text-xs shadow-lg shadow-purple-950/50 transition-all active:scale-95"
                >
                  Verify Step Sequence 🔍
                </button>
              </div>
            </div>
          )
        ) : (
          /* =============================================================== */
          /* VICTORY & QUEST REWARD SCREEN                                   */
          /* =============================================================== */
          <div className="py-8 px-4 text-center space-y-5 animate-in fade-in zoom-in-95 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-emerald-950/50">
              🏆
            </div>

            <div>
              <h3 className="font-fantasy font-black text-2xl text-slate-100 tracking-wide">
                PUZZLE SOLVED!
              </h3>
              <p className="text-xs text-emerald-300 font-mono mt-1">
                All syllabus elements correctly matched and verified.
              </p>
            </div>

            {/* Score & Mastery Summary */}
            <div className="p-4 rounded-2xl bg-[#141830] border border-emerald-500/30 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-semibold">Mastered Topic:</span>
                <span className="font-mono text-cyan-300">{gameConfig.topic}</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-semibold">Final Puzzle Score:</span>
                <span className="font-mono text-amber-300 font-bold">{score} / 100</span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-semibold">Academic Verification:</span>
                <span className="text-emerald-400 font-mono">100% Correct</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-fantasy font-bold text-sm shadow-xl shadow-emerald-950/60 transition-all active:scale-95"
            >
              Claim Quest Rewards ⚔️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
