import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Camera,
  Award,
} from 'lucide-react';
import { GameQuestion, QuestGameConfig } from '../../types';
import { ThreeEngine } from './ThreeEngine';
import { ProceduralMeshes } from './ProceduralMeshes';
import { soundFX } from '../../lib/audio-effects';
import { getProfessorPanicComment } from '../../lib/professor-panic';

interface DoOrDie3DProps {
  gameConfig: QuestGameConfig;
  onComplete: (score: number) => void;
  courseCode?: string;
  courseTitle?: string;
}

interface PlatformSegment {
  id: number;
  zStart: number;
  zEnd: number;
  type: 'straight' | 'gap' | 'moving' | 'spinner' | 'gate';
  mesh: THREE.Object3D;
  gateQuestionIndex?: number;
  isCompleted?: boolean;
}

export const DoOrDie3D: React.FC<DoOrDie3DProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // Sound State
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  // Questions configuration
  const questions: GameQuestion[] = useMemo(() => {
    return gameConfig.questions && gameConfig.questions.length > 0
      ? gameConfig.questions
      : [
          {
            id: 'q-default',
            question: `What is the primary academic foundation of ${gameConfig.topic}?`,
            options: [
              `Core principles and system models governing ${gameConfig.topic}`,
              'Arbitrary non-standard terminology',
              'Deprecated rules with zero practical application',
              'Decorative theory without proof',
            ],
            correctAnswerIndex: 0,
            explanation: `${gameConfig.topic} represents a core requirement from your syllabus.`,
            hint: 'Focus on foundational syllabus theory and operational constraints.',
          },
        ];
  }, [gameConfig.questions, gameConfig.topic]);

  const totalCheckpoints = questions.length;

  // Game UI & Interaction State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<GameQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [explanation, setExplanation] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [professorMessage, setProfessorMessage] = useState<string>(
    "DO-OR-DIE 3D: Guide your runner! Steer with A/D, Speed with W/S, Jump with Space (Double-Jump enabled!)."
  );
  const [cameraMode, setCameraMode] = useState<'chase' | 'iso'>('chase');

  const streakRef = useRef(streak);
  const isGameWonRef = useRef(isGameWon);

  useEffect(() => {
    streakRef.current = streak;
    isGameWonRef.current = isGameWon;
  }, [streak, isGameWon]);

  // Mutable Physics & Runner State (accessed at 60fps in ThreeEngine loop)
  const runnerState = useRef({
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: -14, // Forward running speed
    baseVz: -14,
    speedBoostTimer: 0,
    grounded: true,
    jumpCount: 0,
    maxJumps: 2, // Allows double jump!
    isPaused: false,
    checkpointZ: 0,
    trollFallTimer: 0,
    currentGateIndex: 0,
  });

  const keys = useRef({
    left: false,
    right: false,
    forward: false,
    backward: false,
    jump: false,
  });

  // Track dynamic platforms & collectibles
  const segmentsRef = useRef<PlatformSegment[]>([]);
  const collectiblesRef = useRef<Array<{ mesh: THREE.Group; update: (t: number) => void; collected: boolean; pos: THREE.Vector3 }>>([]);
  const particleSystemRef = useRef<ReturnType<typeof ProceduralMeshes.createParticleSystem> | null>(null);
  const runnerModelRef = useRef<ReturnType<typeof ProceduralMeshes.createRunnerCharacter> | null>(null);

  // Initialize Three.js Engine & 3D World
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Create Engine
    const engine = new ThreeEngine(mountRef.current, {
      antialias: true,
      shadows: true,
      fogColor: 0x090d1e,
      fogNear: 20,
      fogFar: 140,
      clearColor: 0x060814,
    });
    engineRef.current = engine;

    // 2. Lighting (Cyber-Fantasy Synthwave / Academic Arena)
    const ambientLight = new THREE.AmbientLight(0xa5b4fc, 0.7);
    engine.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    engine.scene.add(dirLight);

    // Glowing cyan/purple accent point lights
    const accentLight1 = new THREE.PointLight(0x38bdf8, 3, 30);
    accentLight1.position.set(-6, 8, -20);
    engine.scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xa855f7, 3, 30);
    accentLight2.position.set(6, 8, -50);
    engine.scene.add(accentLight2);

    // 3. Grid Starfield / Sky Horizon
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 200;
      starPos[i + 1] = Math.random() * 80 + 5;
      starPos[i + 2] = -Math.random() * 250;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    engine.scene.add(stars);

    // 4. Create Runner Character Model
    const runner = ProceduralMeshes.createRunnerCharacter(0x8b5cf6);
    runnerModelRef.current = runner;
    engine.scene.add(runner.root);

    // 5. Create Particle Burst System
    const particles = ProceduralMeshes.createParticleSystem(80, 0x38bdf8);
    particleSystemRef.current = particles;
    engine.scene.add(particles.points);

    // 6. Build Procedural 3D Course with Knowledge Gates
    const segments: PlatformSegment[] = [];
    const collectibles: typeof collectiblesRef.current = [];

    // Materials for course tiles
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x13172e,
      roughness: 0.3,
      metalness: 0.8,
    });
    const tileEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    let currentZ = 0;
    const segmentLength = 28;

    // Initial Safe Runway
    const startMesh = new THREE.Group();
    const startGeo = new THREE.BoxGeometry(6.4, 0.8, 20);
    const startTile = new THREE.Mesh(startGeo, tileMat);
    startTile.position.set(0, -0.4, -10);
    startTile.receiveShadow = true;
    startMesh.add(startTile);

    const startEdgeGeo = new THREE.BoxGeometry(0.2, 0.85, 20);
    const leftEdge = new THREE.Mesh(startEdgeGeo, tileEdgeMat);
    leftEdge.position.set(-3.2, -0.4, -10);
    startMesh.add(leftEdge);

    const rightEdge = new THREE.Mesh(startEdgeGeo, tileEdgeMat);
    rightEdge.position.set(3.2, -0.4, -10);
    startMesh.add(rightEdge);

    engine.scene.add(startMesh);
    segments.push({
      id: 0,
      zStart: 0,
      zEnd: -20,
      type: 'straight',
      mesh: startMesh,
    });

    currentZ = -20;

    // Generate tracks interspersed with Syllabus Checkpoints
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      // 1-2 Challenge segments before each question gate
      const challengeTypes: ('straight' | 'moving' | 'spinner' | 'gap')[] = [
        'straight',
        'moving',
        'spinner',
      ];
      const selectedType = challengeTypes[qIdx % challengeTypes.length];

      const segMesh = new THREE.Group();

      if (selectedType === 'straight') {
        const pGeo = new THREE.BoxGeometry(6.4, 0.8, segmentLength);
        const pMesh = new THREE.Mesh(pGeo, tileMat);
        pMesh.position.set(0, -0.4, currentZ - segmentLength / 2);
        pMesh.receiveShadow = true;
        segMesh.add(pMesh);

        // Add 2 collectible crystals on straight track
        for (let c = 0; c < 2; c++) {
          const crystal = ProceduralMeshes.createCollectibleCrystal(0x38bdf8);
          const cZ = currentZ - segmentLength * 0.3 * (c + 1);
          const cX = (c % 2 === 0 ? -1.5 : 1.5);
          crystal.mesh.position.set(cX, 1.2, cZ);
          engine.scene.add(crystal.mesh);
          collectibles.push({
            mesh: crystal.mesh,
            update: crystal.update,
            collected: false,
            pos: new THREE.Vector3(cX, 1.2, cZ),
          });
        }
      } else if (selectedType === 'moving') {
        // Floating island with side-to-side oscillation
        const pGeo = new THREE.BoxGeometry(5.0, 0.8, segmentLength);
        const pMesh = new THREE.Mesh(pGeo, tileMat);
        pMesh.position.set(0, -0.4, currentZ - segmentLength / 2);
        pMesh.receiveShadow = true;
        segMesh.add(pMesh);

        // Glowing trim
        const trim = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.2, segmentLength), tileEdgeMat);
        trim.position.set(0, -0.05, currentZ - segmentLength / 2);
        segMesh.add(trim);

        // Crystal on island
        const crystal = ProceduralMeshes.createCollectibleCrystal(0xa855f7);
        crystal.mesh.position.set(0, 1.2, currentZ - segmentLength / 2);
        engine.scene.add(crystal.mesh);
        collectibles.push({
          mesh: crystal.mesh,
          update: crystal.update,
          collected: false,
          pos: new THREE.Vector3(0, 1.2, currentZ - segmentLength / 2),
        });
      } else if (selectedType === 'spinner') {
        // Platform with rotating hazard bar
        const pGeo = new THREE.BoxGeometry(6.4, 0.8, segmentLength);
        const pMesh = new THREE.Mesh(pGeo, tileMat);
        pMesh.position.set(0, -0.4, currentZ - segmentLength / 2);
        pMesh.receiveShadow = true;
        segMesh.add(pMesh);

        const spinnerBarGeo = new THREE.BoxGeometry(5.4, 0.45, 0.45);
        const spinner = new THREE.Mesh(spinnerBarGeo, hazardMat);
        spinner.position.set(0, 0.6, currentZ - segmentLength / 2);
        spinner.name = 'spinner-hazard';
        segMesh.add(spinner);
      }

      engine.scene.add(segMesh);
      segments.push({
        id: segments.length,
        zStart: currentZ,
        zEnd: currentZ - segmentLength,
        type: selectedType,
        mesh: segMesh,
      });

      currentZ -= segmentLength;

      // Now add Knowledge Checkpoint Gate
      const gateMesh = new THREE.Group();
      const gatePillar = ProceduralMeshes.createKnowledgeGate(0xa855f7);
      gatePillar.position.set(0, 0, currentZ);
      gateMesh.add(gatePillar);

      // Gate Platform tile
      const gatePlatGeo = new THREE.BoxGeometry(7.0, 0.8, 10);
      const gatePlat = new THREE.Mesh(gatePlatGeo, tileMat);
      gatePlat.position.set(0, -0.4, currentZ - 5);
      gatePlat.receiveShadow = true;
      gateMesh.add(gatePlat);

      engine.scene.add(gateMesh);
      segments.push({
        id: segments.length,
        zStart: currentZ,
        zEnd: currentZ - 10,
        type: 'gate',
        mesh: gateMesh,
        gateQuestionIndex: qIdx,
        isCompleted: false,
      });

      currentZ -= 10;
    }

    // Final Victory Gate & Sanctuary Portal
    const finalMesh = new THREE.Group();
    const finalGeo = new THREE.BoxGeometry(10, 0.8, 25);
    const finalPlat = new THREE.Mesh(finalGeo, tileMat);
    finalPlat.position.set(0, -0.4, currentZ - 12.5);
    finalPlat.receiveShadow = true;
    finalMesh.add(finalPlat);

    const finishGate = ProceduralMeshes.createKnowledgeGate(0x10b981);
    finishGate.position.set(0, 0, currentZ - 20);
    finalMesh.add(finishGate);

    engine.scene.add(finalMesh);
    segments.push({
      id: segments.length,
      zStart: currentZ,
      zEnd: currentZ - 25,
      type: 'straight',
      mesh: finalMesh,
    });

    segmentsRef.current = segments;
    collectiblesRef.current = collectibles;

    // 7. Core 60fps Game Loop
    const unregisterLoop = engine.onUpdate((delta, elapsed) => {
      const runnerP = runnerState.current;
      const rMesh = runnerModelRef.current;
      const k = keys.current;

      // Update collectibles rotation
      collectiblesRef.current.forEach((c) => {
        if (!c.collected) {
          c.update(elapsed);
        }
      });

      // Update particle effects
      if (particleSystemRef.current) {
        particleSystemRef.current.update(delta);
      }

      // Handle Troll Fall respawn
      if (runnerP.trollFallTimer > 0) {
        runnerP.trollFallTimer -= delta;
        runnerP.y -= 25 * delta;
        if (rMesh) {
          rMesh.root.position.set(runnerP.x, runnerP.y, runnerP.z);
          rMesh.root.rotation.x += delta * 6;
        }
        if (runnerP.trollFallTimer <= 0) {
          // Respawn at last checkpoint
          runnerP.x = 0;
          runnerP.y = 0;
          runnerP.z = runnerP.checkpointZ;
          runnerP.vx = 0;
          runnerP.vy = 0;
          runnerP.grounded = true;
          runnerP.jumpCount = 0;
          if (rMesh) {
            rMesh.root.rotation.set(0, 0, 0);
          }
        }
        return;
      }

      // If waiting for question answer at gate, freeze runner in front of terminal
      if (runnerP.isPaused) {
        if (rMesh) {
          rMesh.updateAnimation(elapsed, false, false);
        }
        return;
      }

      // 1. Steering & Forward Movement
      const steerSpeed = 9.0;
      if (k.left) runnerP.vx = -steerSpeed;
      else if (k.right) runnerP.vx = steerSpeed;
      else runnerP.vx *= 0.75; // Friction

      runnerP.x += runnerP.vx * delta;
      // Clamp runner X to track width (-2.8 to 2.8)
      if (runnerP.x < -2.8) {
        runnerP.x = -2.8;
        runnerP.vx = 0;
      }
      if (runnerP.x > 2.8) {
        runnerP.x = 2.8;
        runnerP.vx = 0;
      }

      // Speed boost timer from correct answer
      if (runnerP.speedBoostTimer > 0) {
        runnerP.speedBoostTimer -= delta;
        runnerP.vz = runnerP.baseVz * 1.5;
      } else {
        if (k.forward) runnerP.vz = runnerP.baseVz * 1.25;
        else if (k.backward) runnerP.vz = runnerP.baseVz * 0.75;
        else runnerP.vz = runnerP.baseVz;
      }

      runnerP.z += runnerP.vz * delta;

      // 2. Vertical Gravity & Jumping
      const gravity = -32;
      runnerP.vy += gravity * delta;
      runnerP.y += runnerP.vy * delta;

      if (runnerP.y <= 0) {
        runnerP.y = 0;
        runnerP.vy = 0;
        runnerP.grounded = true;
        runnerP.jumpCount = 0;
      } else {
        runnerP.grounded = false;
      }

      // 3. Collision with collectibles
      collectiblesRef.current.forEach((c) => {
        if (!c.collected) {
          const dx = runnerP.x - c.pos.x;
          const dy = runnerP.y - c.pos.y;
          const dz = runnerP.z - c.pos.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < 2.5) {
            c.collected = true;
            c.mesh.visible = false;
            soundFX.playCorrect();
            setCrystalsCollected((prev) => prev + 1);
            setScore((prev) => prev + 50);
            if (particleSystemRef.current) {
              particleSystemRef.current.burst(new THREE.Vector3(c.pos.x, c.pos.y, c.pos.z), 5);
            }
          }
        }
      });

      // 4. Update Moving & Spinning Obstacles
      segmentsRef.current.forEach((seg) => {
        if (seg.type === 'moving') {
          seg.mesh.position.x = Math.sin(elapsed * 2.5) * 1.4;
        } else if (seg.type === 'spinner') {
          const spinner = seg.mesh.getObjectByName('spinner-hazard');
          if (spinner) {
            spinner.rotation.y = elapsed * 4.5;
            // Check collision with spinner
            const segMidZ = (seg.zStart + seg.zEnd) / 2;
            if (Math.abs(runnerP.z - segMidZ) < 1.2 && runnerP.y < 0.8) {
              // Hit hazard!
              soundFX.playWrong();
              setScore((prev) => Math.max(0, prev - 30));
              setStreak(0);
              const currentStreak = streakRef.current;
              setProfessorMessage(getProfessorPanicComment('wrong', currentStreak > 1 ? `${currentStreak}x streak lost!` : undefined));
              runnerP.vy = 8; // Small knockback bounce
              runnerP.vz = runnerP.baseVz * 0.4;
            }
          }
        } else if (seg.type === 'gate' && !seg.isCompleted && seg.gateQuestionIndex !== undefined) {
          // Check if runner reached the gate Z threshold
          if (runnerP.z <= seg.zStart && runnerP.z >= seg.zEnd) {
            // Trigger Gate question checkpoint!
            runnerP.isPaused = true;
            runnerP.checkpointZ = seg.zStart + 2;
            runnerP.currentGateIndex = seg.gateQuestionIndex;
            setCurrentCheckpointIndex(seg.gateQuestionIndex);
            setActiveQuestion(questions[seg.gateQuestionIndex]);
            setSelectedOption(null);
            setFeedbackState('none');
            setExplanation('');
            setShowHint(false);
            setProfessorMessage(
              `KNOWLEDGE GATE #${seg.gateQuestionIndex + 1}: Solve the syllabus question to unlock the path!`
            );
          }
        }
      });

      // 5. Update Runner 3D Mesh
      if (rMesh) {
        rMesh.root.position.set(runnerP.x, runnerP.y, runnerP.z);
        // Tilt slightly into turns
        rMesh.root.rotation.z = -runnerP.vx * 0.04;
        rMesh.updateAnimation(elapsed, true, !runnerP.grounded);
      }

      // 6. Camera Follow (Smooth lerp with chase or isometric angle)
      if (cameraMode === 'chase') {
        const targetCamX = runnerP.x * 0.4;
        const targetCamY = runnerP.y * 0.5 + 4.5;
        const targetCamZ = runnerP.z + 8.5;

        engine.camera.position.x += (targetCamX - engine.camera.position.x) * 0.12;
        engine.camera.position.y += (targetCamY - engine.camera.position.y) * 0.12;
        engine.camera.position.z += (targetCamZ - engine.camera.position.z) * 0.15;
        engine.camera.lookAt(runnerP.x, runnerP.y + 1.2, runnerP.z - 6);
      } else {
        // High Isometric perspective
        const targetCamX = runnerP.x + 8;
        const targetCamY = runnerP.y + 12;
        const targetCamZ = runnerP.z + 14;

        engine.camera.position.x += (targetCamX - engine.camera.position.x) * 0.1;
        engine.camera.position.y += (targetCamY - engine.camera.position.y) * 0.1;
        engine.camera.position.z += (targetCamZ - engine.camera.position.z) * 0.1;
        engine.camera.lookAt(runnerP.x, runnerP.y + 1.0, runnerP.z - 4);
      }

      // 7. Check Victory condition (reached end of track)
      const lastSegment = segmentsRef.current[segmentsRef.current.length - 1];
      if (lastSegment && runnerP.z <= lastSegment.zEnd + 5 && !isGameWonRef.current) {
        isGameWonRef.current = true;
        setIsGameWon(true);
        runnerP.isPaused = true;
        soundFX.playVictory();
        if (particleSystemRef.current) {
          particleSystemRef.current.burst(new THREE.Vector3(runnerP.x, runnerP.y + 2, runnerP.z), 12);
        }
        setProfessorMessage("MAGNIFICENT RUN! You cleared all syllabus checkpoints with honors!");
      }
    });

    // 8. Event Listeners for Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.current.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.backward = true;

      // Jump / Double Jump
      if (e.code === 'Space') {
        const rp = runnerState.current;
        if (!rp.isPaused && rp.jumpCount < rp.maxJumps) {
          rp.vy = 12.5;
          rp.grounded = false;
          rp.jumpCount += 1;
          soundFX.playJump();
          if (particleSystemRef.current) {
            particleSystemRef.current.burst(new THREE.Vector3(rp.x, rp.y, rp.z), 3);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.current.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.current.backward = false;
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
  }, [questions, cameraMode]);

  // Handle Question Answer Submission at Gate
  const handleAnswerSubmit = (optionIndex: number) => {
    if (!activeQuestion || feedbackState !== 'none') return;
    setSelectedOption(optionIndex);

    const isCorrect = optionIndex === activeQuestion.correctAnswerIndex;

    if (isCorrect) {
      soundFX.playCorrect();
      setFeedbackState('correct');
      setExplanation(activeQuestion.explanation);
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 200 + newStreak * 50;
      setScore((prev) => prev + points);
      setProfessorMessage(getProfessorPanicComment('correct', newStreak > 1 ? `${newStreak}x streak!` : undefined));

      // Burst particles around gate
      if (particleSystemRef.current) {
        particleSystemRef.current.burst(
          new THREE.Vector3(runnerState.current.x, runnerState.current.y + 2, runnerState.current.z),
          8
        );
      }

      // Mark segment as completed
      const gateIdx = runnerState.current.currentGateIndex;
      const targetSeg = segmentsRef.current.find(
        (s) => s.type === 'gate' && s.gateQuestionIndex === gateIdx
      );
      if (targetSeg) {
        targetSeg.isCompleted = true;
        // Turn gate curtain transparent green
        targetSeg.mesh.traverse((c) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
            c.material.color.setHex(0x10b981);
            c.material.opacity = 0.08;
          }
        });
      }

      // Resume runner with speed boost after brief celebration delay
      setTimeout(() => {
        runnerState.current.isPaused = false;
        runnerState.current.speedBoostTimer = 2.5; // 2.5s speed boost through gate!
        setActiveQuestion(null);
        setFeedbackState('none');
        setSelectedOption(null);
      }, 1400);
    } else {
      soundFX.playWrong();
      setFeedbackState('wrong');
      setExplanation(activeQuestion.explanation);
      setStreak(0);
      setScore((prev) => Math.max(0, prev - 40));
      setProfessorMessage(getProfessorPanicComment('wrong'));

      // Troll Fall Penalty: Runner drops and respawns right before checkpoint
      setTimeout(() => {
        runnerState.current.trollFallTimer = 1.0;
        runnerState.current.isPaused = false;
        setActiveQuestion(null);
        setFeedbackState('none');
        setSelectedOption(null);
      }, 1600);
    }
  };

  const handleFinishConquest = () => {
    const finalScore = score + crystalsCollected * 50;
    onComplete(finalScore);
  };

  const handleJumpPress = () => {
    const rp = runnerState.current;
    if (!rp.isPaused && rp.jumpCount < rp.maxJumps) {
      rp.vy = 12.5;
      rp.grounded = false;
      rp.jumpCount += 1;
      soundFX.playJump();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#060814] select-none overflow-hidden flex flex-col font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Top HUD Overlay */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        {/* Course Info & Checkpoint Progress */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-2 shadow-lg">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              {courseCode || '3D RUNNER'}
            </span>
            <span className="text-xs font-bold text-slate-100 hidden sm:inline max-w-[180px] truncate">
              {courseTitle || gameConfig.topic}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-2 text-xs font-bold text-slate-200">
            <span className="text-purple-400">Gate:</span>
            <span className="font-mono text-cyan-300">
              {Math.min(currentCheckpointIndex + 1, totalCheckpoints)} / {totalCheckpoints}
            </span>
          </div>
        </div>

        {/* Score, Streak & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Crystals collected */}
          <div className="px-3 py-1.5 rounded-2xl bg-cyan-950/60 backdrop-blur-md border border-cyan-500/30 flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <span>💎</span>
            <span className="font-mono">{crystalsCollected}</span>
          </div>

          {/* Streak */}
          {streak > 1 && (
            <div className="px-3 py-1.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 flex items-center gap-1 text-xs font-bold text-amber-300 animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span className="font-mono">{streak}x Combo</span>
            </div>
          )}

          {/* Points */}
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-500/30 flex items-center gap-1.5 text-xs font-bold text-slate-100">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-amber-300">{score} pts</span>
          </div>

          {/* Camera View Mode Toggle */}
          <button
            type="button"
            onClick={() => setCameraMode((m) => (m === 'chase' ? 'iso' : 'chase'))}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-all"
            title="Toggle Camera View (Chase / Isometric)"
          >
            <Camera className="w-4 h-4 text-purple-400" />
          </button>

          {/* Sound Toggle */}
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

      {/* Professor Panic Companion Banner */}
      <div className="relative z-10 px-4 py-2 mx-4 mt-1 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-purple-500/20 flex items-center gap-3 text-xs text-slate-300 shadow-md pointer-events-none">
        <span className="text-xl">🧙‍♂️</span>
        <div className="flex-1">
          <span className="text-purple-400 font-bold mr-1.5">Prof. Panic:</span>
          <span>{professorMessage}</span>
        </div>
      </div>

      {/* Interactive 3D Knowledge Terminal Modal (Active at Gate) */}
      {activeQuestion && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-[#0e1227] border-2 border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 font-mono">
                  CHECKPOINT #{currentCheckpointIndex + 1}
                </span>
                <span className="text-xs text-slate-400 font-mono">Syllabus Knowledge Terminal</span>
              </div>

              {activeQuestion.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1 transition-all"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Use Hint'}</span>
                </button>
              )}
            </div>

            {/* Hint Box */}
            {showHint && activeQuestion.hint && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 animate-in fade-in">
                💡 <span className="font-semibold">Syllabus Clue:</span> {activeQuestion.hint}
              </div>
            )}

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-[#141936] border border-purple-500/20">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                {activeQuestion.question}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuestion.correctAnswerIndex;

                let btnStyle = 'bg-[#141936] hover:bg-[#1a2147] border-slate-700/60 text-slate-200';
                if (feedbackState !== 'none') {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={feedbackState !== 'none'}
                    onClick={() => handleAnswerSubmit(idx)}
                    className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 shadow-sm ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-600 flex items-center justify-center font-mono font-bold text-xs text-purple-300 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 mt-0.5 leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Explanation */}
            {feedbackState !== 'none' && (
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed animate-in fade-in flex items-start gap-2.5 ${
                  feedbackState === 'correct'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                }`}
              >
                {feedbackState === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block mb-0.5">
                    {feedbackState === 'correct'
                      ? '✓ ACCESS GRANTED — Speed Boost Engaged!'
                      : '✗ REVISE TOPIC — Troll Fall Triggered!'}
                  </span>
                  <span>{explanation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Victory Conquest Screen */}
      {isGameWon && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-[#0e1227] border-2 border-emerald-500/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-950/60 animate-bounce">
              🏆
            </div>

            <div>
              <h2 className="font-black text-2xl text-slate-100">RUN COMPLETED!</h2>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                All syllabus checkpoints cleared!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#080b18] border border-purple-500/20 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Score:</span>
                <span className="font-mono text-cyan-300 font-bold">{score} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Crystals Gathered:</span>
                <span className="font-mono text-amber-300 font-bold">{crystalsCollected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Best Combo:</span>
                <span className="font-mono text-purple-300 font-bold">{streak}x</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishConquest}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              Claim Victory & XP ✓
            </button>
          </div>
        </div>
      )}

      {/* Bottom Touch / Mobile Controls Bar */}
      <div className="relative z-10 mt-auto p-4 flex items-center justify-between gap-4 pointer-events-none">
        {/* Left/Right Directional buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onPointerDown={() => (keys.current.left = true)}
            onPointerUp={() => (keys.current.left = false)}
            onPointerLeave={() => (keys.current.left = false)}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 active:bg-purple-600/60 border border-slate-700/60 text-slate-200 font-mono font-bold text-lg flex items-center justify-center transition-all shadow-md"
            title="Steer Left (A / Left Arrow)"
          >
            ←
          </button>
          <button
            type="button"
            onPointerDown={() => (keys.current.right = true)}
            onPointerUp={() => (keys.current.right = false)}
            onPointerLeave={() => (keys.current.right = false)}
            className="w-12 h-12 rounded-2xl bg-slate-900/80 active:bg-purple-600/60 border border-slate-700/60 text-slate-200 font-mono font-bold text-lg flex items-center justify-center transition-all shadow-md"
            title="Steer Right (D / Right Arrow)"
          >
            →
          </button>
        </div>

        {/* Center Keyboard Guide on Desktop */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400">
          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">A / D</span> Steer
          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 ml-2">W / S</span> Speed
          <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 ml-2">Space</span> Jump (2x)
        </div>

        {/* Jump Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={handleJumpPress}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all"
            title="Jump / Double-Jump (Space)"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
