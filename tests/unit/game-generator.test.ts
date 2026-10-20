import { describe, it, expect } from 'vitest';
import {
  selectIntelligentGameMode,
  validateGameConfig,
  generateFallbackGameConfig,
  generateFallbackQuestions,
} from '../../src/lib/game-generator';
import { QuestGameConfig } from '../../src/types';

describe('Game Generator Engine: Intelligent Game Mode Selection', () => {
  it('selects puzzle-quest for algorithmic, step-based, or sorting topics', () => {
    expect(selectIntelligentGameMode('Bubble Sort and Quick Sort Algorithms')).toBe('puzzle-quest');
    expect(selectIntelligentGameMode('Binary Search Tree Traversal Steps')).toBe('puzzle-quest');
    expect(selectIntelligentGameMode('Database Normalization Pipeline')).toBe('puzzle-quest');
    expect(selectIntelligentGameMode('Cell Division Mitosis Phases')).toBe('puzzle-quest');
  });

  it('selects do-or-die for rapid factual, vocabulary, definition, or syntax topics', () => {
    expect(selectIntelligentGameMode('Vocabulary and Terminology Drill')).toBe('do-or-die');
    expect(selectIntelligentGameMode('Python Syntax & Quick Operators')).toBe('do-or-die');
    expect(selectIntelligentGameMode('Key Historical Dates & Formulas')).toBe('do-or-die');
    expect(selectIntelligentGameMode('Anatomy Terminology & Naming Conventions')).toBe('do-or-die');
  });

  it('defaults to quiz-battle for conceptual, analytical, or comprehensive topics', () => {
    expect(selectIntelligentGameMode('Object-Oriented Programming Principles')).toBe('quiz-battle');
    expect(selectIntelligentGameMode('Introduction to Microeconomics')).toBe('quiz-battle');
    expect(selectIntelligentGameMode('Organic Chemistry Reaction Mechanisms')).toBe('quiz-battle');
  });
});

describe('Game Generator Engine: Game Config Validation', () => {
  it('validates correct game configuration', () => {
    const validConfig: QuestGameConfig = {
      gameMode: 'quiz-battle',
      questions: [
        {
          id: 'q1',
          question: 'What is the time complexity of binary search?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
          correctAnswerIndex: 2,
          explanation: 'Binary search divides the search space in half each step.',
          hint: 'Think logarithmic.',
        },
      ],
      topicTitle: 'Binary Search',
    };

    expect(validateGameConfig(validConfig)).toBe(true);
  });

  it('rejects game config with empty questions array', () => {
    const emptyConfig: QuestGameConfig = {
      gameMode: 'do-or-die',
      questions: [],
      topicTitle: 'Empty Topic',
    };

    expect(validateGameConfig(emptyConfig)).toBe(false);
  });

  it('rejects game config with invalid correctAnswerIndex', () => {
    const invalidIndexConfig: QuestGameConfig = {
      gameMode: 'do-or-die',
      questions: [
        {
          id: 'q1',
          question: 'What is 2 + 2?',
          options: ['3', '4'],
          correctAnswerIndex: 5, // Out of bounds!
          explanation: '2 + 2 = 4',
        },
      ],
      topicTitle: 'Math',
    };

    expect(validateGameConfig(invalidIndexConfig)).toBe(false);
  });

  it('rejects game config with fewer than 2 options', () => {
    const singleOptionConfig: QuestGameConfig = {
      gameMode: 'quiz-battle',
      questions: [
        {
          id: 'q1',
          question: 'Single Option Question',
          options: ['Only one option'],
          correctAnswerIndex: 0,
          explanation: 'Invalid because no choice exists',
        },
      ],
      topicTitle: 'Broken',
    };

    expect(validateGameConfig(singleOptionConfig)).toBe(false);
  });
});

describe('Game Generator Engine: Fallback Configuration', () => {
  it('generates fully populated fallback game config for Do-or-Die', () => {
    const config = generateFallbackGameConfig('Graph Traversals', 'CS-201', 'do-or-die');
    expect(config.gameMode).toBe('do-or-die');
    expect(config.topicTitle).toBe('Graph Traversals');
    expect(config.questions.length).toBeGreaterThanOrEqual(3);

    config.questions.forEach((q) => {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.correctAnswerIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswerIndex).toBeLessThan(q.options.length);
      expect(q.explanation.length).toBeGreaterThan(0);
    });
  });

  it('generates fully populated fallback config for Puzzle Quest with concept pairs and step ordering', () => {
    const config = generateFallbackGameConfig('Sorting Algorithms', 'CS-201', 'puzzle-quest');
    expect(config.gameMode).toBe('puzzle-quest');
    expect(config.puzzleData).toBeDefined();
    expect(config.puzzleData?.type).toBeDefined();

    if (config.puzzleData?.type === 'concept-matching') {
      expect(config.puzzleData.pairs.length).toBeGreaterThanOrEqual(3);
      config.puzzleData.pairs.forEach((p) => {
        expect(p.term.length).toBeGreaterThan(0);
        expect(p.definition.length).toBeGreaterThan(0);
      });
    } else {
      expect(config.puzzleData?.orderedSteps.length).toBeGreaterThanOrEqual(3);
      expect(config.puzzleData?.scrambledSteps.length).toBe(config.puzzleData?.orderedSteps.length);
    }
  });
});
