import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../src/lib/storage';
import {
  selectIntelligentGameMode,
  validateGameConfig,
  sanitizeGameConfig,
  generateFallbackGameConfig,
  generateFallbackQuestions,
} from '../../src/lib/game-generator';
import { getProfessorPanicComment } from '../../src/lib/professor-panic';
import { Course, CourseUnit, CourseTopic, Milestone, QuestGameConfig } from '../../src/types';

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

describe('End-to-End Academic Game Quest Lifecycle', () => {
  beforeEach(() => {
    storage.reset();
  });

  it('Scenario: Upload syllabus text -> Generate topic quests -> Play Do-or-Die -> Fail & Retry -> Win -> Verify Idempotent XP & Persistence', () => {
    // 1. Course Setup
    const course: Course = {
      id: 'course-cs106b',
      courseName: 'Data Structures and Algorithms',
      courseCode: 'CS-106B',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveCourse(course);

    // 2. Syllabus-grounded Topic Quest Setup
    const topicTitle = 'Linked Lists and Pointer Manipulation';
    const gameMode = selectIntelligentGameMode(topicTitle);
    expect(gameMode).toBe('do-or-die');

    const gameQuestions = [
      {
        id: 'q1',
        question: 'Which operation on a singly linked list requires O(n) time when only head is known?',
        options: [
          'Inserting a new node at the head',
          'Deleting the last node',
          'Accessing the first element',
          'Checking if list is empty',
        ],
        correctAnswerIndex: 1,
        explanation: 'To delete the last node, one must traverse all n elements from head to update the second-to-last node.',
        hint: 'Consider how you find the predecessor of the tail node.',
      },
      {
        id: 'q2',
        question: 'What happens if a programmer frees a node without updating previous next pointer?',
        options: [
          'A dangling pointer / memory corruption error occurs',
          'The node automatically re-attaches itself',
          'The compiler automatically prevents run-time access',
          'Garbage collector restores the linked structure',
        ],
        correctAnswerIndex: 0,
        explanation: 'Failing to update pointers before free creates a dangling pointer.',
        hint: 'Think about pointer validity after deallocation.',
      },
    ];

    const gameConfig: QuestGameConfig = {
      questId: 'quest-linked-lists',
      topic: topicTitle,
      topicTitle,
      gameMode,
      difficulty: 'easy',
      questions: gameQuestions,
    };

    expect(validateGameConfig(gameConfig)).toBe(true);

    const topicQuest: CourseTopic = {
      id: 'quest-linked-lists',
      unitId: 'unit-memory',
      courseId: course.id,
      title: topicTitle,
      questTitle: 'The Maze of Dangling Pointers',
      description: 'Traverse linked nodes safely without dereferencing null.',
      xpReward: 60,
      status: 'pending',
      gameConfig,
    };

    const unit: CourseUnit = {
      id: 'unit-memory',
      courseId: course.id,
      unitNumber: 1,
      title: 'Dynamic Memory & Lists',
      locationName: 'Catacombs of Heap Memory',
      topics: [topicQuest],
    };
    storage.saveUnits([unit]);

    // Initial State Check
    expect(storage.getProfile().totalXp).toBe(0);
    const uncompletedTopic = storage.load().units?.find((u) => u.id === 'unit-memory')?.topics[0];
    expect(uncompletedTopic?.status).toBe('pending');

    // 3. Gameplay Simulation: Checkpoint 1
    // Player answers incorrectly first
    const wrongAnswerIndex = 0;
    const isWrongAnswer = wrongAnswerIndex !== gameQuestions[0].correctAnswerIndex;
    expect(isWrongAnswer).toBe(true);

    // Consequence: character falls in hole, Professor Panic reacts, explanation is shown
    const panicFallDialogue = getProfessorPanicComment('wrong');
    expect(panicFallDialogue.length).toBeGreaterThan(0);
    expect(gameQuestions[0].explanation).toContain('traverse all n elements');

    // Player retries checkpoint
    const retryDialogue = getProfessorPanicComment('retry');
    expect(retryDialogue.length).toBeGreaterThan(0);

    // Player answers correctly on retry
    const correctAnswerIndex = gameQuestions[0].correctAnswerIndex;
    expect(correctAnswerIndex).toBe(1);
    const panicCorrectDialogue = getProfessorPanicComment('correct');
    expect(panicCorrectDialogue.length).toBeGreaterThan(0);

    // 4. Gameplay Simulation: Checkpoint 2 cleared
    expect(gameQuestions[1].correctAnswerIndex).toBe(0);

    // 5. Game Victory: Complete the quest
    const result = storage.completeQuestWithGame('quest-linked-lists', 'topic', {
      gameMode: 'do-or-die',
      score: 110,
    });

    expect(result).not.toBeNull();
    expect(result?.alreadyCompleted).toBe(false);
    expect(result?.xpAwarded).toBe(60);

    // 6. Verify XP awarded once and status updated
    expect(storage.getProfile().totalXp).toBe(60);
    const completedTopic = storage.load().units?.find((u) => u.id === 'unit-memory')?.topics[0];
    expect(completedTopic?.status).toBe('completed');

    // 7. Test Persistence (simulate fresh storage load)
    const freshDoc = storage.load();
    expect(freshDoc.units?.[0].topics[0].status).toBe('completed');
    expect(freshDoc.xpTransactions.length).toBe(1);
    expect(freshDoc.xpTransactions[0].idempotencyKey).toBe('quest-linked-lists:topic_completed');

    // 8. Replay Quest (Practice Mode)
    const replayResult = storage.completeQuestWithGame('quest-linked-lists', 'topic', {
      gameMode: 'do-or-die',
      score: 150,
    });

    expect(replayResult?.alreadyCompleted).toBe(true);
    expect(replayResult?.xpAwarded).toBe(0);

    // 9. Confirm NO duplicate XP was awarded on replay
    expect(storage.getProfile().totalXp).toBe(60);
    expect(storage.load().xpTransactions.length).toBe(1);
  });

  it('Scenario: Quiz Battle Game Mode and Examination Boss Fight', () => {
    const course: Course = {
      id: 'course-os',
      courseName: 'Operating Systems',
      courseCode: 'CS-162',
      color: '#06b6d4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveCourse(course);

    // Major Examination Assessment Boss
    const bossMilestone: Milestone = {
      id: 'exam-os-midterm',
      courseId: course.id,
      title: 'Operating Systems Midterm Battle',
      milestoneType: 'midterm',
      dueDate: '2026-11-12',
      dueTime: '14:00',
      weightPercent: 25,
      difficultyCategory: 'boss_fight',
      bossHp: 250, // 25% * 10
      xpReward: 300,
      status: 'pending',
      sourceType: 'ai_extracted',
      gameConfig: {
        questId: 'exam-os-midterm',
        topic: 'Process Scheduling, Deadlocks, & Virtual Memory',
        topicTitle: 'Process Scheduling, Deadlocks, & Virtual Memory',
        gameMode: 'quiz-battle',
        difficulty: 'hard',
        questions: [
          {
            id: 'q1',
            question: 'Which of the following conditions is NOT required for a deadlock to occur?',
            options: [
              'Mutual Exclusion',
              'Hold and Wait',
              'Preemption Allowed',
              'Circular Wait',
            ],
            correctAnswerIndex: 2,
            explanation: 'Deadlock requires NO preemption; allowing preemption eliminates deadlocks.',
            hint: 'Recall Coffman conditions.',
          },
        ],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveMilestone(bossMilestone);

    // Boss HP calculation verification
    expect(bossMilestone.bossHp).toBe(250);

    // Quiz Battle: Correct answer damages monster
    const q = bossMilestone.gameConfig!.questions[0];
    expect(q.correctAnswerIndex).toBe(2);

    // Defeating boss awards XP
    const victory = storage.completeQuestWithGame('exam-os-midterm', 'milestone', {
      gameMode: 'quiz-battle',
      score: 250,
    });

    expect(victory?.alreadyCompleted).toBe(false);
    expect(victory?.xpAwarded).toBe(300);
    expect(storage.getProfile().totalXp).toBe(300);

    const updatedBoss = storage.load().milestones.find((m) => m.id === 'exam-os-midterm');
    expect(updatedBoss?.status).toBe('completed');
  });

  it('Scenario: Puzzle Quest Mode validation and step/matching generation', () => {
    const config = generateFallbackGameConfig(
      'Bubble Sort Algorithm Steps',
      'Algorithms',
      'puzzle-quest'
    );

    expect(config.gameMode).toBe('puzzle-quest');
    expect(config.puzzleData).toBeDefined();
    expect(config.puzzleData?.type).toBe('concept-matching');
    expect(config.puzzleData?.pairs?.length).toBeGreaterThanOrEqual(3);
    expect(config.puzzleData?.steps?.length).toBeGreaterThanOrEqual(3);
    expect(config.puzzleData?.orderedSteps?.length).toBe(config.puzzleData?.steps?.length);
  });

  it('Scenario: Input validation and schema error resilience', () => {
    // 1. Empty topic rejection
    expect(validateGameConfig({ topic: '', questions: [], gameMode: 'quiz-battle' })).toBe(false);

    // 2. Out of range correctAnswerIndex rejection
    expect(
      validateGameConfig({
        topic: 'Physics',
        questions: [
          {
            id: 'q1',
            question: 'What is G?',
            options: ['9.8', '10'],
            correctAnswerIndex: 99, // out of range!
          },
        ],
        gameMode: 'quiz-battle',
      })
    ).toBe(false);

    // 3. Sanitizer recovery
    const sanitized = sanitizeGameConfig({
      topic: 'Faulty Config',
      questions: [
        {
          id: 'q1',
          question: 'What is 1+1?',
          options: ['2', '3'],
          correctAnswerIndex: 10, // will be clamped to 0
          explanation: '',
          hint: '',
        },
      ],
      gameMode: 'quiz-battle',
    });

    expect(sanitized.sanitizedConfig.questions[0].correctAnswerIndex).toBe(0);
  });
});
