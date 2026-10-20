import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../src/lib/storage';
import { Milestone, CourseUnit, CourseTopic, Course } from '../../src/types';

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

describe('Storage Service: completeQuestWithGame and Idempotency', () => {
  beforeEach(() => {
    storage.reset();
  });

  it('completes a pending milestone through mini-game and awards XP', () => {
    const course: Course = {
      id: 'course-1',
      courseName: 'Data Structures',
      courseCode: 'CS-200',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveCourse(course);

    const milestone: Milestone = {
      id: 'm-quest-1',
      courseId: 'course-1',
      title: 'Trees & Heaps Midterm',
      milestoneType: 'midterm',
      dueDate: '2026-11-15',
      dueTime: null,
      weightPercent: 20,
      difficultyCategory: 'boss_fight',
      bossHp: 200,
      xpReward: 200,
      status: 'pending',
      sourceType: 'syllabus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveMilestone(milestone);

    // Initial state: 0 XP
    expect(storage.getProfile().totalXp).toBe(0);

    // Complete via mini-game
    const result = storage.completeQuestWithGame('m-quest-1', 'milestone', {
      gameMode: 'quiz-battle',
      score: 180,
    });

    expect(result).not.toBeNull();
    expect(result?.alreadyCompleted).toBe(false);
    expect(result?.xpAwarded).toBe(200);

    // Verify milestone status is completed
    const updatedMilestone = storage.load().milestones.find((m) => m.id === 'm-quest-1');
    expect(updatedMilestone?.status).toBe('completed');

    // Verify profile XP increased
    expect(storage.getProfile().totalXp).toBe(200);

    // Verify XP transaction recorded with proper idempotency key
    const transactions = storage.load().xpTransactions;
    expect(transactions.length).toBe(1);
    expect(transactions[0].idempotencyKey).toBe('m-quest-1:milestone_completed');
    expect(transactions[0].amount).toBe(200);
  });

  it('awards 0 XP on replay of already completed milestone (practice mode)', () => {
    const course: Course = {
      id: 'course-1',
      courseName: 'Data Structures',
      courseCode: 'CS-200',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveCourse(course);

    const milestone: Milestone = {
      id: 'm-quest-replay',
      courseId: 'course-1',
      title: 'Recursion Quiz',
      milestoneType: 'quiz',
      dueDate: '2026-10-30',
      dueTime: null,
      weightPercent: 5,
      difficultyCategory: 'normal_quest',
      bossHp: null,
      xpReward: 50,
      status: 'pending',
      sourceType: 'syllabus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveMilestone(milestone);

    // First completion
    const firstResult = storage.completeQuestWithGame('m-quest-replay', 'milestone', {
      gameMode: 'do-or-die',
      score: 100,
    });
    expect(firstResult?.alreadyCompleted).toBe(false);
    expect(firstResult?.xpAwarded).toBe(50);
    expect(storage.getProfile().totalXp).toBe(50);

    // Second completion (replay / practice mode)
    const replayResult = storage.completeQuestWithGame('m-quest-replay', 'milestone', {
      gameMode: 'do-or-die',
      score: 100,
    });
    expect(replayResult?.alreadyCompleted).toBe(true);
    expect(replayResult?.xpAwarded).toBe(0);

    // Total XP remains 50 (NO duplicate XP awarded)
    expect(storage.getProfile().totalXp).toBe(50);
    expect(storage.load().xpTransactions.length).toBe(1);
  });

  it('completes a curriculum unit topic through mini-game and awards XP', () => {
    const topic: CourseTopic = {
      id: 'topic-dijkstra',
      unitId: 'unit-1',
      title: "Dijkstra's Shortest Path Algorithm",
      questTitle: 'Path of the Shortest Route',
      description: 'Master Dijkstra priority queue implementation',
      xpReward: 35,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const unit: CourseUnit = {
      id: 'unit-1',
      courseId: 'course-1',
      unitNumber: 3,
      title: 'Graph Algorithms',
      locationName: 'Spire of Directed Edges',
      topics: [topic],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveUnits([unit]);

    const result = storage.completeQuestWithGame('topic-dijkstra', 'topic', {
      gameMode: 'puzzle-quest',
      score: 150,
    });

    expect(result).not.toBeNull();
    expect(result?.alreadyCompleted).toBe(false);
    expect(result?.xpAwarded).toBe(35);

    // Check status in storage
    const loadedUnit = storage.load().units.find((u) => u.id === 'unit-1');
    const loadedTopic = loadedUnit?.topics.find((t) => t.id === 'topic-dijkstra');
    expect(loadedTopic?.status).toBe('completed');
    expect(storage.getProfile().totalXp).toBe(35);

    // Replay topic
    const replayResult = storage.completeQuestWithGame('topic-dijkstra', 'topic', {
      gameMode: 'puzzle-quest',
      score: 150,
    });
    expect(replayResult?.alreadyCompleted).toBe(true);
    expect(replayResult?.xpAwarded).toBe(0);
    expect(storage.getProfile().totalXp).toBe(35);
  });
});
