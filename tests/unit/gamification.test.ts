import { describe, it, expect } from 'vitest';
import {
  calculateBossHp,
  calculateXpReward,
  determineDifficultyCategory,
  calculatePlayerLevel,
  xpForLevel,
  generateXpIdempotencyKey,
  XP_REWARDS,
} from '../../src/lib/gamification';

describe('Gamification Engine: Boss HP Calculation', () => {
  it('calculates boss HP as assessment weight percentage × 10', () => {
    expect(calculateBossHp(30)).toBe(300);
    expect(calculateBossHp(5)).toBe(50);
    expect(calculateBossHp(12.5)).toBe(125);
    expect(calculateBossHp(100)).toBe(1000);
  });

  it('returns null when weight percentage is missing or null', () => {
    expect(calculateBossHp(null)).toBeNull();
    expect(calculateBossHp(undefined)).toBeNull();
    expect(calculateBossHp(NaN)).toBeNull();
  });
});

describe('Gamification Engine: Difficulty Classification', () => {
  it('categorizes final exams as final_raid', () => {
    expect(determineDifficultyCategory('final_exam', 40)).toBe('final_raid');
    expect(determineDifficultyCategory('final_exam', null)).toBe('final_raid');
  });

  it('categorizes midterms as boss_fight', () => {
    expect(determineDifficultyCategory('midterm', 25)).toBe('boss_fight');
    expect(determineDifficultyCategory('midterm', null)).toBe('boss_fight');
  });

  it('categorizes assessments with weight >= 20% as boss_fight', () => {
    expect(determineDifficultyCategory('project', 25)).toBe('boss_fight');
  });

  it('categorizes projects, labs, presentations, and weights >= 10% as elite_encounter', () => {
    expect(determineDifficultyCategory('project', 15)).toBe('elite_encounter');
    expect(determineDifficultyCategory('lab', 5)).toBe('elite_encounter');
    expect(determineDifficultyCategory('presentation', 5)).toBe('elite_encounter');
    expect(determineDifficultyCategory('quiz', 15)).toBe('elite_encounter');
  });

  it('categorizes standard assignments as normal_quest', () => {
    expect(determineDifficultyCategory('assignment', 5)).toBe('normal_quest');
    expect(determineDifficultyCategory('reading', null)).toBe('normal_quest');
  });
});

describe('Gamification Engine: XP Rewards & Level Progression', () => {
  it('awards base XP according to milestone types', () => {
    expect(calculateXpReward('assignment')).toBe(XP_REWARDS.assignment);
    expect(calculateXpReward('quiz')).toBe(XP_REWARDS.quiz);
    expect(calculateXpReward('midterm')).toBe(XP_REWARDS.midterm);
    expect(calculateXpReward('final_exam')).toBe(XP_REWARDS.final_exam);
  });

  it('calculates deterministic level progression thresholds', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(200);
    expect(xpForLevel(3)).toBe(600);
    expect(xpForLevel(4)).toBe(1200);
    expect(xpForLevel(5)).toBe(2000);
  });

  it('determines current level and progress from total XP', () => {
    // 0 XP = Level 1
    const lvl1 = calculatePlayerLevel(0);
    expect(lvl1.level).toBe(1);
    expect(lvl1.progressPercent).toBe(0);

    // 100 XP = Level 1 with 50% progress toward Level 2 (which needs 200)
    const lvl1Half = calculatePlayerLevel(100);
    expect(lvl1Half.level).toBe(1);
    expect(lvl1Half.progressPercent).toBe(50);

    // 250 XP = Level 2 (200 base XP, next is 600)
    const lvl2 = calculatePlayerLevel(250);
    expect(lvl2.level).toBe(2);
    expect(lvl2.currentLevelBaseXp).toBe(200);
    expect(lvl2.nextLevelThreshold).toBe(600);
  });

  it('generates consistent idempotency keys for reward transactions', () => {
    const key1 = generateXpIdempotencyKey('milestone-123', 'milestone_completed');
    const key2 = generateXpIdempotencyKey('milestone-123', 'milestone_completed');
    expect(key1).toBe('milestone-123:milestone_completed');
    expect(key1).toBe(key2);
  });
});
