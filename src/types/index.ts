export type MilestoneType =
  | 'assignment'
  | 'reading'
  | 'quiz'
  | 'lab'
  | 'project'
  | 'presentation'
  | 'midterm'
  | 'final_exam'
  | 'other';

export type DifficultyCategory =
  | 'normal_quest'
  | 'elite_encounter'
  | 'boss_fight'
  | 'final_raid';

export type MilestoneStatus = 'pending' | 'completed';

export type SourceType = 'manual' | 'ai_extracted';

export type GameMode = 'do-or-die' | 'quiz-battle' | 'puzzle-quest' | 'boss-slayer';

export type ProcessingStatus =
  | 'uploaded'
  | 'queued'
  | 'extracting_content'
  | 'extracting_text'
  | 'analyzing_syllabus'
  | 'generating_quests'
  | 'generating_game_questions'
  | 'validating_game_content'
  | 'validating_results'
  | 'ready_to_play'
  | 'awaiting_review'
  | 'completed'
  | 'failed';

export interface GameQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint: string;
  sourceReference?: {
    page?: number | null;
    excerpt?: string | null;
  };
}

export interface PuzzleMatchingPair {
  id: string;
  left: string;
  right: string;
  term?: string;
  definition?: string;
  explanation?: string;
  hint?: string;
}

export interface PuzzleStepItem {
  id: string;
  order: number;
  text: string;
  explanation?: string;
}

export interface PuzzleData {
  type: 'matching' | 'ordering' | 'concept-matching' | 'step-ordering';
  prompt: string;
  hint?: string;
  explanation?: string;
  pairs?: PuzzleMatchingPair[];
  steps?: PuzzleStepItem[];
  orderedSteps?: PuzzleStepItem[];
  scrambledSteps?: PuzzleStepItem[];
}

export interface QuestGameConfig {
  questId?: string;
  topic: string;
  topicTitle?: string;
  gameMode: GameMode;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: GameQuestion[];
  puzzleData?: PuzzleData | null;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  universityName?: string | null;
  semesterStartDate: string; // YYYY-MM-DD
  semesterEndDate: string; // YYYY-MM-DD
  timezone: string;
  characterName?: string | null;
  totalXp?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseTopic {
  id: string;
  unitId: string;
  courseId: string;
  title: string;
  questTitle: string;
  description?: string;
  xpReward: number;
  status: MilestoneStatus;
  completedAt?: string | null;
  gameConfig?: QuestGameConfig;
}

export interface CourseUnit {
  id: string;
  courseId: string;
  unitNumber: number;
  title: string;
  locationName: string;
  description?: string;
  topics: CourseTopic[];
}

export interface Course {
  id: string;
  courseName: string;
  courseCode: string;
  instructorName?: string | null;
  semester?: string | null;
  description?: string | null;
  color: string;
  regionName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusPolicy {
  title: string;
  description: string;
  sourcePage?: number | null;
  evidence?: string | null;
}

export interface ExtractedMetadata {
  rawPolicies?: SyllabusPolicy[];
  warnings?: string[];
  extractionTimestamp?: string;
  modelUsed?: string;
}

export interface SyllabusDocument {
  id: string;
  courseId: string;
  originalFilename: string;
  fileSizeBytes: number;
  processingStatus: ProcessingStatus;
  processingError?: string | null;
  extractedMetadata?: ExtractedMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  status: ProcessingStatus;
  attemptCount: number;
  lastError?: string | null;
  startedAt: string;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradingCategory {
  id: string;
  courseId: string;
  name: string;
  weightPercent: number;
  sourcePage?: number | null;
  sourceExcerpt?: string | null;
}

export interface Milestone {
  id: string;
  courseId: string;
  documentId?: string | null;
  title: string;
  description?: string;
  milestoneType: MilestoneType;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  weightPercent: number | null;
  sourcePage?: number | null;
  sourceExcerpt?: string | null;
  extractionConfidence?: number | null;
  difficultyCategory: DifficultyCategory;
  bossHp: number | null;
  xpReward: number;
  status: MilestoneStatus;
  sourceType: SourceType;
  completedAt?: string | null;
  gameConfig?: QuestGameConfig;
  createdAt: string;
  updatedAt: string;
}

export interface XPTransaction {
  id: string;
  milestoneId?: string | null;
  amount: number;
  transactionType: 'milestone_completed' | 'milestone_reopened' | 'bonus' | 'level_adjustment';
  idempotencyKey: string;
  createdAt: string;
}

export type ActivityEventType =
  | 'course_created'
  | 'course_deleted'
  | 'syllabus_uploaded'
  | 'syllabus_analyzed'
  | 'milestone_created'
  | 'milestone_completed'
  | 'milestone_reopened'
  | 'milestone_deleted'
  | 'level_up'
  | 'profile_updated';

export interface ActivityEvent {
  id: string;
  courseId?: string | null;
  milestoneId?: string | null;
  eventType: ActivityEventType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  conditionType: 'total_milestones' | 'bosses_defeated' | 'courses_added' | 'level_reached' | 'streak_days';
  targetValue: number;
}

export interface NotificationPreferences {
  upcomingQuestsAlert: boolean;
  highStakesWarning: boolean;
  humorPrompts: boolean;
}

export interface ApplicationSettings {
  humorIntensity: 'chill' | 'playful' | 'chaotic';
  companionVisibility: boolean;
  animationIntensity: 'subtle' | 'normal' | 'expressive';
  soundEnabled: boolean;
  reducedMotion: boolean;
  theme: 'dark';
  notifications: NotificationPreferences;
}

export interface SyllabornDataDocument {
  version: number;
  profile: PlayerProfile | null;
  courses: Course[];
  units?: CourseUnit[];
  documents: SyllabusDocument[];
  jobs: ProcessingJob[];
  gradingCategories: GradingCategory[];
  milestones: Milestone[];
  xpTransactions: XPTransaction[];
  activities: ActivityEvent[];
  achievements: Achievement[];
  settings: ApplicationSettings;
}

// AI Extraction Structures
export interface ExtractedTopic {
  title: string;
  quest_title?: string;
  description?: string;
  game_mode?: GameMode;
  difficulty?: 'easy' | 'medium' | 'hard';
  questions?: GameQuestion[];
  puzzle_data?: PuzzleData | null;
}

export interface ExtractedUnit {
  unit_number?: number;
  title: string;
  location_name?: string;
  description?: string;
  topics: ExtractedTopic[];
}

export interface ExtractedAssessment {
  title: string;
  boss_name?: string;
  type: MilestoneType;
  weight_percent?: number | null;
  due_date?: string | null;
  due_time?: string | null;
  boss_hp?: number | null;
  evidence?: string | null;
  questions?: GameQuestion[];
}

export interface ExtractedMilestone {
  title: string;
  description?: string;
  type: MilestoneType;
  weight_percent?: number | null;
  due_date?: string | null;
  due_time?: string | null;
  source_page?: number | null;
  evidence?: string | null;
  confidence?: number;
  questions?: GameQuestion[];
}

export interface ExtractedGradingCategory {
  name: string;
  weight_percent: number;
  source_page?: number | null;
  evidence?: string | null;
}

export interface AISyllabusResponse {
  course_name?: string | null;
  course_code?: string | null;
  instructor_name?: string | null;
  semester?: string | null;
  region_name?: string;
  units?: ExtractedUnit[];
  assessments?: ExtractedAssessment[];
  grading_structure: ExtractedGradingCategory[];
  milestones: ExtractedMilestone[];
  policies: SyllabusPolicy[];
  warnings: string[];
}

export * from './boss';
