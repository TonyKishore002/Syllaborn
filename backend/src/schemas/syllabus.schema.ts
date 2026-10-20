import { z } from 'zod';

export const gameQuestionSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string().min(1)).min(2, 'Must provide at least 2 options'),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().min(1, 'Explanation cannot be empty'),
  hint: z.string().default('Think about the fundamental course principles!'),
  sourceReference: z
    .object({
      page: z.number().nullable().optional(),
      excerpt: z.string().nullable().optional(),
    })
    .optional(),
});

export const puzzlePairSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  left: z.string().min(1),
  right: z.string().min(1),
});

export const puzzleStepSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  order: z.number().int(),
  text: z.string().min(1),
});

export const puzzleDataSchema = z.object({
  type: z.enum(['matching', 'ordering']),
  prompt: z.string().min(1),
  pairs: z.array(puzzlePairSchema).optional(),
  steps: z.array(puzzleStepSchema).optional(),
});

export const questGameConfigSchema = z.object({
  questId: z.string().optional(),
  topic: z.string().min(1),
  gameMode: z.enum(['do-or-die', 'quiz-battle', 'puzzle-quest', 'boss-slayer']),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  questions: z.array(gameQuestionSchema).default([]),
  puzzleData: puzzleDataSchema.nullable().optional(),
});

export const analyzeRequestSchema = z.object({
  text: z
    .string()
    .min(20, 'Extracted text is too short to be a valid syllabus')
    .max(300000, 'Document text exceeds maximum allowed character length (300k chars)'),
  options: z
    .object({
      detailLevel: z.enum(['standard', 'thorough']).optional(),
    })
    .optional(),
});

export const generateGameRequestSchema = z.object({
  topicTitle: z.string().min(1),
  courseName: z.string().optional(),
  unitTitle: z.string().optional(),
  preferredGameMode: z.enum(['do-or-die', 'quiz-battle', 'puzzle-quest', 'boss-slayer']).optional(),
  syllabusExcerpt: z.string().optional(),
});

export const extractedGradingCategorySchema = z.object({
  name: z.string(),
  weight_percent: z.number().min(0).max(100),
  source_page: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

export const extractedMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'assignment',
    'reading',
    'quiz',
    'lab',
    'project',
    'presentation',
    'midterm',
    'final_exam',
    'other',
  ]),
  weight_percent: z.number().min(0).max(100).nullable().optional(),
  due_date: z.string().nullable().optional(), // YYYY-MM-DD format
  due_time: z.string().nullable().optional(),
  source_page: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const extractedTopicSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  quest_title: z.string().optional(),
  description: z.string().optional(),
  game_mode: z.enum(['do-or-die', 'quiz-battle', 'puzzle-quest']).optional().default('quiz-battle'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  questions: z.array(gameQuestionSchema).optional().default([]),
  puzzle_data: puzzleDataSchema.nullable().optional(),
});

export const extractedUnitSchema = z.object({
  unit_number: z.number().int().optional(),
  title: z.string().min(1),
  location_name: z.string().optional(),
  description: z.string().optional(),
  topics: z.array(extractedTopicSchema).default([]),
});

export const extractedAssessmentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  boss_name: z.string().optional(),
  type: z.enum([
    'assignment',
    'reading',
    'quiz',
    'lab',
    'project',
    'presentation',
    'midterm',
    'final_exam',
    'other',
  ]),
  weight_percent: z.number().min(0).max(100).nullable().optional(),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  boss_hp: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
  questions: z.array(gameQuestionSchema).optional().default([]),
});

export const extractedPolicySchema = z.object({
  title: z.string(),
  description: z.string(),
  source_page: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

export const syllabusExtractionResponseSchema = z.object({
  course_name: z.string().nullable().optional(),
  course_code: z.string().nullable().optional(),
  instructor_name: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  region_name: z.string().optional(),
  units: z.array(extractedUnitSchema).default([]),
  assessments: z.array(extractedAssessmentSchema).default([]),
  grading_structure: z.array(extractedGradingCategorySchema).default([]),
  milestones: z.array(extractedMilestoneSchema).default([]),
  policies: z.array(extractedPolicySchema).default([]),
  warnings: z.array(z.string()).default([]),
});

export type GameQuestion = z.infer<typeof gameQuestionSchema>;
export type PuzzleData = z.infer<typeof puzzleDataSchema>;
export type QuestGameConfig = z.infer<typeof questGameConfigSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type GenerateGameRequest = z.infer<typeof generateGameRequestSchema>;
export type ExtractedTopic = z.infer<typeof extractedTopicSchema>;
export type ExtractedUnit = z.infer<typeof extractedUnitSchema>;
export type ExtractedAssessment = z.infer<typeof extractedAssessmentSchema>;
export type SyllabusExtractionResponse = z.infer<typeof syllabusExtractionResponseSchema>;
