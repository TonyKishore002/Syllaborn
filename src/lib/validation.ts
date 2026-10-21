import { z } from 'zod';

export const milestoneTypeEnum = z.enum([
  'assignment',
  'reading',
  'quiz',
  'lab',
  'project',
  'presentation',
  'midterm',
  'final_exam',
  'other',
]);

export const difficultyCategoryEnum = z.enum([
  'normal_quest',
  'elite_encounter',
  'boss_fight',
  'final_raid',
]);

export const milestoneStatusEnum = z.enum(['pending', 'completed']);
export const sourceTypeEnum = z.enum(['manual', 'ai_extracted']);
export const gameModeEnum = z.enum(['do-or-die', 'quiz-battle', 'puzzle-quest', 'boss-slayer']);

export const processingStatusEnum = z.enum([
  'uploaded',
  'queued',
  'extracting_content',
  'extracting_text',
  'analyzing_syllabus',
  'generating_quests',
  'generating_game_questions',
  'validating_game_content',
  'validating_results',
  'ready_to_play',
  'awaiting_review',
  'completed',
  'failed',
]);

export const gameQuestionSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: z.array(z.string().min(1)).min(2, 'Must have at least 2 options'),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().min(1, 'Explanation cannot be empty'),
  hint: z.string().default('Review the core concepts from the syllabus.'),
  sourceReference: z
    .object({
      page: z.number().nullable().optional(),
      excerpt: z.string().nullable().optional(),
    })
    .optional(),
});

export const puzzlePairSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  left: z.string().optional().default(''),
  right: z.string().optional().default(''),
  term: z.string().optional(),
  definition: z.string().optional(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
});

export const puzzleStepSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  order: z.number().int().optional().default(1),
  text: z.string().min(1),
  explanation: z.string().optional(),
});

export const puzzleDataSchema = z.object({
  type: z.enum(['matching', 'ordering', 'concept-matching', 'step-ordering']).default('concept-matching'),
  prompt: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  pairs: z.array(puzzlePairSchema).optional(),
  steps: z.array(puzzleStepSchema).optional(),
  orderedSteps: z.array(puzzleStepSchema).optional(),
  scrambledSteps: z.array(puzzleStepSchema).optional(),
});

export const questGameConfigSchema = z.object({
  questId: z.string().optional(),
  topic: z.string().min(1),
  gameMode: gameModeEnum,
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  questions: z.array(gameQuestionSchema).default([]),
  puzzleData: puzzleDataSchema.nullable().optional(),
});

export const playerProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1, 'Display name is required').max(100),
  universityName: z.string().max(150).nullable().optional(),
  semesterStartDate: z.string().min(4, 'Semester start date is required'),
  semesterEndDate: z.string().min(4, 'Semester end date is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  characterName: z.string().max(100).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const courseSchema = z.object({
  id: z.string().min(1),
  courseName: z.string().min(1, 'Course name is required').max(150),
  courseCode: z.string().min(1, 'Course code is required').max(50),
  instructorName: z.string().max(150).nullable().optional(),
  semester: z.string().max(50).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  color: z.string().min(1),
  regionName: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const syllabusPolicySchema = z.object({
  title: z.string(),
  description: z.string(),
  sourcePage: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

export const syllabusDocumentSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  originalFilename: z.string().min(1),
  fileSizeBytes: z.number().nonnegative(),
  processingStatus: processingStatusEnum,
  processingError: z.string().nullable().optional(),
  extractedMetadata: z
    .object({
      rawPolicies: z.array(syllabusPolicySchema).optional(),
      warnings: z.array(z.string()).optional(),
      extractionTimestamp: z.string().optional(),
      modelUsed: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const processingJobSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  status: processingStatusEnum,
  attemptCount: z.number().int().nonnegative(),
  lastError: z.string().nullable().optional(),
  startedAt: z.string(),
  finishedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const gradingCategorySchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  name: z.string().min(1, 'Category name is required'),
  weightPercent: z.number().min(0).max(100),
  sourcePage: z.number().int().nullable().optional(),
  sourceExcerpt: z.string().nullable().optional(),
});

export const milestoneSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  documentId: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  milestoneType: milestoneTypeEnum,
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable().optional(),
  weightPercent: z.number().min(0).max(100).nullable().optional(),
  sourcePage: z.number().int().nullable().optional(),
  sourceExcerpt: z.string().nullable().optional(),
  extractionConfidence: z.number().min(0).max(1).nullable().optional(),
  difficultyCategory: difficultyCategoryEnum,
  bossHp: z.number().nullable().optional(),
  xpReward: z.number().nonnegative(),
  status: milestoneStatusEnum,
  sourceType: sourceTypeEnum,
  completedAt: z.string().nullable().optional(),
  gameConfig: questGameConfigSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const xpTransactionSchema = z.object({
  id: z.string().min(1),
  milestoneId: z.string().nullable().optional(),
  amount: z.number(),
  transactionType: z.enum([
    'milestone_completed',
    'milestone_reopened',
    'bonus',
    'level_adjustment',
  ]),
  idempotencyKey: z.string().min(1),
  createdAt: z.string(),
});

export const activityEventSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  eventType: z.enum([
    'course_created',
    'course_deleted',
    'syllabus_uploaded',
    'syllabus_analyzed',
    'milestone_created',
    'milestone_completed',
    'milestone_reopened',
    'milestone_deleted',
    'level_up',
    'profile_updated',
  ]),
  title: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
});

export const achievementSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAt: z.string().nullable(),
  conditionType: z.enum([
    'total_milestones',
    'bosses_defeated',
    'courses_added',
    'level_reached',
    'streak_days',
  ]),
  targetValue: z.number().int().positive(),
});

export const applicationSettingsSchema = z.object({
  humorIntensity: z.enum(['chill', 'playful', 'chaotic']),
  companionVisibility: z.boolean(),
  animationIntensity: z.enum(['subtle', 'normal', 'expressive']),
  soundEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  theme: z.literal('dark'),
  notifications: z.object({
    upcomingQuestsAlert: z.boolean(),
    highStakesWarning: z.boolean(),
    humorPrompts: z.boolean(),
  }),
});

export const courseTopicSchema = z.object({
  id: z.string().min(1),
  unitId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  questTitle: z.string().min(1),
  description: z.string().optional(),
  xpReward: z.number().nonnegative(),
  status: milestoneStatusEnum,
  completedAt: z.string().nullable().optional(),
  gameConfig: questGameConfigSchema.optional(),
});

export const courseUnitSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  unitNumber: z.number().int(),
  title: z.string().min(1),
  locationName: z.string().min(1),
  description: z.string().optional(),
  topics: z.array(courseTopicSchema).default([]),
});

export const syllabornDataDocumentSchema = z.object({
  version: z.number().int().min(1),
  profile: playerProfileSchema.nullable(),
  courses: z.array(courseSchema),
  units: z.array(courseUnitSchema).optional().default([]),
  documents: z.array(syllabusDocumentSchema),
  jobs: z.array(processingJobSchema),
  gradingCategories: z.array(gradingCategorySchema),
  milestones: z.array(milestoneSchema),
  xpTransactions: z.array(xpTransactionSchema),
  activities: z.array(activityEventSchema),
  achievements: z.array(achievementSchema),
  settings: applicationSettingsSchema,
});

// AI Response Validation Schema
export const aiTopicSchema = z.object({
  title: z.string().min(1),
  quest_title: z.string().optional(),
  description: z.string().optional(),
  game_mode: gameModeEnum.optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  questions: z.array(gameQuestionSchema).optional(),
  puzzle_data: puzzleDataSchema.nullable().optional(),
});

export const aiUnitSchema = z.object({
  unit_number: z.number().int().optional(),
  title: z.string().min(1),
  location_name: z.string().optional(),
  description: z.string().optional(),
  topics: z.array(aiTopicSchema).default([]),
});

export const aiAssessmentSchema = z.object({
  title: z.string().min(1),
  boss_name: z.string().optional(),
  type: milestoneTypeEnum.catch('other'),
  weight_percent: z.number().min(0).max(100).nullable().optional(),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  boss_hp: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
  questions: z.array(gameQuestionSchema).optional(),
});

export const aiGradingCategorySchema = z.object({
  name: z.string(),
  weight_percent: z.number().min(0).max(100),
  source_page: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
});

export const aiMilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: milestoneTypeEnum.catch('other'),
  weight_percent: z.number().min(0).max(100).nullable().optional(),
  due_date: z.string().nullable().optional(),
  due_time: z.string().nullable().optional(),
  source_page: z.number().nullable().optional(),
  evidence: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  questions: z.array(gameQuestionSchema).optional(),
});

export const aiSyllabusResponseSchema = z.object({
  course_name: z.string().nullable().optional(),
  course_code: z.string().nullable().optional(),
  instructor_name: z.string().nullable().optional(),
  semester: z.string().nullable().optional(),
  region_name: z.string().optional(),
  units: z.array(aiUnitSchema).optional().default([]),
  assessments: z.array(aiAssessmentSchema).optional().default([]),
  grading_structure: z.array(aiGradingCategorySchema).default([]),
  milestones: z.array(aiMilestoneSchema).default([]),
  policies: z.array(syllabusPolicySchema).default([]),
  warnings: z.array(z.string()).default([]),
});
