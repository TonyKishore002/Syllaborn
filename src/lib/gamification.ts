import { DifficultyCategory, Milestone, MilestoneType } from '../types';

export const XP_REWARDS: Record<MilestoneType, number> = {
  assignment: 50,
  reading: 30,
  quiz: 100,
  lab: 120,
  project: 200,
  presentation: 150,
  midterm: 300,
  final_exam: 500,
  other: 50,
};

export const DIFFICULTY_LABELS: Record<DifficultyCategory, { label: string; badgeColor: string; description: string }> = {
  normal_quest: {
    label: 'Normal Quest',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Routine coursework and standard assignments',
  },
  elite_encounter: {
    label: 'Elite Encounter',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'High-focus quizzes, lab submissions, or projects',
  },
  boss_fight: {
    label: 'Boss Fight',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Major examinations (Midterms, Major Exams)',
  },
  final_raid: {
    label: 'Final Raid',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Culminating semester final examination or capstone',
  },
};

/**
 * Calculates Boss HP based on syllabus assessment weight.
 * Formula: Boss HP = assessment weight percentage × 10
 */
export function calculateBossHp(weightPercent: number | null | undefined): number | null {
  if (weightPercent === null || weightPercent === undefined || isNaN(weightPercent)) {
    return null;
  }
  return Math.round(weightPercent * 10);
}

/**
 * Deterministically determines difficulty category from type and weight.
 */
export function determineDifficultyCategory(
  type: MilestoneType,
  weightPercent?: number | null
): DifficultyCategory {
  if (type === 'final_exam') {
    return 'final_raid';
  }
  if (type === 'midterm') {
    return 'boss_fight';
  }
  if (weightPercent && weightPercent >= 20) {
    return 'boss_fight';
  }
  if (type === 'project' || type === 'presentation' || type === 'lab' || (weightPercent && weightPercent >= 10)) {
    return 'elite_encounter';
  }
  return 'normal_quest';
}

/**
 * Returns the base XP reward for a milestone type.
 */
export function calculateXpReward(type: MilestoneType, weightPercent?: number | null): number {
  const baseReward = XP_REWARDS[type] ?? 50;
  // If weight is high, add bonus XP proportionally
  if (weightPercent && weightPercent > 20) {
    return baseReward + Math.round((weightPercent - 20) * 5);
  }
  return baseReward;
}

/**
 * Deterministic level progression system.
 * Level 1 starts at 0 XP.
 * XP required to reach Level L: 100 * (L - 1) * L
 * Level 1: 0 XP
 * Level 2: 200 XP
 * Level 3: 600 XP
 * Level 4: 1200 XP
 * Level 5: 2000 XP
 * Level 6: 3000 XP
 */
export interface PlayerLevelInfo {
  level: number;
  levelTitle: string;
  totalXp: number;
  currentLevelBaseXp: number;
  nextLevelThreshold: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercent: number;
}

const LEVEL_TITLES = [
  'Syllabus Novice',
  'Scroll Apprentice',
  'Deadline Scout',
  'Assessment Slayer',
  'Arcane Scholar',
  'Midterm Vanquisher',
  'Grand Academic Magus',
  'Semester Sovereign',
  'Syllaborn Paragon',
];

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 100 * (level - 1) * level;
}

export function calculatePlayerLevel(totalXp: number): PlayerLevelInfo {
  const clampedXp = Math.max(0, totalXp);
  let level = 1;

  while (clampedXp >= xpForLevel(level + 1)) {
    level++;
  }

  const currentLevelBaseXp = xpForLevel(level);
  const nextLevelThreshold = xpForLevel(level + 1);
  const xpInCurrentLevel = clampedXp - currentLevelBaseXp;
  const xpRequiredForNextLevel = nextLevelThreshold - currentLevelBaseXp;
  const progressPercent =
    xpRequiredForNextLevel > 0
      ? Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100))
      : 100;

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const levelTitle = LEVEL_TITLES[titleIndex];

  return {
    level,
    levelTitle,
    totalXp: clampedXp,
    currentLevelBaseXp,
    nextLevelThreshold,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progressPercent,
  };
}

/**
 * Generates an idempotent transaction key for XP rewards to prevent duplicate rewards.
 */
export function generateXpIdempotencyKey(
  milestoneId: string,
  transactionType: 'milestone_completed' | 'milestone_reopened' | 'bonus'
): string {
  return `${milestoneId}:${transactionType}`;
}

/**
 * Pre-defined game achievements
 */
export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_quest',
    title: 'First Blood on the Scroll',
    description: 'Complete your first syllabus quest',
    icon: '⚔️',
    conditionType: 'total_milestones' as const,
    targetValue: 1,
    unlockedAt: null,
  },
  {
    id: 'five_quests',
    title: 'Academic Adventurer',
    description: 'Complete 5 syllabus quests',
    icon: '🛡️',
    conditionType: 'total_milestones' as const,
    targetValue: 5,
    unlockedAt: null,
  },
  {
    id: 'first_boss',
    title: 'Boss Slayer',
    description: 'Vanquish your first Midterm or Final Exam boss',
    icon: '👑',
    conditionType: 'bosses_defeated' as const,
    targetValue: 1,
    unlockedAt: null,
  },
  {
    id: 'level_five',
    title: 'Arcane Scholar',
    description: 'Attain Level 5 in the Semesterverse',
    icon: '✨',
    conditionType: 'level_reached' as const,
    targetValue: 5,
    unlockedAt: null,
  },
  {
    id: 'course_master',
    title: 'Course Cartographer',
    description: 'Add 3 or more courses to your quest book',
    icon: '🗺️',
    conditionType: 'courses_added' as const,
    targetValue: 3,
    unlockedAt: null,
  },
];
