import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Heart,
  Zap,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { BossSlayerConfig, BossPhaseId, BossCombatStats } from '../../types/boss';
import { ThreeEngine } from './ThreeEngine';
import { ProceduralMeshes } from './ProceduralMeshes';
import { soundFX } from '../../lib/audio-effects';
import { getProfessorPanicComment } from '../../lib/professor-panic';

interface BossSlayer3DProps {
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

export const BossSlayer3D: React.FC<BossSlayer3DProps> = ({
  config,
  onComplete,
  onExit,
  alreadyCompleted: _alreadyCompleted = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // Sound State
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  // Game Lifecycle State
  const [gameState, setGameState] = useState<'combat' | 'victory' | 'defeat'>('combat');
  const [currentPhaseId, setCurrentPhaseId] = useState<BossPhaseId>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const maxPlayerHp = 100;
  const [bossHp, setBossHp] = useState<number>(config.maxHp);
  const [potionsLeft, setPotionsLeft] = useState<number>(2);
  const [streak, setStreak] = useState<number>(0);

  // Dodge state & I-Frames
  const [dodgeCooldown, setDodgeCooldown] = useState<boolean>(false);
  const [isDodging, setIsDodging] = useState<boolean>(false);

  // Question & Weakness Channeling
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredState, setAnsweredState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Professor Panic companion feedback
  const [panicDialogue, setPanicDialogue] = useState<string>(
    config.lore || "INCOMING BOSS! Evade ground telegraphs with Space/Dodge and strike back via Syllabus weakness windows!"
  );

  // Floating combat text overlay
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
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

  const performDodgeRef = useRef<() => void>(() => {});
  const drinkPotionRef = useRef<() => void>(() => {});
  const handleDefeatRef = useRef<() => void>(() => {});

  // 3D Scene Refs & Entities
  const playerState = useRef({
    x: 0,
    z: 7,
    vx: 0,
    vz: 0,
    isInvulnerable: false,
    invulnTimer: 0,
    dodgeRollTimer: 0,
  });

  const keys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const bossModelRef = useRef<ReturnType<typeof ProceduralMeshes.createBossCharacter> | null>(null);
  const playerModelRef = useRef<ReturnType<typeof ProceduralMeshes.createRunnerCharacter> | null>(null);
  const particleSystemRef = useRef<ReturnType<typeof ProceduralMeshes.createParticleSystem> | null>(null);
  const telegraphDecalRef = useRef<ReturnType<typeof ProceduralMeshes.createTelegraphDecal> | null>(null);

  // Current attack telegraph state
  const telegraphState = useRef({
    active: false,
    duration: 2.2,
    timer: 0,
    targetX: 0,
    targetZ: 0,
    radius: 3.8,
    damage: 25,
  });

  // Current Phase Questions
  const currentPhaseQuestions = useMemo(() => {
    const currentPhase = config.phases.find((p) => p.phaseNumber === currentPhaseId) || config.phases[0];
    return currentPhase.questions && currentPhase.questions.length > 0
      ? currentPhase.questions
      : [
          {
            id: 'fallback-boss-q',
            question: `Identify the critical theoretical model for ${config.weakness}:`,
            options: [
              `Foundational invariant governing ${config.weakness}`,
              'Arbitrary non-standard guess',
              'Obsolete heuristic with edge-case vulnerabilities',
              'Decorative definition without application',
            ],
            correctAnswerIndex: 0,
            explanation: `${config.weakness} is the pivotal weakness of this syllabus boss!`,
            hint: `Focus on: ${config.weakness}`,
          },
        ];
  }, [config.phases, currentPhaseId, config.weakness]);

  const activeQuestion = currentPhaseQuestions[currentQuestionIndex] || currentPhaseQuestions[0] || null;

  // Helper to spawn floating combat text
  const addFloatingText = (
    text: string,
    type: FloatingText['type'],
    xPercent: number = 50,
    yPercent: number = 45
  ) => {
    const id = `ft-${Date.now()}-${Math.random()}`;
    const newFt: FloatingText = {
      id,
      text,
      type,
      x: xPercent + (Math.random() - 0.5) * 8,
      y: yPercent + (Math.random() - 0.5) * 8,
    };
    setFloatingTexts((prev) => [...prev, newFt]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  // Initialize 3D Isometric Diablo Arena
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Create Engine
    const engine = new ThreeEngine(mountRef.current, {
      antialias: true,
      shadows: true,
      fogColor: 0x050711,
      fogNear: 15,
      fogFar: 65,
      clearColor: 0x04050d,
    });
    engineRef.current = engine;

    // Set isometric camera position & angle
    engine.camera.position.set(0, 16, 20);
    engine.camera.lookAt(0, 1.5, 1);

    // 2. Arena Lighting
    const ambientLight = new THREE.AmbientLight(0x6366f1, 0.6);
    engine.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    engine.scene.add(dirLight);

    // Menacing Red Point Light under Boss
    const bossCoreLight = new THREE.PointLight(0xef4444, 4, 25);
    bossCoreLight.position.set(0, 3, 0);
    engine.scene.add(bossCoreLight);

    // 4 Corner Torch Point Lights with warm flicker
    const torchColors = [0xf97316, 0xfbbf24, 0xf97316, 0xfbbf24];
    const torchPos = [
      [-10, 3, -10],
      [10, 3, -10],
      [-10, 3, 10],
      [10, 3, 10],
    ];
    const torchLights: THREE.PointLight[] = [];

    torchPos.forEach((p, idx) => {
      const pl = new THREE.PointLight(torchColors[idx], 2.5, 18);
      pl.position.set(p[0], p[1], p[2]);
      engine.scene.add(pl);
      torchLights.push(pl);
    });

    // 3. Gothic Arena Floor & Surrounding Columns
    const floorGeo = new THREE.CylinderGeometry(14, 14.5, 1.0, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1429,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    engine.scene.add(floor);

    // Glowing Arcane Arena Outer Ring
    const ringGeo = new THREE.RingGeometry(13.5, 14.0, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    engine.scene.add(ring);

    // Inner Inscription Decal Circle
    const innerRingGeo = new THREE.RingGeometry(7.0, 7.2, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    engine.scene.add(innerRing);

    // Surrounding Gothic Pillars
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = Math.cos(angle) * 12.8;
      const pz = Math.sin(angle) * 12.8;

      const colGeo = new THREE.CylinderGeometry(0.6, 0.75, 7, 8);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
      });
      const column = new THREE.Mesh(colGeo, colMat);
      column.position.set(px, 3.5, pz);
      column.castShadow = true;
      column.receiveShadow = true;
      engine.scene.add(column);

      // Glowing Brazier atop column
      const brazierGeo = new THREE.OctahedronGeometry(0.3, 0);
      const brazierMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.2,
      });
      const brazier = new THREE.Mesh(brazierGeo, brazierMat);
      brazier.position.set(px, 7.3, pz);
      engine.scene.add(brazier);
    }

    // 4. Create 3D Boss Character Entity
    const boss = ProceduralMeshes.createBossCharacter(0xdc2626);
    boss.root.position.set(0, 0, -1);
    bossModelRef.current = boss;
    engine.scene.add(boss.root);

    // 5. Create 3D Player Entity
    const player = ProceduralMeshes.createRunnerCharacter(0x38bdf8);
    player.root.position.set(playerState.current.x, 0, playerState.current.z);
    playerModelRef.current = player;
    engine.scene.add(player.root);

    // 6. Create Attack Telegraph Decal
    const telegraph = ProceduralMeshes.createTelegraphDecal(3.8, 0xef4444);
    telegraph.mesh.visible = false;
    telegraphDecalRef.current = telegraph;
    engine.scene.add(telegraph.mesh);

    // 7. Create Particle Burst System
    const particles = ProceduralMeshes.createParticleSystem(90, 0xf43f5e);
    particleSystemRef.current = particles;
    engine.scene.add(particles.points);

    // 8. Combat Loop (60 FPS)
    let attackCooldownTimer = 3.0; // Seconds between boss attacks

    const unregisterLoop = engine.onUpdate((delta, elapsed) => {
      if (gameState !== 'combat') return;

      const pState = playerState.current;
      const pMesh = playerModelRef.current;
      const bMesh = bossModelRef.current;
      const tele = telegraphState.current;

      // Update particles
      if (particleSystemRef.current) {
        particleSystemRef.current.update(delta);
      }

      // Torch Light Flicker
      torchLights.forEach((tl, idx) => {
        tl.intensity = 2.2 + Math.sin(elapsed * 8 + idx) * 0.4;
      });

      // Rotate runes
      innerRing.rotation.z = elapsed * 0.15;

      // 1. Player Movement & WASD physics
      let mx = 0;
      let mz = 0;
      if (keys.current.left) mx -= 1;
      if (keys.current.right) mx += 1;
      if (keys.current.up) mz -= 1;
      if (keys.current.down) mz += 1;

      const isMoving = mx !== 0 || mz !== 0;
      if (isMoving) {
        const len = Math.sqrt(mx * mx + mz * mz);
        mx /= len;
        mz /= len;
      }

      // Dodge roll speed multiplier
      let speed = 7.5;
      if (pState.dodgeRollTimer > 0) {
        pState.dodgeRollTimer -= delta;
        speed = 15.0; // Fast evasive dash!
      }

      pState.vx = mx * speed;
      pState.vz = mz * speed;

      pState.x += pState.vx * delta;
      pState.z += pState.vz * delta;

      // Clamp player within circular arena (radius 12.0)
      const distFromCenter = Math.sqrt(pState.x * pState.x + pState.z * pState.z);
      if (distFromCenter > 11.5) {
        const angle = Math.atan2(pState.z, pState.x);
        pState.x = Math.cos(angle) * 11.5;
        pState.z = Math.sin(angle) * 11.5;
      }

      // Invulnerability frames
      if (pState.invulnTimer > 0) {
        pState.invulnTimer -= delta;
        if (pState.invulnTimer <= 0) {
          pState.isInvulnerable = false;
          setIsDodging(false);
        }
      }

      // Update Player 3D Mesh
      if (pMesh) {
        pMesh.root.position.set(pState.x, 0, pState.z);
        if (isMoving) {
          // Face direction of movement
          const targetAngle = Math.atan2(pState.vx, pState.vz);
          pMesh.root.rotation.y = targetAngle;
        } else {
          // Look toward Boss
          const targetAngle = Math.atan2(-pState.x, -1 - pState.z);
          pMesh.root.rotation.y = targetAngle;
        }
        pMesh.updateAnimation(elapsed, isMoving, pState.dodgeRollTimer > 0);
      }

      // 2. Boss Attack Telegraph Cycle
      if (!tele.active) {
        attackCooldownTimer -= delta;
        if (attackCooldownTimer <= 0) {
          // Launch new Telegraph targeting player's current position!
          tele.active = true;
          tele.timer = 0;
          tele.duration = currentPhaseId === 3 ? 1.4 : currentPhaseId === 2 ? 1.8 : 2.2;
          tele.targetX = pState.x;
          tele.targetZ = pState.z;
          tele.radius = currentPhaseId === 3 ? 4.5 : 3.8;
          tele.damage = currentPhaseId === 3 ? 35 : 25;

          if (telegraphDecalRef.current) {
            telegraphDecalRef.current.mesh.position.set(tele.targetX, 0.05, tele.targetZ);
            telegraphDecalRef.current.mesh.visible = true;
            telegraphDecalRef.current.setProgress(0);
          }

          soundFX.playAttack();
          setPanicDialogue(getProfessorPanicComment('boss_dodge_incoming'));
        }
      } else {
        // Telegraph in progress: filling danger circle!
        tele.timer += delta;
        const progress = tele.timer / tele.duration;

        if (telegraphDecalRef.current) {
          telegraphDecalRef.current.setProgress(progress);
        }

        if (tele.timer >= tele.duration) {
          // ATTACK STRIKES!
          tele.active = false;
          if (telegraphDecalRef.current) {
            telegraphDecalRef.current.mesh.visible = false;
          }

          // Burst flame particles on impact
          if (particleSystemRef.current) {
            particleSystemRef.current.burst(new THREE.Vector3(tele.targetX, 0.5, tele.targetZ), 9);
          }

          // Check if player is inside strike zone
          const dx = pState.x - tele.targetX;
          const dz = pState.z - tele.targetZ;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (dist <= tele.radius) {
            if (pState.isInvulnerable) {
              // Dodged with i-frames!
              statsRef.current.attacksDodged++;
              soundFX.playDodge();
              addFloatingText('DODGE!', 'dodge', 50, 40);
              setPanicDialogue(getProfessorPanicComment('boss_dodge_success'));
            } else {
              // Direct Hit! Player takes damage!
              statsRef.current.damageTaken += tele.damage;
              statsRef.current.attacksFailed++;
              soundFX.playWrong();
              addFloatingText(`-${tele.damage} HP`, 'damage-player', 50, 45);

              setPlayerHp((prev) => {
                const nextHp = Math.max(0, prev - tele.damage);
                if (nextHp <= 0) {
                  // Player Defeat
                  handleDefeatRef.current();
                } else if (nextHp <= 30) {
                  setPanicDialogue(getProfessorPanicComment('boss_player_low_hp'));
                }
                return nextHp;
              });

              // Screen shake / knockback
              pState.invulnTimer = 0.6; // brief hit invuln
              pState.isInvulnerable = true;
            }
          } else {
            // Player was safely outside blast radius
            statsRef.current.attacksDodged++;
            addFloatingText('EVADED!', 'dodge', 50, 40);
          }

          attackCooldownTimer = currentPhaseId === 3 ? 2.0 : 3.0;
        }
      }

      // 3. Update Boss Animation
      if (bMesh) {
        bMesh.updateAnimation(elapsed, tele.active, currentPhaseId >= 2);
      }
    });

    // 9. Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.current.right = true;

      // Space / Shift triggers Dodge Roll
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        performDodgeRef.current();
      }

      // Q triggers potion
      if (e.code === 'KeyQ') {
        drinkPotionRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unregisterLoop();
      engine.dispose();
      engineRef.current = null;
    };
  }, [gameState, currentPhaseId]);

  // Player Dodge Action with I-Frames
  const performDodge = () => {
    if (dodgeCooldown || playerState.current.dodgeRollTimer > 0) return;

    soundFX.playDodge();
    playerState.current.dodgeRollTimer = 0.35; // 350ms of rapid dash
    playerState.current.isInvulnerable = true;
    playerState.current.invulnTimer = 0.45; // 450ms of i-frames
    setIsDodging(true);
    setDodgeCooldown(true);

    if (particleSystemRef.current) {
      particleSystemRef.current.burst(
        new THREE.Vector3(playerState.current.x, 0.4, playerState.current.z),
        5
      );
    }

    setTimeout(() => {
      setDodgeCooldown(false);
    }, 900); // 900ms cooldown
  };

  // Potion healing
  const drinkPotion = () => {
    if (potionsLeft <= 0 || playerHp >= maxPlayerHp) return;

    soundFX.playHeal();
    setPotionsLeft((p) => p - 1);
    statsRef.current.potionsUsed++;
    setPlayerHp((hp) => Math.min(maxPlayerHp, hp + 45));
    addFloatingText('+45 HP', 'heal', 50, 50);
    setPanicDialogue(getProfessorPanicComment('boss_potion_used'));

    if (particleSystemRef.current) {
      particleSystemRef.current.burst(
        new THREE.Vector3(playerState.current.x, 1.2, playerState.current.z),
        6
      );
    }
  };

  // Handle Syllabus Weakness Question Answer
  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuestion || answeredState !== 'idle') return;
    setSelectedOption(optionIndex);

    statsRef.current.questionsAnswered++;
    const isCorrect = optionIndex === activeQuestion.correctAnswerIndex;

    if (isCorrect) {
      statsRef.current.correctAnswers++;
      soundFX.playCorrect();
      setAnsweredState('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > statsRef.current.maxStreak) {
        statsRef.current.maxStreak = newStreak;
      }

      // Deal Massive Damage to Boss!
      const baseDmg = Math.round(config.maxHp * 0.35);
      const critMultiplier = newStreak > 1 ? 1.5 : 1.0;
      const totalDamage = Math.round(baseDmg * critMultiplier);

      statsRef.current.damageDealt += totalDamage;
      addFloatingText(`CRIT! -${totalDamage} HP`, 'crit-boss', 50, 30);
      setPanicDialogue(getProfessorPanicComment('correct', `${newStreak}x Weakness Strike!`));

      // Particle strike directly on the boss model
      if (particleSystemRef.current) {
        particleSystemRef.current.burst(new THREE.Vector3(0, 2.5, -1), 14);
      }

      setBossHp((prev) => {
        const nextHp = Math.max(0, prev - totalDamage);
        checkPhaseTransitions(nextHp);
        if (nextHp <= 0) {
          handleVictory();
        }
        return nextHp;
      });

      // Next question after brief celebration delay
      setTimeout(() => {
        advanceQuestion();
      }, 1400);
    } else {
      soundFX.playWrong();
      setAnsweredState('wrong');
      setStreak(0);
      // Backfire penalty
      const recoilDmg = 15;
      statsRef.current.damageTaken += recoilDmg;
      setPlayerHp((hp) => {
        const nextHp = Math.max(0, hp - recoilDmg);
        if (nextHp <= 0) handleDefeat();
        return nextHp;
      });
      addFloatingText(`RECOIL -${recoilDmg} HP`, 'damage-player', 50, 50);
      setPanicDialogue(getProfessorPanicComment('wrong'));

      setTimeout(() => {
        advanceQuestion();
      }, 1600);
    }
  };

  const advanceQuestion = () => {
    const nextIdx = (currentQuestionIndex + 1) % currentPhaseQuestions.length;
    setCurrentQuestionIndex(nextIdx);
    setSelectedOption(null);
    setAnsweredState('idle');
    setShowHint(false);
  };

  // Phase transition checks
  const checkPhaseTransitions = (hp: number) => {
    const hpPercent = (hp / config.maxHp) * 100;
    if (hpPercent <= 33 && currentPhaseId < 3) {
      setCurrentPhaseId(3);
      statsRef.current.phaseReached = 3;
      soundFX.playPhaseShift();
      addFloatingText('PHASE 3: FINAL OVERDRIVE!', 'phase', 50, 30);
      setPanicDialogue(getProfessorPanicComment('boss_phase3'));
    } else if (hpPercent <= 66 && currentPhaseId < 2) {
      setCurrentPhaseId(2);
      statsRef.current.phaseReached = 2;
      soundFX.playPhaseShift();
      addFloatingText('PHASE 2: ENRAGED!', 'phase', 50, 30);
      setPanicDialogue(getProfessorPanicComment('boss_phase2'));
    }
  };

  const handleVictory = () => {
    setGameState('victory');
    soundFX.playVictory();
    statsRef.current.durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    setFinalStats({ ...statsRef.current });
    setPanicDialogue(getProfessorPanicComment('boss_victory'));
  };

  const handleDefeat = () => {
    setGameState('defeat');
    soundFX.playWrong();
    statsRef.current.durationSeconds = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    setFinalStats({ ...statsRef.current });
    setPanicDialogue(getProfessorPanicComment('boss_defeat'));
  };

  useEffect(() => {
    performDodgeRef.current = performDodge;
    drinkPotionRef.current = drinkPotion;
    handleDefeatRef.current = handleDefeat;
  });

  const claimVictory = () => {
    const finalScore = Math.max(
      100,
      statsRef.current.damageDealt - statsRef.current.damageTaken + statsRef.current.attacksDodged * 50
    );
    onComplete(finalScore, statsRef.current);
  };

  return (
    <div className="relative w-full h-full bg-[#04050d] select-none overflow-hidden flex flex-col font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Floating Combat Damage Numbers */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 font-black text-lg sm:text-2xl drop-shadow-md animate-in fade-in zoom-in-75 duration-300 ${
              ft.type === 'crit-boss'
                ? 'text-amber-300 scale-125'
                : ft.type === 'damage-boss'
                ? 'text-rose-400'
                : ft.type === 'damage-player'
                ? 'text-rose-500'
                : ft.type === 'dodge'
                ? 'text-cyan-300'
                : ft.type === 'heal'
                ? 'text-emerald-400'
                : 'text-purple-300 text-xl'
            }`}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Top HUD: Boss Health Bar & Phase Indicator */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-2xl">🐉</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fantasy font-black text-sm sm:text-base text-slate-100 uppercase tracking-wide">
                  {config.bossName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  PHASE {currentPhaseId}/3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Weakness: <span className="text-amber-300 font-bold">{config.weakness}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsMuted(soundFX.toggleMute())}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-1.5 border border-rose-500/30 shadow-xl">
          <div className="relative w-full h-4 sm:h-5 bg-slate-900 rounded-xl overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-xl ${
                currentPhaseId === 3
                  ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600'
                  : currentPhaseId === 2
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600'
                  : 'bg-gradient-to-r from-rose-700 to-red-500'
              }`}
              style={{ width: `${Math.max(0, (bossHp / config.maxHp) * 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-white drop-shadow">
              {bossHp} / {config.maxHp} HP ({Math.round((bossHp / config.maxHp) * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Professor Panic Combat Alert Banner */}
      <div className="relative z-10 px-4 py-2 mx-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-3 text-xs text-slate-300 shadow-lg pointer-events-none">
        <span className="text-xl">🧙‍♂️</span>
        <div className="flex-1">
          <span className="text-purple-400 font-bold mr-1.5">Prof. Panic:</span>
          <span>{panicDialogue}</span>
        </div>
      </div>

      {/* Bottom Area: Player HUD & Syllabus Weakness Channeling */}
      <div className="relative z-10 mt-auto p-3 sm:p-4 flex flex-col gap-3 pointer-events-none">
        {/* Syllabus Tactical Weakness Console (Active Question) */}
        {activeQuestion && gameState === 'combat' && (
          <div className="max-w-2xl w-full mx-auto bg-[#0d1024]/90 backdrop-blur-md border border-purple-500/40 rounded-3xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                TACTICAL WEAKNESS WINDOW
              </span>
              {activeQuestion.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-mono"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Clue' : 'Weakness Clue'}</span>
                </button>
              )}
            </div>

            {showHint && activeQuestion.hint && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                💡 {activeQuestion.hint}
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
              {activeQuestion.question}
            </p>

            {/* 4 Answer Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuestion.correctAnswerIndex;

                let btnStyle = 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200';
                if (answeredState !== 'idle') {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600/40 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-600/40 border-rose-500 text-rose-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={answeredState !== 'idle'}
                    onClick={() => handleAnswerSubmit(idx)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2 shadow-sm ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center font-mono font-bold text-[10px] text-purple-300 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-tight">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Health Bar & Action Controls Bar */}
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Player HP */}
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/60 shadow-lg">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
            <div className="w-24 sm:w-36 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-200">{playerHp} HP</span>
          </div>

          {/* Quick Dodge & Potion Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Potion Button */}
            <button
              type="button"
              disabled={potionsLeft <= 0 || playerHp >= maxPlayerHp}
              onClick={drinkPotion}
              className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all"
              title="Drink Healing Potion (Q)"
            >
              <span>🧪</span>
              <span>Heal ({potionsLeft})</span>
            </button>

            {/* Dodge Roll Button */}
            <button
              type="button"
              disabled={dodgeCooldown}
              onClick={performDodge}
              className={`px-5 py-2 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all ${
                isDodging
                  ? 'bg-cyan-500 text-white shadow-cyan-500/50'
                  : dodgeCooldown
                  ? 'bg-slate-800 text-slate-500 border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
              }`}
              title="Dodge Roll with Invulnerability (Space)"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>{isDodging ? 'ROLLING!' : 'DODGE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Victory Conquest Screen */}
      {gameState === 'victory' && finalStats && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#0d1024] border-2 border-emerald-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-950/60 animate-bounce">
              🏆
            </div>

            <div>
              <h2 className="font-fantasy font-black text-2xl text-slate-100">
                BOSS VANQUISHED!
              </h2>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                {config.bossName} has fallen!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#080a18] border border-purple-500/20 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Damage Dealt:</span>
                <span className="font-mono text-cyan-300 font-bold">{finalStats.damageDealt} HP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attacks Dodged:</span>
                <span className="font-mono text-emerald-300 font-bold">{finalStats.attacksDodged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Syllabus Questions Mastered:</span>
                <span className="font-mono text-purple-300 font-bold">{finalStats.correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Battle Time:</span>
                <span className="font-mono text-amber-300 font-bold">{finalStats.durationSeconds}s</span>
              </div>
            </div>

            <button
              type="button"
              onClick={claimVictory}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              Claim Conquest & Return ✓
            </button>
          </div>
        </div>
      )}

      {/* Defeat Screen */}
      {gameState === 'defeat' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#160d15] border-2 border-rose-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-rose-950/60">
              💀
            </div>

            <div>
              <h2 className="font-black text-2xl text-slate-100">DEFEATED IN BATTLE</h2>
              <p className="text-xs text-rose-300 font-mono mt-0.5">
                The boss overwhelmed your defenses!
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Study the course syllabus weakness ({config.weakness}) and time your dodges when red telegraph decals appear!
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setGameState('combat');
                  setPlayerHp(100);
                  setBossHp(config.maxHp);
                  setCurrentPhaseId(1);
                  setPotionsLeft(2);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
              >
                Retry Battle 🔄
              </button>

              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all"
                >
                  Retreat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
