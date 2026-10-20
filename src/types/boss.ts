import { GameQuestion } from './index';

export type BossPhaseId = 1 | 2 | 3;

export interface BossAttack {
  id: string;
  name: string;
  damage: number;
  cooldownSeconds: number;
  dodgeWindowMs: number;
  telegraphText: string;
  animation?: 'slash' | 'crush' | 'shockwave' | 'fire' | 'spell';
}

export interface BossPhase {
  phaseNumber: BossPhaseId;
  name: string; // e.g. "Phase 1: Basic Concepts", "Phase 2: Application & Problem Solving", "Phase 3: Final Exam"
  subtitle: string;
  description: string;
  bossStance: string;
  hpThresholdPercent: number; // e.g. 66 for phase 1, 33 for phase 2, 0 for phase 3
  attackCooldownMultiplier: number; // e.g. 1.0, 0.8, 0.65
  questions: GameQuestion[];
  phaseTransitionAttack?: BossAttack;
}

export interface BossSlayerConfig {
  bossId: string;
  bossName: string; // e.g. "The Algorithmic Colossus"
  bossTitle: string; // e.g. "Midterm Exam 1"
  avatar: string; // e.g. "🐉", "👑", "🧙‍♂️", "👹"
  maxHp: number;
  weightPercent?: number | null;
  weakness: string; // e.g. "Pointer Invariants & Base Cases"
  weaknessMultiplier: number; // e.g. 1.5
  lore: string;
  courseCode?: string;
  courseName?: string;
  phases: [BossPhase, BossPhase, BossPhase];
  attacks: BossAttack[];
}

export interface BossCombatStats {
  damageDealt: number;
  damageTaken: number;
  attacksDodged: number;
  attacksFailed: number;
  potionsUsed: number;
  questionsAnswered: number;
  correctAnswers: number;
  maxStreak: number;
  phaseReached: BossPhaseId;
  durationSeconds: number;
}
