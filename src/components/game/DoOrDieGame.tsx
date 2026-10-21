import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GameQuestion, QuestGameConfig } from '../../types';
import { getProfessorPanicComment } from '../../lib/professor-panic';
import { soundFX } from '../../lib/audio-effects';
import { DoOrDie3D } from '../game3d/DoOrDie3D';

interface DoOrDieGameProps {
  gameConfig: QuestGameConfig;
  onComplete: (score: number) => void;
  courseCode?: string;
  courseTitle?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface DoOrDieGame2DProps extends DoOrDieGameProps {
  onSwitchTo3D?: () => void;
}

const DoOrDieGame2D: React.FC<DoOrDieGame2DProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
  onSwitchTo3D,
}) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sound state
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  // Questions & checkpoints
  const questions = useMemo(() => {
    return gameConfig.questions && gameConfig.questions.length > 0
      ? gameConfig.questions
      : [
          {
            id: 'default-q',
            question: `What is the primary core concept behind ${gameConfig.topic}?`,
            options: [
              `The foundational principles and applications of ${gameConfig.topic}`,
              'An unverified arbitrary assumption',
              'An outdated rule with no practical application',
              'Purely decorative terminology',
            ],
            correctAnswerIndex: 0,
            explanation: `${gameConfig.topic} is a core academic principle from your syllabus.`,
            hint: 'Focus on the foundational academic definition.',
          },
        ];
  }, [gameConfig.questions, gameConfig.topic]);

  const totalCheckpoints = questions.length;

  // Active Game State
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<GameQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [explanation, setExplanation] = useState<string>('');
  const [professorMessage, setProfessorMessage] = useState<string>(
    "Welcome to DO-OR-DIE! Run forward with A/D and jump with Space or W."
  );
  const [trollFalls, setTrollFalls] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Player physics state (ref-backed for 60fps loop)
  const playerState = useRef({
    x: 40,
    y: 280,
    vx: 0,
    vy: 0,
    width: 28,
    height: 36,
    grounded: false,
    facing: 1, // 1 = right, -1 = left
    isPaused: false,
    isFallingInHole: false,
    holeFallTimer: 0,
    animFrame: 0,
    reachedEnd: false,
  });

  const keys = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });

  const particlesRef = useRef<Particle[]>([]);

  // World Level Configuration (Canvas 800 x 400)
  // Level length extends proportionally to checkpoints
  const worldLength = (totalCheckpoints + 1) * 350 + 200;
  const cameraX = useRef(0);

  // Calculate checkpoint X positions in world coordinates
  const checkpointPositions = useMemo(() => {
    return questions.map((_, i) => (i + 1) * 350);
  }, [questions]);

  // Reset or restart game
  const resetGame = useCallback(() => {
    playerState.current.x = 40;
    playerState.current.y = 280;
    playerState.current.vx = 0;
    playerState.current.vy = 0;
    playerState.current.grounded = false;
    playerState.current.isPaused = false;
    playerState.current.isFallingInHole = false;
    playerState.current.holeFallTimer = 0;
    playerState.current.reachedEnd = false;
    cameraX.current = 0;

    setCurrentCheckpointIndex(0);
    setActiveQuestion(null);
    setFeedbackState('none');
    setSelectedOption(null);
    setIsGameWon(false);
    setShowHint(false);
    setProfessorMessage("Another attempt! Run forward with A/D or Arrow keys.");
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!playerState.current.isPaused && playerState.current.grounded) {
          playerState.current.vy = -10.5;
          playerState.current.grounded = false;
          soundFX.playJump();
        }
      }
      if (e.code === 'KeyR' && !activeQuestion) {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeQuestion, resetGame]);

  // Main Canvas Render and Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const p = playerState.current;

      // Handle falling down a hole animation when wrong answer chosen
      if (p.isFallingInHole) {
        p.holeFallTimer++;
        p.vy += 0.8;
        p.y += p.vy;
        p.animFrame += 0.2;
      } else if (!p.isPaused) {
        // Horizontal Movement
        const speed = 4.0;
        if (keys.current.left) {
          p.vx = -speed;
          p.facing = -1;
          p.animFrame += 0.2;
        } else if (keys.current.right) {
          p.vx = speed;
          p.facing = 1;
          p.animFrame += 0.2;
        } else {
          p.vx = 0;
        }

        // Gravity
        p.vy += 0.55;
        if (p.vy > 12) p.vy = 12;

        p.x += p.vx;
        p.y += p.vy;

        // Ground collision (Floor at y = 320)
        const groundY = 320;
        if (p.y + p.height >= groundY) {
          p.y = groundY - p.height;
          p.vy = 0;
          p.grounded = true;
        }

        // Keep inside level bounds
        if (p.x < 10) p.x = 10;

        // Check Checkpoint Collision
        const nextCheckpointPos = checkpointPositions[currentCheckpointIndex];
        if (
          nextCheckpointPos !== undefined &&
          p.x >= nextCheckpointPos - 40 &&
          p.x <= nextCheckpointPos + 10 &&
          !activeQuestion
        ) {
          // Pause character right before the pit obstacle!
          p.isPaused = true;
          p.vx = 0;
          p.vy = 0;
          const q = questions[currentCheckpointIndex];
          setActiveQuestion(q);
          setFeedbackState('none');
          setSelectedOption(null);
          setShowHint(false);
          setProfessorMessage(
            `CHECKPOINT ${currentCheckpointIndex + 1}! Answer to bridge the gap!`
          );
        }

        // Check Victory Reach
        const finishX = worldLength - 80;
        if (p.x >= finishX && !p.reachedEnd && currentCheckpointIndex >= totalCheckpoints) {
          p.reachedEnd = true;
          p.isPaused = true;
          setIsGameWon(true);
          soundFX.playVictory();
          setProfessorMessage(getProfessorPanicComment('quest_complete'));
          onComplete(score + 100);
        }
      }

      // Smooth camera follow
      const targetCamX = Math.max(0, p.x - 240);
      cameraX.current += (targetCamX - cameraX.current) * 0.1;

      // ----------------------------------------------------
      // DRAW CANVAS SCENE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-Math.round(cameraX.current), 0);

      // 1. Stylized Parallax Background (Stars & Floating Academics)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a0d1c');
      grad.addColorStop(0.7, '#151934');
      grad.addColorStop(1, '#1b1236');
      ctx.fillStyle = grad;
      ctx.fillRect(cameraX.current, 0, canvas.width, canvas.height);

      // Distant Floating Mountains / Clouds
      ctx.fillStyle = 'rgba(139, 92, 246, 0.08)';
      for (let i = 0; i < 15; i++) {
        const mx = i * 260;
        ctx.beginPath();
        ctx.arc(mx, 220, 100, Math.PI, 0);
        ctx.fill();
      }

      // 2. Ground Platforms & Pit Gaps
      // Each checkpoint has a pit gap immediately after it
      let platformStartX = 0;
      for (let i = 0; i < totalCheckpoints; i++) {
        const cpX = checkpointPositions[i];
        const platformWidth = cpX - platformStartX;

        // Draw solid platform block
        ctx.fillStyle = '#1e1b4b'; // Deep indigo
        ctx.fillRect(platformStartX, 320, platformWidth, 80);

        // Platform top glow line
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(platformStartX, 320, platformWidth, 4);

        // Decorative stone bricks
        ctx.fillStyle = '#2e2870';
        for (let bx = platformStartX; bx < cpX; bx += 40) {
          ctx.fillRect(bx + 4, 332, 32, 12);
        }

        // Draw Checkpoint Gate / Totem
        ctx.fillStyle = i < currentCheckpointIndex ? '#10b981' : '#f59e0b';
        ctx.fillRect(cpX - 15, 230, 8, 90);
        ctx.beginPath();
        ctx.arc(cpX - 11, 224, 14, 0, Math.PI * 2);
        ctx.fill();

        // Checkpoint Emblem
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i < currentCheckpointIndex ? '✓' : '?', cpX - 11, 229);

        // Gap / Pit of Incorrect Assumptions (width 70)
        const gapWidth = 70;

        // If cleared, bridge appears!
        if (i < currentCheckpointIndex) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(cpX, 320, gapWidth, 8);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(cpX, 328, gapWidth, 72);
        } else {
          // Dangerous Pit Glow
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fillRect(cpX, 320, gapWidth, 80);
          ctx.fillStyle = '#f43f5e';
          // Pit spikes
          for (let sx = cpX + 6; sx < cpX + gapWidth - 6; sx += 14) {
            ctx.beginPath();
            ctx.moveTo(sx, 395);
            ctx.lineTo(sx + 7, 375);
            ctx.lineTo(sx + 14, 395);
            ctx.fill();
          }
        }

        platformStartX = cpX + gapWidth;
      }

      // Final Stretch & Victory Gate
      const finalWidth = worldLength - platformStartX;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(platformStartX, 320, finalWidth, 80);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(platformStartX, 320, finalWidth, 4);

      // Finish Golden Arch
      const goalX = worldLength - 80;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(goalX - 6, 210, 12, 110);
      ctx.fillRect(goalX + 40, 210, 12, 110);
      ctx.fillRect(goalX - 10, 205, 66, 16);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FINISH', goalX + 23, 218);

      // 3. Draw Cartoon Player Character
      ctx.save();
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

      // Tumble rotation if falling down hole
      if (p.isFallingInHole) {
        ctx.rotate((p.holeFallTimer * 12 * Math.PI) / 180);
      }

      ctx.scale(p.facing, 1);

      // Body (cute blue/purple jelly hero)
      ctx.fillStyle = p.isFallingInHole ? '#f43f5e' : '#38bdf8';
      ctx.beginPath();
      // Rounded cartoon body
      ctx.roundRect(-14, -18, 28, 32, 10);
      ctx.fill();

      // Cute Little Cap / Wizard Hat
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(-12, -18);
      ctx.lineTo(0, -32);
      ctx.lineTo(12, -18);
      ctx.closePath();
      ctx.fill();

      // Big expressive eyes
      const eyeOffset = p.facing === 1 ? 2 : -2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2 + eyeOffset, -8, 4.5, 0, Math.PI * 2);
      ctx.arc(6 + eyeOffset, -8, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (look in direction of movement)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(eyeOffset, -8, 2, 0, Math.PI * 2);
      ctx.arc(8 + eyeOffset, -8, 2, 0, Math.PI * 2);
      ctx.fill();

      // Running legs animation
      if (p.grounded && p.vx !== 0) {
        const legSwing = Math.sin(p.animFrame) * 6;
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-8, 14, 5, 8 + legSwing);
        ctx.fillRect(3, 14, 5, 8 - legSwing);
      } else {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-7, 14, 5, 7);
        ctx.fillRect(2, 14, 5, 7);
      }

      ctx.restore();

      // 4. Draw Particles
      particlesRef.current.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();

        if (part.life >= part.maxLife) {
          particlesRef.current.splice(index, 1);
        }
      });

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [questions, checkpointPositions, currentCheckpointIndex, totalCheckpoints, worldLength, activeQuestion, score, onComplete]);

  // Spawn celebratory confetti particles
  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 24; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.8) * 8,
        color,
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: 35,
      });
    }
  }, []);

  // Handle Player Option Selection at Checkpoint
  const handleSelectOption = (index: number) => {
    if (!activeQuestion || feedbackState !== 'none') return;
    setSelectedOption(index);

    const isCorrect = index === activeQuestion.correctAnswerIndex;

    if (isCorrect) {
      soundFX.playCorrect();
      setFeedbackState('correct');
      setScore((s) => s + 50);
      setExplanation(activeQuestion.explanation);
      setProfessorMessage(getProfessorPanicComment('correct'));

      const cpX = checkpointPositions[currentCheckpointIndex];
      spawnParticles(cpX, 300, '#10b981');

      // After a short celebration delay, allow character to jump across and continue
      setTimeout(() => {
        playerState.current.isPaused = false;
        // Big celebratory jump across the gap!
        playerState.current.vy = -9;
        playerState.current.vx = 5;
        setCurrentCheckpointIndex((idx) => idx + 1);
        setActiveQuestion(null);
        setFeedbackState('none');
        setSelectedOption(null);
      }, 1400);
    } else {
      soundFX.playWrong();
      setFeedbackState('wrong');
      setTrollFalls((f) => f + 1);
      setExplanation(activeQuestion.explanation);
      setProfessorMessage(getProfessorPanicComment('wrong'));

      // Trigger character tumbling into the hole!
      playerState.current.isFallingInHole = true;
      playerState.current.vy = 2;
    }
  };

  // Handle Checkpoint Retry after falling
  const handleRetryCheckpoint = () => {
    soundFX.playJump();
    playerState.current.isFallingInHole = false;
    playerState.current.holeFallTimer = 0;

    // Reset player position right before current checkpoint
    const cpX = checkpointPositions[currentCheckpointIndex];
    playerState.current.x = cpX - 90;
    playerState.current.y = 280;
    playerState.current.vx = 0;
    playerState.current.vy = 0;
    playerState.current.grounded = true;
    playerState.current.isPaused = false;

    setFeedbackState('none');
    setSelectedOption(null);
    setActiveQuestion(null);
    setProfessorMessage(getProfessorPanicComment('retry'));
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0f1f] text-slate-100 rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl">
      {/* Top Game HUD Bar */}
      <div className="px-5 py-3 bg-[#11152c] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏃</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-fantasy font-bold text-sm text-slate-100">
                DO-OR-DIE SURVIVAL
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {courseCode ? `${courseCode}${courseTitle ? `: ${courseTitle}` : ''}` : courseTitle || 'COURSE'} • {gameConfig.topic}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Checkpoint {Math.min(currentCheckpointIndex + 1, totalCheckpoints)} of {totalCheckpoints}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Score: {score} XP</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Falls: {trollFalls}</span>
          </div>

          {onSwitchTo3D && (
            <button
              type="button"
              onClick={onSwitchTo3D}
              className="px-2.5 py-1 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
              title="Switch to 3D Three.js Engine"
            >
              <Sparkles className="w-3 h-3 text-cyan-300" />
              <span>Switch to 3D</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const muted = soundFX.toggleMute();
              setIsMuted(muted);
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={resetGame}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Restart Level"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Professor Panic Commentator Bubble */}
      <div className="px-5 py-2.5 bg-gradient-to-r from-purple-950/40 to-slate-900 border-b border-purple-500/15 flex items-center gap-2.5 text-xs text-purple-200">
        <span className="text-lg">🧙‍♂️</span>
        <div className="flex-1">
          <span className="font-fantasy font-bold text-cyan-300 mr-2 text-[11px] uppercase tracking-wider">
            Professor Panic:
          </span>
          <span className="italic">{professorMessage}</span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full max-h-[460px] object-contain select-none"
        />

        {/* Question Checkpoint Overlay Modal */}
        {activeQuestion && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-20 animate-in fade-in duration-200">
            <div className="max-w-xl w-full bg-[#13162b] border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 border-b border-purple-500/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-xs font-bold">
                    Q{currentCheckpointIndex + 1}
                  </div>
                  <h4 className="font-fantasy font-bold text-xs uppercase tracking-wider text-slate-300">
                    Syllabus Checkpoint Challenge
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Need Hint?'}</span>
                </button>
              </div>

              {/* Hint Box */}
              {showHint && activeQuestion.hint && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{activeQuestion.hint}</span>
                </div>
              )}

              {/* Question Text */}
              <p className="font-semibold text-sm sm:text-base text-slate-100 leading-relaxed">
                {activeQuestion.question}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeQuestion.options.map((option, idx) => {
                  let btnStyle = 'bg-[#1b1f3b] border-purple-500/20 text-slate-200 hover:bg-purple-900/40 hover:border-purple-400/50';

                  if (feedbackState !== 'none') {
                    if (idx === activeQuestion.correctAnswerIndex) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else if (idx === selectedOption) {
                      btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'bg-[#121528] border-slate-800 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={feedbackState !== 'none'}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2 ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Explanation Box */}
              {feedbackState === 'correct' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">CORRECT! Checkpoint Bridge Extended.</span>
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed">{explanation}</p>
                  </div>
                </div>
              )}

              {feedbackState === 'wrong' && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs space-y-2 animate-in zoom-in-95">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">
                        INCORRECT! The floor collapsed beneath you!
                      </span>
                      <p className="text-[11px] text-rose-300/90 leading-relaxed">{explanation}</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleRetryCheckpoint}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-fantasy text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Checkpoint</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {isGameWon && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-in fade-in zoom-in-95">
            <div className="max-w-md w-full bg-[#13162b] border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-950/40">
                🏆
              </div>

              <div>
                <h3 className="font-fantasy font-black text-xl text-slate-100">
                  SURVIVAL COMPLETE!
                </h3>
                <p className="text-xs text-emerald-300 font-mono mt-0.5">
                  All {totalCheckpoints} syllabus checkpoints cleared!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090b14] border border-purple-500/20 text-xs text-slate-300 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Topic:</span>
                  <span className="font-bold text-slate-200">{gameConfig.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pitfalls Survived:</span>
                  <span className="font-mono text-rose-400 font-bold">{trollFalls} Falls</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                  <span className="text-amber-300">Total Quest XP:</span>
                  <span className="font-mono text-cyan-300">+{score + 50} XP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onComplete(score + 50)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-fantasy font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all active:scale-95"
              >
                Claim Victory &amp; Record Progress ⚔️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mobile Touch Controls & Instructions */}
      <div className="px-5 py-3 bg-[#0a0d1c] border-t border-purple-500/15 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="hidden sm:flex items-center gap-4">
          <span>Move: <strong className="text-slate-200">A / D / Arrows</strong></span>
          <span>Jump: <strong className="text-slate-200">Space / W / Up</strong></span>
          <span>Restart: <strong className="text-slate-200">R</strong></span>
        </div>

        {/* On-screen touch buttons for mobile / tablet */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onTouchStart={() => (keys.current.left = true)}
              onTouchEnd={() => (keys.current.left = false)}
              onMouseDown={() => (keys.current.left = true)}
              onMouseUp={() => (keys.current.left = false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 font-bold text-sm select-none"
            >
              ◀ Left
            </button>
            <button
              type="button"
              onTouchStart={() => (keys.current.right = true)}
              onTouchEnd={() => (keys.current.right = false)}
              onMouseDown={() => (keys.current.right = true)}
              onMouseUp={() => (keys.current.right = false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 font-bold text-sm select-none"
            >
              Right ▶
            </button>
          </div>

          <button
            type="button"
            onTouchStart={() => {
              if (playerState.current.grounded) {
                playerState.current.vy = -10.5;
                playerState.current.grounded = false;
                soundFX.playJump();
              }
            }}
            onClick={() => {
              if (playerState.current.grounded) {
                playerState.current.vy = -10.5;
                playerState.current.grounded = false;
                soundFX.playJump();
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-md select-none"
          >
            JUMP ▲
          </button>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class DoOrDie3DErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Caught error in 3D Do-Or-Die, rendering 2D fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const DoOrDieGame: React.FC<DoOrDieGameProps> = (props) => {
  const [use3DEngine, setUse3DEngine] = useState<boolean>(true);

  if (use3DEngine) {
    return (
      <DoOrDie3DErrorBoundary
        fallback={
          <DoOrDieGame2D
            {...props}
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
              title="Switch to Classic 2D Side-scroller"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>3D Engine (Switch to 2D)</span>
            </button>
          </div>
          <DoOrDie3D
            gameConfig={props.gameConfig}
            onComplete={props.onComplete}
            courseCode={props.courseCode}
            courseTitle={props.courseTitle}
          />
        </div>
      </DoOrDie3DErrorBoundary>
    );
  }

  return (
    <DoOrDieGame2D
      {...props}
      onSwitchTo3D={() => setUse3DEngine(true)}
    />
  );
};

