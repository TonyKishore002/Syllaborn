import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../src/lib/storage';
import { Course, Milestone } from '../../src/types';

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

describe('Storage Service Integration: Cascading Deletions and Idempotent XP', () => {
  beforeEach(() => {
    storage.reset();
  });

  it('persists a course and retrieves it by ID', () => {
    const course: Course = {
      id: 'c-algo-1',
      courseName: 'Algorithms',
      courseCode: 'CS-301',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveCourse(course);
    const retrieved = storage.getCourseById('c-algo-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.courseCode).toBe('CS-301');
  });

  it('cascades course deletion to its milestones and categories', () => {
    const courseId = 'course-to-delete';
    storage.saveCourse({
      id: courseId,
      courseName: 'Physics',
      courseCode: 'PHYS-101',
      color: '#06b6d4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const milestone: Milestone = {
      id: 'm-physics-1',
      courseId,
      title: 'Lab 1',
      milestoneType: 'lab',
      dueDate: '2026-11-01',
      dueTime: null,
      weightPercent: 10,
      difficultyCategory: 'elite_encounter',
      bossHp: null,
      xpReward: 120,
      status: 'pending',
      sourceType: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveMilestone(milestone);

    // Verify milestone exists
    expect(storage.getMilestones(courseId).length).toBe(1);

    // Delete course
    storage.deleteCourse(courseId);

    // Verify course and milestone are both removed
    expect(storage.getCourseById(courseId)).toBeUndefined();
    expect(storage.getMilestones(courseId).length).toBe(0);
  });

  it('awards XP idempotently when milestone status is toggled', () => {
    const milestone: Milestone = {
      id: 'quest-xp-test',
      courseId: 'c-test',
      title: 'Quiz 1',
      milestoneType: 'quiz',
      dueDate: '2026-10-30',
      dueTime: null,
      weightPercent: 5,
      difficultyCategory: 'elite_encounter',
      bossHp: 50,
      xpReward: 100,
      status: 'pending',
      sourceType: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveMilestone(milestone);

    // Initial state: 0 XP transactions
    expect(storage.load().xpTransactions.length).toBe(0);

    // Complete milestone
    const result1 = storage.toggleMilestoneStatus('quest-xp-test');
    expect(result1?.milestone.status).toBe('completed');
    expect(result1?.xpAwarded).toBe(100);

    const docAfter1 = storage.load();
    const totalXp1 = docAfter1.xpTransactions.reduce((acc, t) => acc + t.amount, 0);
    expect(totalXp1).toBe(100);

    // Toggle again (reopen quest)
    const result2 = storage.toggleMilestoneStatus('quest-xp-test');
    expect(result2?.milestone.status).toBe('pending');
    expect(result2?.xpAwarded).toBe(-100);

    const docAfter2 = storage.load();
    const totalXp2 = docAfter2.xpTransactions.reduce((acc, t) => acc + t.amount, 0);
    expect(totalXp2).toBe(0);
  });

  it('unlocks achievements on topic quest completion and when 3 courses are added', () => {
    // 1. Topic quest completion unlocks first_quest achievement
    const courseId = 'c-topic-test';
    storage.saveCourse({
      id: courseId,
      courseName: 'Chemistry',
      courseCode: 'CHEM-101',
      color: '#10b981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    storage.saveUnits([
      {
        id: 'u-1',
        courseId,
        unitNumber: 1,
        title: 'Stoichiometry',
        topics: [
          {
            id: 't-1',
            unitId: 'u-1',
            courseId,
            title: 'Molar Mass Calculation',
            xpReward: 50,
            status: 'pending',
          },
        ],
      },
    ]);

    // Initial state: first_quest is locked
    const initData = storage.load();
    const firstQuestAch = initData.achievements.find((a) => a.id === 'first_quest');
    expect(firstQuestAch?.unlockedAt).toBeNull();

    // Complete topic quest
    storage.completeQuestWithGame('t-1', 'topic', { gameMode: 'quiz-battle', score: 100 });

    const afterTopicData = storage.load();
    const unlockedFirstQuest = afterTopicData.achievements.find((a) => a.id === 'first_quest');
    expect(unlockedFirstQuest?.unlockedAt).not.toBeNull();

    // 2. Adding 3 courses unlocks course_master achievement
    storage.saveCourse({
      id: 'c-2',
      courseName: 'Biology',
      courseCode: 'BIO-101',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    storage.saveCourse({
      id: 'c-3',
      courseName: 'Mathematics',
      courseCode: 'MATH-101',
      color: '#f59e0b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const after3Courses = storage.load();
    const courseMasterAch = after3Courses.achievements.find((a) => a.id === 'course_master');
    expect(courseMasterAch?.unlockedAt).not.toBeNull();
  });
});
