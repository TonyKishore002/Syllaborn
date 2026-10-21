import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  CheckCircle2,
  Volume2,
  VolumeX,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Award,
} from 'lucide-react';
import { QuestGameConfig, PuzzleMatchingPair, PuzzleStepItem } from '../../types';
import { ThreeEngine } from './ThreeEngine';
import { ProceduralMeshes } from './ProceduralMeshes';
import { soundFX } from '../../lib/audio-effects';
import { getProfessorPanicComment } from '../../lib/professor-panic';

interface PuzzleQuest3DProps {
  gameConfig: QuestGameConfig;
  onComplete: (score: number) => void;
  courseCode?: string;
  courseTitle?: string;
  onFallbackTo2D?: () => void;
}

export const PuzzleQuest3D: React.FC<PuzzleQuest3DProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
  onFallbackTo2D,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // Sound State
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  // Puzzle Data resolution
  const puzzleData = gameConfig.puzzleData;
  const initialMode =
    puzzleData?.type === 'ordering' || puzzleData?.type === 'step-ordering'
      ? 'ordering'
      : 'matching';
  const [activeMode, setActiveMode] = useState<'matching' | 'ordering'>(initialMode);

  // Score & Hints
  const [score, setScore] = useState(100);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Professor Panic companion feedback
  const [professorMessage, setProfessorMessage] = useState<string>(
    "ANCIENT DUNGEON CHAMBER: Link the 3D runic altars with the correct syllabus definitions to unlock the relic!"
  );

  // ---------------------------------------------------------------------------
  // Matching Pairs Data Setup
  // ---------------------------------------------------------------------------
  const pairs: PuzzleMatchingPair[] = useMemo(() => {
    return puzzleData?.pairs && puzzleData.pairs.length > 0
      ? puzzleData.pairs
      : [
          {
            id: 'pair-1',
            left: `${gameConfig.topic} (Theoretical Formulation)`,
            right: 'Primary academic model, formal scope, and core invariant',
            term: `${gameConfig.topic} (Theoretical Formulation)`,
            definition: 'Primary academic model, formal scope, and core invariant',
            explanation: `Establishes the core academic foundations of ${gameConfig.topic}.`,
            hint: 'The foundational model establishing initial system constraints.',
          },
          {
            id: 'pair-2',
            left: 'Core Operational Rule',
            right: 'Fundamental state transition invariant preserved across execution',
            term: 'Core Operational Rule',
            definition: 'Fundamental state transition invariant preserved across execution',
            explanation: 'Guarantees execution invariants and eliminates corruption.',
            hint: 'The governing constraint that maintains mathematical correctness.',
          },
          {
            id: 'pair-3',
            left: 'Practical Implementation',
            right: 'Concrete technical execution in coursework problem sets and labs',
            term: 'Practical Implementation',
            definition: 'Concrete technical execution in coursework problem sets and labs',
            explanation: 'Translates high-level theoretical ideas into runnable code.',
            hint: 'How this concept is executed in real assignments and labs.',
          },
          {
            id: 'pair-4',
            left: 'Verification & Boundary Analysis',
            right: 'Systematic testing against edge cases and performance benchmarks',
            term: 'Verification & Boundary Analysis',
            definition: 'Systematic testing against edge cases and performance benchmarks',
            explanation: 'Ensures optimal complexity and prevents edge case failures.',
            hint: 'Validating safety and correctness before final evaluation.',
          },
        ];
  }, [puzzleData?.pairs, gameConfig.topic]);

  // ---------------------------------------------------------------------------
  // Ordering Steps Data Setup
  // ---------------------------------------------------------------------------
  const originalSteps: PuzzleStepItem[] = useMemo(() => {
    if (puzzleData?.steps && puzzleData.steps.length > 0) return puzzleData.steps;
    if (puzzleData?.orderedSteps && puzzleData.orderedSteps.length > 0) return puzzleData.orderedSteps;
    return [
      { id: 's1', order: 1, text: `Formulate initial problem constraints for ${gameConfig.topic}` },
      { id: 's2', order: 2, text: 'Construct rigorous mathematical model and invariant' },
      { id: 's3', order: 3, text: 'Synthesize optimal solution algorithm' },
      { id: 's4', order: 4, text: 'Perform empirical testing against edge case benchmarks' },
    ];
  }, [puzzleData, gameConfig.topic]);

  // Matching Mode State
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [mismatchedLeft, setMismatchedLeft] = useState<string | null>(null);
  const [mismatchedRight, setMismatchedRight] = useState<string | null>(null);

  // Shuffled definitions for the right column
  const [shuffledRights, setShuffledRights] = useState<
    Array<{ id: string; text: string; explanation?: string }>
  >([]);

  // Initialize and shuffle right definitions when pairs change
  useEffect(() => {
    const list = pairs.map((p) => ({
      id: p.id,
      text: p.right || p.definition || '',
      explanation: p.explanation,
    }));
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledRights(list);
    setMatchedPairIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setMismatchedLeft(null);
    setMismatchedRight(null);
    setIsComplete(false);
  }, [pairs]);

  // Current interactive ordering state
  const [currentSteps, setCurrentSteps] = useState<PuzzleStepItem[]>([]);

  // Synchronize and scramble steps when originalSteps change
  useEffect(() => {
    const scrambled = [...originalSteps];
    if (scrambled.length > 2) {
      const first = scrambled.shift()!;
      scrambled.push(first);
    }
    setCurrentSteps(scrambled);
    setIsComplete(false);
  }, [originalSteps]);

  // 3D Scene Refs
  const altarEntitiesRef = useRef<Array<ReturnType<typeof ProceduralMeshes.createDungeonAltar>>>([]);
  const particleSystemRef = useRef<ReturnType<typeof ProceduralMeshes.createParticleSystem> | null>(null);
  const arcaneBeamRef = useRef<THREE.Line | null>(null);
  const onFallbackTo2DRef = useRef(onFallbackTo2D);

  useEffect(() => {
    onFallbackTo2DRef.current = onFallbackTo2D;
  }, [onFallbackTo2D]);

  // Initialize 3D Dungeon Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Create Engine with safe WebGL fallback
    let engine: ThreeEngine | null = null;
    try {
      engine = new ThreeEngine(mountRef.current, {
        antialias: true,
        shadows: true,
        fogColor: 0x050714,
        fogNear: 10,
        fogFar: 50,
        clearColor: 0x03040c,
      });
      engineRef.current = engine;
    } catch (err) {
      console.warn("ThreeEngine WebGL initialization failed, switching to 2D cards mode:", err);
      onFallbackTo2DRef.current?.();
      return;
    }

    engine.camera.position.set(0, 11, 14);
    engine.camera.lookAt(0, 1.2, 0);

    // 2. Dungeon Atmospheric Lighting
    const ambientLight = new THREE.AmbientLight(0x4338ca, 0.6);
    engine.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5b4fc, 1.1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    engine.scene.add(dirLight);

    // Glowing Central Pedestal Point Light (Emerald/Cyan)
    const centralLight = new THREE.PointLight(0x10b981, 3.5, 20);
    centralLight.position.set(0, 3.5, 0);
    engine.scene.add(centralLight);

    // 3. Dungeon Stone Floor
    const floorGeo = new THREE.CylinderGeometry(11, 11.5, 0.8, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.4;
    floor.receiveShadow = true;
    engine.scene.add(floor);

    // Floor Runic Seal
    const sealGeo = new THREE.RingGeometry(8.5, 8.8, 32);
    const sealMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.rotation.x = -Math.PI / 2;
    seal.position.y = 0.02;
    engine.scene.add(seal);

    // 4. Create 3D Altars in circle around chamber
    const altarEntities: typeof altarEntitiesRef.current = [];
    const altarCount = Math.max(pairs.length * 2, 6);

    for (let i = 0; i < altarCount; i++) {
      const angle = (i / altarCount) * Math.PI * 2;
      const radius = 6.8;
      const ax = Math.cos(angle) * radius;
      const az = Math.sin(angle) * radius;

      // Color alternating between cyan and purple
      const color = i % 2 === 0 ? 0x38bdf8 : 0xa855f7;
      const altar = ProceduralMeshes.createDungeonAltar(color);
      altar.root.position.set(ax, 0, az);
      engine.scene.add(altar.root);
      altarEntities.push(altar);
    }
    altarEntitiesRef.current = altarEntities;

    // 5. Arcane Beam Line connecting matched altars
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -999, 0),
      new THREE.Vector3(0, -999, 0),
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
    });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    engine.scene.add(beamLine);
    arcaneBeamRef.current = beamLine;

    // 6. Particle System
    const particles = ProceduralMeshes.createParticleSystem(70, 0x10b981);
    particleSystemRef.current = particles;
    engine.scene.add(particles.points);

    // 7. Animation Loop
    const unregisterLoop = engine.onUpdate((delta, elapsed) => {
      // Rotate seal
      seal.rotation.z = elapsed * 0.1;

      // Update altars floating crystals
      altarEntitiesRef.current.forEach((altar) => {
        altar.update(elapsed);
      });

      // Update particles
      if (particleSystemRef.current) {
        particleSystemRef.current.update(delta);
      }
    });

    return () => {
      unregisterLoop();
      engine.dispose();
      engineRef.current = null;
    };
  }, [pairs.length]);

  // ---------------------------------------------------------------------------
  // Matching Game Logic
  // ---------------------------------------------------------------------------
  const handleSelectLeft = (pairId: string) => {
    if (matchedPairIds.has(pairId) || mismatchedLeft) return;
    if (selectedLeft === pairId) {
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(pairId);
    soundFX.playAttack();

    if (selectedRight) {
      evaluateMatch(pairId, selectedRight);
    }
  };

  const handleSelectRight = (pairId: string) => {
    if (matchedPairIds.has(pairId) || mismatchedRight) return;
    if (selectedRight === pairId) {
      setSelectedRight(null);
      return;
    }
    setSelectedRight(pairId);
    soundFX.playAttack();

    if (selectedLeft) {
      evaluateMatch(selectedLeft, pairId);
    }
  };

  const evaluateMatch = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      // MATCH SUCCESS!
      soundFX.playCorrect();
      const updatedMatches = new Set(matchedPairIds);
      updatedMatches.add(leftId);
      setMatchedPairIds(updatedMatches);
      setProfessorMessage(getProfessorPanicComment('puzzle_match'));

      // Burst green particles in chamber center
      if (particleSystemRef.current) {
        particleSystemRef.current.burst(new THREE.Vector3(0, 2.5, 0), 12);
      }

      // Activate corresponding 3D altar
      if (altarEntitiesRef.current.length > 0) {
        const altarIdx = (updatedMatches.size - 1) % altarEntitiesRef.current.length;
        altarEntitiesRef.current[altarIdx].setActivated(true);
      }

      setSelectedLeft(null);
      setSelectedRight(null);
      setMismatchedLeft(null);
      setMismatchedRight(null);

      // Check all matched
      if (updatedMatches.size === pairs.length) {
        handleVictory();
      }
    } else {
      // MISMATCH
      soundFX.playWrong();
      setScore((s) => Math.max(30, s - 10));
      setProfessorMessage(getProfessorPanicComment('puzzle_wrong'));
      setMismatchedLeft(leftId);
      setMismatchedRight(rightId);

      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setMismatchedLeft(null);
        setMismatchedRight(null);
      }, 700);
    }
  };

  // ---------------------------------------------------------------------------
  // Ordering Game Logic
  // ---------------------------------------------------------------------------
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSteps.length) return;

    soundFX.playJump();
    const newSteps = [...currentSteps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setCurrentSteps(newSteps);

    // Check if sorted by id or order
    const isSorted = newSteps.every(
      (step, idx) => step.id === originalSteps[idx]?.id || step.order === (originalSteps[idx]?.order ?? idx + 1)
    );
    if (isSorted) {
      soundFX.playVictory();
      setProfessorMessage(getProfessorPanicComment('puzzle_order_correct'));
      if (particleSystemRef.current) {
        particleSystemRef.current.burst(new THREE.Vector3(0, 2.5, 0), 14);
      }
      handleVictory();
    }
  };

  const handleVerifyOrder = () => {
    const isSorted = currentSteps.every(
      (step, idx) => step.id === originalSteps[idx]?.id || step.order === (originalSteps[idx]?.order ?? idx + 1)
    );
    if (isSorted) {
      soundFX.playVictory();
      setProfessorMessage(getProfessorPanicComment('puzzle_order_correct'));
      if (particleSystemRef.current) {
        particleSystemRef.current.burst(new THREE.Vector3(0, 2.5, 0), 14);
      }
      handleVictory();
    } else {
      soundFX.playWrong();
      setScore((s) => Math.max(30, s - 10));
      setProfessorMessage(getProfessorPanicComment('puzzle_order_wrong'));
    }
  };

  const handleVictory = () => {
    setIsComplete(true);
    soundFX.playVictory();
    setProfessorMessage("CHAMBER UNLOCKED! You have solved the ancient syllabus puzzle!");
  };

  const handleUseHint = () => {
    if (hintsRemaining <= 0) return;
    setHintsRemaining((h) => h - 1);
    soundFX.playHeal();

    if (activeMode === 'matching') {
      const unmatched = pairs.find((p) => !matchedPairIds.has(p.id));
      if (unmatched) {
        const leftText = unmatched.left || unmatched.term || 'Concept';
        const rightText = unmatched.right || unmatched.definition || '';
        setActiveHint(`Link: "${leftText}" connects to "${rightText.substring(0, 35)}..."`);
      }
    } else {
      const firstMisplaced = currentSteps.find((s, idx) => s.id !== originalSteps[idx]?.id);
      if (firstMisplaced) {
        const targetIdx = originalSteps.findIndex((s) => s.id === firstMisplaced.id) + 1;
        setActiveHint(`Hint: Step "${firstMisplaced.text.substring(0, 30)}..." belongs in position #${targetIdx || firstMisplaced.order}`);
      }
    }
    setProfessorMessage(getProfessorPanicComment('puzzle_hint'));
  };

  return (
    <div className="relative w-full h-full bg-[#03040c] select-none overflow-hidden flex flex-col font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Top HUD: Title, Mode Switcher, Score & Hints */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-2 shadow-lg">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
              {courseCode || 'DUNGEON'}
            </span>
            <span className="text-xs font-bold text-slate-100 hidden sm:inline max-w-[180px] truncate">
              {courseTitle || gameConfig.topic}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('matching')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeMode === 'matching'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Concept Altars
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('ordering')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeMode === 'ordering'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step Pillars
            </button>
          </div>
        </div>

        {/* Score, Hints & Sound Controls */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Hint button */}
          <button
            type="button"
            disabled={hintsRemaining <= 0}
            onClick={handleUseHint}
            className="px-3 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Reveal Syllabus Clue"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint ({hintsRemaining})</span>
          </button>

          {/* Score */}
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-1.5 text-xs font-bold text-slate-100 shadow-md">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-amber-300">{score} pts</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(soundFX.toggleMute())}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all shadow-md"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Professor Panic Banner */}
      <div className="relative z-10 px-4 py-2 mx-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 flex items-center gap-3 text-xs text-slate-300 shadow-md pointer-events-none">
        <span className="text-xl">🧙‍♂️</span>
        <div className="flex-1">
          <span className="text-emerald-400 font-bold mr-1.5">Prof. Panic:</span>
          <span>{professorMessage}</span>
        </div>
      </div>

      {/* Active Hint Callout */}
      {activeHint && (
        <div className="relative z-10 px-4 py-2 mx-4 mt-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 shadow-md flex items-center justify-between pointer-events-auto">
          <span>💡 {activeHint}</span>
          <button
            type="button"
            onClick={() => setActiveHint(null)}
            className="text-amber-400 hover:text-amber-100 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Interactive 3D Puzzle HUD */}
      <div className="relative z-10 mt-auto p-3 sm:p-4 pointer-events-auto">
        {activeMode === 'matching' ? (
          /* Concept Matching Interactive Altar Grid */
          <div className="max-w-4xl w-full mx-auto bg-[#0a0d1e]/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>SELECT LEFT ALTRON → MATCH RIGHT DEFINITION</span>
              <span className="text-emerald-300 font-bold">
                Matches: {matchedPairIds.size} / {pairs.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[38vh] overflow-y-auto p-1">
              {/* Left Column: Terms */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Concept Altars (Terms)
                </span>
                {pairs.map((p) => {
                  const isMatched = matchedPairIds.has(p.id);
                  const isSelected = selectedLeft === p.id;
                  const isMismatched = mismatchedLeft === p.id;
                  const label = p.left || p.term || 'Concept';
                  return (
                    <button
                      key={`left-${p.id}`}
                      type="button"
                      disabled={isMatched || Boolean(mismatchedLeft)}
                      onClick={() => handleSelectLeft(p.id)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 shadow-sm ${
                        isMatched
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 line-through opacity-60'
                          : isMismatched
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-shake'
                          : isSelected
                          ? 'bg-cyan-600/30 border-cyan-400 text-cyan-100 font-bold scale-[1.02] shadow-neo-purple'
                          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200 shadow-neo-sm'
                      }`}
                    >
                      <span className="font-semibold">{label}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Definitions (Randomized Shuffled Order) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  Arcane Seals (Definitions)
                </span>
                {shuffledRights.map((item) => {
                  const isMatched = matchedPairIds.has(item.id);
                  const isSelected = selectedRight === item.id;
                  const isMismatched = mismatchedRight === item.id;
                  return (
                    <button
                      key={`right-${item.id}`}
                      type="button"
                      disabled={isMatched || Boolean(mismatchedRight)}
                      onClick={() => handleSelectRight(item.id)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 shadow-sm ${
                        isMatched
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 line-through opacity-60'
                          : isMismatched
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-shake'
                          : isSelected
                          ? 'bg-purple-600/30 border-purple-400 text-purple-100 font-bold scale-[1.02] shadow-neo-purple'
                          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200 shadow-neo-sm'
                      }`}
                    >
                      <span className="leading-snug">{item.text}</span>
                      {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Step Ordering Monolith Interface */
          <div className="max-w-2xl w-full mx-auto bg-[#0a0d1e]/90 backdrop-blur-md border border-purple-500/30 rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ARRANGE STEPS IN ALGORITHMIC ORDER</span>
              <span className="text-purple-300 font-bold">Use ▲ ▼ to Swap</span>
            </div>

            <div className="space-y-2 max-h-[38vh] overflow-y-auto p-1">
              {currentSteps.map((step, idx) => {
                const isCorrectPos =
                  step.id === originalSteps[idx]?.id ||
                  step.order === (originalSteps[idx]?.order ?? idx + 1);
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isCorrectPos
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-slate-900/80 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-medium leading-relaxed">{step.text}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveStep(idx, 'up')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-all shadow-neo-sm"
                        title="Move Step Up"
                      >
                        <ArrowLeft className="w-4 h-4 rotate-90" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === currentSteps.length - 1}
                        onClick={() => moveStep(idx, 'down')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-all shadow-neo-sm"
                        title="Move Step Down"
                      >
                        <ArrowRight className="w-4 h-4 rotate-90" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleVerifyOrder}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs border border-purple-400/40 shadow-neo-purple transition-all active:scale-95"
              >
                Verify Sequence Order 🔍
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Victory Conquest Screen */}
      {isComplete && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#0a0f24] border-2 border-emerald-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-950/60 animate-bounce">
              🏆
            </div>

            <div>
              <h2 className="font-fantasy font-black text-2xl text-slate-100">
                CHAMBER CONQUERED!
              </h2>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                Syllabus Puzzle Quest Solved!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#060814] border border-emerald-500/20 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Score:</span>
                <span className="font-mono text-cyan-300 font-bold">{score} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hints Preserved:</span>
                <span className="font-mono text-amber-300 font-bold">{hintsRemaining} / 3</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onComplete(score)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              Claim Relic & XP ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
