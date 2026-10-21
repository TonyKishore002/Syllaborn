import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTopicGroundedPuzzle,
  generateFallbackGameConfig,
  selectIntelligentGameMode,
} from '../../src/lib/game-generator';
import { storage } from '../../src/lib/storage';

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
  (global as any).localStorage = (global as any).window.localStorage;
} else {
  Object.defineProperty(window, 'localStorage', {
    value: new LocalStorageMock(),
    writable: true,
  });
  (global as any).localStorage = window.localStorage;
}

describe('Puzzle Quest - Gameplay, Generation, and Mechanics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Syllabus-Grounded Puzzle Generation', () => {
    it('generates domain-specific sorting algorithm puzzle with pairs and sequential steps', () => {
      const puzzle = generateTopicGroundedPuzzle('QuickSort and MergeSort Algorithms');
      expect(puzzle).toBeDefined();
      expect(puzzle.pairs).toBeDefined();
      expect(puzzle.pairs!.length).toBeGreaterThanOrEqual(4);

      // Verify matching pairs have definitions and explanations
      puzzle.pairs!.forEach((pair) => {
        expect(pair.id).toBeDefined();
        expect(pair.left.length).toBeGreaterThan(0);
        expect(pair.right.length).toBeGreaterThan(0);
        expect(pair.explanation).toBeDefined();
        expect(pair.explanation!.length).toBeGreaterThan(0);
      });

      // Verify step ordering has 1-based sequential steps
      expect(puzzle.steps).toBeDefined();
      expect(puzzle.steps!.length).toBeGreaterThanOrEqual(4);
      puzzle.steps!.forEach((step, idx) => {
        expect(step.order).toBe(idx + 1);
        expect(step.text.length).toBeGreaterThan(0);
        expect(step.explanation).toBeDefined();
      });

      // Verify scrambled steps contains the exact set of steps
      expect(puzzle.scrambledSteps).toBeDefined();
      expect(puzzle.scrambledSteps!.length).toBe(puzzle.steps!.length);
    });

    it('generates hierarchical tree traversal puzzle for BST topics', () => {
      const puzzle = generateTopicGroundedPuzzle('Binary Search Tree In-Order Traversal');
      expect(puzzle.prompt).toContain('Binary Search Tree');
      expect(puzzle.pairs!.some((p) => p.left.includes('In-Order Traversal'))).toBe(true);
      expect(puzzle.steps!.some((s) => s.text.includes('root'))).toBe(true);
    });

    it('generates operating system lifecycle puzzle for process and scheduling topics', () => {
      const puzzle = generateTopicGroundedPuzzle('Process Scheduling and Deadlocks');
      expect(puzzle.pairs!.some((p) => p.left.includes('Process Control Block'))).toBe(true);
      expect(puzzle.pairs!.some((p) => p.left.includes('Deadlock'))).toBe(true);
      expect(puzzle.steps!.some((s) => s.text.includes('Ready Queue'))).toBe(true);
    });

    it('generates curriculum-tailored pairs and steps for general syllabus topics', () => {
      const puzzle = generateTopicGroundedPuzzle('Microeconomic Supply and Demand Curves');
      expect(puzzle.pairs!.length).toBe(4);
      expect(puzzle.pairs![0].left).toContain('Microeconomic Supply and Demand Curves');
      expect(puzzle.steps!.length).toBe(4);
      expect(puzzle.hint).toBeDefined();
      expect(puzzle.explanation).toBeDefined();
    });
  });

  describe('Intelligent Game Mode Selection for Puzzles', () => {
    it('selects puzzle-quest for procedural, algorithmic, or step-based syllabus topics', () => {
      expect(selectIntelligentGameMode('Bubble Sort Algorithm Steps')).toBe('puzzle-quest');
      expect(selectIntelligentGameMode('Software Testing Lifecycle and CI/CD Pipeline')).toBe('puzzle-quest');
      expect(selectIntelligentGameMode('Mitosis Cell Division Phases')).toBe('puzzle-quest');
      expect(selectIntelligentGameMode('Database Normalization Process')).toBe('puzzle-quest');
    });

    it('creates a complete playable puzzle configuration with questions and puzzleData', () => {
      const config = generateFallbackGameConfig('Algorithm Design & Analysis', 'CS-301', 'puzzle-quest');
      expect(config.gameMode).toBe('puzzle-quest');
      expect(config.puzzleData).toBeDefined();
      expect(config.puzzleData!.pairs!.length).toBeGreaterThanOrEqual(4);
      expect(config.puzzleData!.steps!.length).toBeGreaterThanOrEqual(4);
      expect(config.questions.length).toBeGreaterThanOrEqual(3);
    });

    it('sanitizeGameConfig automatically generates puzzleData when gameMode is puzzle-quest and puzzleData is missing', async () => {
      const { sanitizeGameConfig } = await import('../../src/lib/game-generator');
      const incompleteConfig = {
        questId: 'test-puzzle-quest',
        topic: 'Graph Theory & Dijkstra',
        gameMode: 'puzzle-quest' as const,
        difficulty: 'easy' as const,
        questions: [
          {
            id: 'q1',
            question: 'What is Dijkstra algorithm?',
            options: ['Shortest path algorithm', 'Sorting algorithm'],
            correctAnswerIndex: 0,
            explanation: 'Finds shortest path in weighted graphs.',
          },
        ],
        puzzleData: null,
      };

      const result = sanitizeGameConfig(incompleteConfig);
      expect(result.valid).toBe(true);
      expect(result.sanitizedConfig.puzzleData).not.toBeNull();
      expect(result.sanitizedConfig.puzzleData!.pairs!.length).toBeGreaterThanOrEqual(4);
      expect(result.sanitizedConfig.puzzleData!.steps!.length).toBeGreaterThanOrEqual(4);
    });

    it('validates concept-matching and step-ordering schemas with term and definition fields', async () => {
      const { puzzleDataSchema } = await import('../../src/lib/validation');
      const samplePuzzle = {
        type: 'concept-matching',
        prompt: 'Match the concepts below:',
        pairs: [
          {
            id: 'p-1',
            left: 'Concept Left',
            right: 'Definition Right',
            term: 'Concept Left',
            definition: 'Definition Right',
            explanation: 'Detailed explanation',
          },
        ],
        steps: [
          {
            id: 's-1',
            order: 1,
            text: 'Initial step',
            explanation: 'Step explanation',
          },
        ],
      };

      const parsed = puzzleDataSchema.safeParse(samplePuzzle);
      expect(parsed.success).toBe(true);
    });
  });

  describe('Gameplay Completion & XP Idempotency for Puzzle Quest', () => {
    it('awards XP upon puzzle completion and prevents duplicate XP on replay', () => {
      storage.reset();
      const initialProfile = storage.getProfile();
      expect(initialProfile.totalXp).toBe(0);

      // Create a test course and quest
      const courseId = 'course-puzzle-101';
      storage.saveCourse({
        id: courseId,
        courseName: 'Algorithms & Structures',
        courseCode: 'CS-202',
        color: '#8b5cf6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const questId = 'quest-puzzle-sort';
      storage.saveMilestone({
        id: questId,
        courseId,
        title: 'Sorting Algorithms & Stability',
        milestoneType: 'assignment',
        dueDate: '2026-11-20',
        dueTime: null,
        weightPercent: 10,
        difficultyCategory: 'minor_quest',
        bossHp: null,
        xpReward: 75,
        status: 'pending',
        sourceType: 'syllabus',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Complete the puzzle quest
      const firstResult = storage.completeQuestWithGame(questId, 'milestone', {
        gameMode: 'puzzle-quest',
        score: 95,
      });

      expect(firstResult.alreadyCompleted).toBe(false);
      expect(firstResult.xpAwarded).toBe(75);
      expect(storage.getProfile().totalXp).toBe(75);

      // Verify the quest is now marked as completed in storage
      const milestones = storage.load().milestones;
      const completedMilestone = milestones.find((m) => m.id === questId);
      expect(completedMilestone?.status).toBe('completed');

      // Replay the completed puzzle quest
      const replayResult = storage.completeQuestWithGame(questId, 'milestone', {
        gameMode: 'puzzle-quest',
        score: 100,
      });

      expect(replayResult.alreadyCompleted).toBe(true);
      expect(replayResult.xpAwarded).toBe(0);
      // Total XP must strictly remain 75 with no duplicate inflation
      expect(storage.getProfile().totalXp).toBe(75);
    });
  });
});
