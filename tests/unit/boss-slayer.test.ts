import { describe, it, expect, beforeEach } from 'vitest';
import { generateBossSlayerConfig } from '../../src/lib/boss-generator';
import { storage } from '../../src/lib/storage';
import { Course, CourseUnit, Milestone } from '../../src/types';
import { getProfessorPanicComment } from '../../src/lib/professor-panic';

describe('Boss Slayer RPG Engine - Unit Tests', () => {
  const mockCourse: Course = {
    id: 'course-cs101',
    courseName: 'CS 3110: Data Structures and Functional Algorithms',
    courseCode: 'CS 3110',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockUnits: CourseUnit[] = [
    {
      id: 'unit-1',
      courseId: 'course-cs101',
      unitNumber: 1,
      title: 'Unit 1: Foundational Data Structures & Invariants',
      locationName: 'Forest of Linked Nodes',
      topics: [
        {
          id: 'topic-1',
          unitId: 'unit-1',
          courseId: 'course-cs101',
          title: 'Pointer Arithmetic & Memory Boundaries',
          questTitle: 'Taming the Pointer Boundary',
          xpReward: 50,
          status: 'pending',
          gameConfig: {
            topic: 'Pointer Arithmetic',
            gameMode: 'quiz-battle',
            difficulty: 'easy',
            questions: [
              {
                id: 'q-topic-1',
                question: 'What defines a memory safe pointer dereference in foundational data structures?',
                options: ['Checking non-null invariant', 'Arbitrary casting', 'Ignoring bounds', 'Blind dereferencing'],
                correctAnswerIndex: 0,
                explanation: 'Checking non-null ensures memory safety.',
                hint: 'Invariants prevent null dereferences.',
              },
            ],
          },
        },
      ],
    },
    {
      id: 'unit-2',
      courseId: 'course-cs101',
      unitNumber: 2,
      title: 'Unit 2: Applied Balanced Search Trees',
      locationName: 'Spire of Red-Black Trees',
      topics: [
        {
          id: 'topic-2',
          unitId: 'unit-2',
          courseId: 'course-cs101',
          title: 'Tree Rotations & Rebalancing',
          questTitle: 'Balancing the Binary Heights',
          xpReward: 50,
          status: 'pending',
          gameConfig: {
            topic: 'Tree Rotations',
            gameMode: 'puzzle-quest',
            difficulty: 'medium',
            questions: [
              {
                id: 'q-topic-2',
                question: 'When a left-heavy subtree violates balance invariants, which rotation restores O(log N)?',
                options: ['Right Rotation', 'No rotation', 'Delete all nodes', 'Double inversion'],
                correctAnswerIndex: 0,
                explanation: 'A right rotation restores balanced tree heights.',
                hint: 'Counteract left-heavy subtrees with rightward rotation.',
              },
            ],
          },
        },
      ],
    },
  ];

  const mockMilestone: Milestone = {
    id: 'midterm-boss-1',
    courseId: 'course-cs101',
    title: 'Comprehensive Midterm Examination',
    milestoneType: 'midterm',
    difficultyCategory: 'boss_fight',
    dueDate: '2026-11-15',
    dueTime: '14:00',
    weightPercent: 30,
    bossHp: 300,
    xpReward: 300,
    status: 'pending',
    sourceType: 'ai_extracted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

// Mock localStorage for test environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}

if (typeof window === 'undefined' || !window.localStorage) {
  (global as any).window = {
    localStorage: new LocalStorageMock(),
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
} else {
  Object.defineProperty(window, 'localStorage', {
    value: new LocalStorageMock(),
    writable: true,
  });
}

  beforeEach(() => {
    storage.reset();
  });

  it('generates a complete 3-phase syllabus-grounded boss encounter', () => {
    const config = generateBossSlayerConfig(mockMilestone, mockCourse, mockUnits);

    expect(config.bossId).toBe(mockMilestone.id);
    expect(config.bossTitle).toBe(mockMilestone.title);
    expect(config.courseCode).toBe('CS 3110');
    expect(config.maxHp).toBe(300);
    expect(config.weightPercent).toBe(30);

    // Boss identity & syllabus weakness
    expect(config.bossName).toContain('Arch-Lich of Algorithmic Complexity');
    expect(config.weakness).toContain('Asymptotic Bounds & Pointer Invariants');
    expect(config.weaknessMultiplier).toBe(1.5);
    expect(config.lore).toBeDefined();

    // Verify 3 distinct phases
    expect(config.phases).toHaveLength(3);
    const [p1, p2, p3] = config.phases;

    expect(p1.phaseNumber).toBe(1);
    expect(p1.name).toBe('Phase 1: Basic Concepts');
    expect(p1.hpThresholdPercent).toBe(66);
    expect(p1.attackCooldownMultiplier).toBe(1.0);
    expect(p1.questions.length).toBeGreaterThanOrEqual(3);

    expect(p2.phaseNumber).toBe(2);
    expect(p2.name).toBe('Phase 2: Application & Problem Solving');
    expect(p2.hpThresholdPercent).toBe(33);
    expect(p2.attackCooldownMultiplier).toBe(0.8);
    expect(p2.questions.length).toBeGreaterThanOrEqual(3);

    expect(p3.phaseNumber).toBe(3);
    expect(p3.name).toBe('Phase 3: Final Exam Comprehensive');
    expect(p3.hpThresholdPercent).toBe(0);
    expect(p3.attackCooldownMultiplier).toBe(0.65);
    expect(p3.questions.length).toBeGreaterThanOrEqual(3);
  });

  it('synthesizes questions across course units for Phase 3', () => {
    const config = generateBossSlayerConfig(mockMilestone, mockCourse, mockUnits);
    const phase3 = config.phases[2];

    expect(phase3.questions.length).toBeGreaterThanOrEqual(3);
    // All questions have valid options and bounded correct answers
    phase3.questions.forEach((q) => {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
      expect(q.explanation).toBeTruthy();
    });
  });

  it('generates telegraphed attacks with valid dodge windows and damage', () => {
    const config = generateBossSlayerConfig(mockMilestone, mockCourse, mockUnits);

    expect(config.attacks.length).toBeGreaterThanOrEqual(3);
    config.attacks.forEach((atk) => {
      expect(atk.id).toBeTruthy();
      expect(atk.name).toBeTruthy();
      expect(atk.damage).toBeGreaterThan(0);
      expect(atk.cooldownSeconds).toBeGreaterThan(0);
      expect(atk.dodgeWindowMs).toBeGreaterThanOrEqual(1200);
      expect(atk.telegraphText).toContain(config.bossName);
    });
  });

  it('awards XP and unlocks Boss Slayer achievement on victory, preventing duplicate XP on replay', () => {
    // Setup milestone in storage
    storage.saveCourse(mockCourse);
    storage.saveMilestone(mockMilestone);

    // Initial victory
    const res1 = storage.completeQuestWithGame(mockMilestone.id, 'milestone', {
      gameMode: 'boss-slayer',
      score: 1250,
    });

    expect(res1).not.toBeNull();
    expect(res1?.success).toBe(true);
    expect(res1?.alreadyCompleted).toBe(false);
    expect(res1?.xpAwarded).toBe(300);

    const dataAfterFirstWin = storage.load();
    const updatedMilestone = dataAfterFirstWin.milestones.find((m) => m.id === mockMilestone.id);
    expect(updatedMilestone?.status).toBe('completed');

    // Verify Boss Slayer achievement is unlocked
    const bossAchievement = dataAfterFirstWin.achievements.find((a) => a.id === 'first_boss');
    expect(bossAchievement?.unlockedAt).not.toBeNull();

    // Replay victory (practice mode)
    const res2 = storage.completeQuestWithGame(mockMilestone.id, 'milestone', {
      gameMode: 'boss-slayer',
      score: 1400,
    });

    expect(res2).not.toBeNull();
    expect(res2?.alreadyCompleted).toBe(true);
    expect(res2?.xpAwarded).toBe(0); // Zero duplicate XP
  });

  it('provides humorous and contextual Professor Panic dialogues for all boss moods', () => {
    const moods = [
      'boss_dodge_incoming',
      'boss_dodge_success',
      'boss_phase2',
      'boss_phase3',
      'boss_player_low_hp',
      'boss_potion_used',
      'boss_defeat',
      'boss_victory',
    ] as const;

    moods.forEach((mood) => {
      const dialogue = getProfessorPanicComment(mood);
      expect(dialogue).toBeTruthy();
      expect(typeof dialogue).toBe('string');
      expect(dialogue.length).toBeGreaterThan(10);
    });
  });
});
