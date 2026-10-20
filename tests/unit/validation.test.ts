import { describe, it, expect } from 'vitest';
import {
  aiSyllabusResponseSchema,
  courseSchema,
  milestoneSchema,
  syllabornDataDocumentSchema,
  gameModeEnum,
  questGameConfigSchema,
} from '../../src/lib/validation';

describe('Validation Schemas: AI Syllabus Output Validation', () => {
  it('successfully validates a complete structured syllabus AI response', () => {
    const sampleAIResponse = {
      course_name: 'Data Structures and Algorithms',
      course_code: 'CS-301',
      instructor_name: 'Dr. Jane Turing',
      semester: 'Fall 2026',
      grading_structure: [
        {
          name: 'Midterm Examination',
          weight_percent: 30,
          source_page: 8,
          evidence: 'Midterm examination contributes 30% of the final grade.',
        },
        {
          name: 'Final Examination',
          weight_percent: 40,
          source_page: 9,
          evidence: 'Final examination contributes 40%.',
        },
      ],
      milestones: [
        {
          title: 'Quiz 1: Complexity Analysis',
          description: 'Big-O notation assessment',
          type: 'quiz',
          weight_percent: 5,
          due_date: '2026-10-25',
          due_time: '14:00',
          source_page: 4,
          evidence: 'Quiz 1 is scheduled for October 25 at 2 PM.',
          confidence: 0.95,
        },
      ],
      policies: [
        {
          title: 'Late Submission Policy',
          description: '10% deduction per day late.',
          source_page: 3,
          evidence: 'Late assignments will be penalized 10% per day.',
        },
      ],
      warnings: [],
    };

    const parsed = aiSyllabusResponseSchema.safeParse(sampleAIResponse);
    expect(parsed.success).toBe(true);
  });

  it('rejects AI responses with invalid weight percentages outside 0-100', () => {
    const invalidWeightResponse = {
      course_name: 'CS-101',
      grading_structure: [
        {
          name: 'Impossible Exam',
          weight_percent: 150, // Invalid!
        },
      ],
      milestones: [],
      policies: [],
      warnings: [],
    };

    const parsed = aiSyllabusResponseSchema.safeParse(invalidWeightResponse);
    expect(parsed.success).toBe(false);
  });

  it('allows null due dates and weights when the syllabus does not specify them', () => {
    const unspecifiedMilestoneResponse = {
      course_name: 'Philosophy 101',
      grading_structure: [],
      milestones: [
        {
          title: 'Term Essay',
          type: 'assignment',
          weight_percent: null,
          due_date: null,
          evidence: 'An essay will be assigned during the term.',
        },
      ],
      policies: [],
      warnings: ['Due date not specified in syllabus text.'],
    };

    const parsed = aiSyllabusResponseSchema.safeParse(unspecifiedMilestoneResponse);
    expect(parsed.success).toBe(true);
  });
});

describe('Validation Schemas: Local Storage Document & Courses', () => {
  it('validates a correct Course entity', () => {
    const course = {
      id: 'course-1',
      courseName: 'Operating Systems',
      courseCode: 'CS-302',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(true);
  });

  it('rejects courses with missing courseName or courseCode', () => {
    const invalidCourse = {
      id: 'course-2',
      courseName: '',
      courseCode: '',
      color: '#06b6d4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = courseSchema.safeParse(invalidCourse);
    expect(result.success).toBe(false);
  });

  it('validates boss-slayer in gameModeEnum and questGameConfigSchema', () => {
    expect(gameModeEnum.safeParse('boss-slayer').success).toBe(true);

    const validBossConfig = {
      topic: 'Algorithms Midterm Boss',
      gameMode: 'boss-slayer',
      difficulty: 'hard',
      questions: [
        {
          id: 'q-1',
          question: 'What is the recurrence relation for Merge Sort?',
          options: ['T(n) = 2T(n/2) + O(n)', 'T(n) = T(n-1) + O(1)'],
          correctAnswerIndex: 0,
          explanation: 'Merge sort divides into 2 halves and combines in O(n).',
        },
      ],
    };

    const result = questGameConfigSchema.safeParse(validBossConfig);
    expect(result.success).toBe(true);
  });
});
