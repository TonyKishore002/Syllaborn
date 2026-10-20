import {
  Achievement,
  ActivityEvent,
  ApplicationSettings,
  Course,
  CourseTopic,
  CourseUnit,
  GradingCategory,
  Milestone,
  PlayerProfile,
  ProcessingJob,
  SyllabusDocument,
  SyllabornDataDocument,
  XPTransaction,
  QuestGameConfig,
} from '../types';
import { INITIAL_ACHIEVEMENTS, xpForLevel } from './gamification';
import { syllabornDataDocumentSchema } from './validation';

export const STORAGE_KEY = 'syllaborn:data:v1';
export const STORAGE_CHANGE_EVENT = 'syllaborn:storage:change';

export const DEFAULT_SETTINGS: ApplicationSettings = {
  humorIntensity: 'playful',
  companionVisibility: true,
  animationIntensity: 'normal',
  soundEnabled: false,
  reducedMotion: false,
  theme: 'dark',
  notifications: {
    upcomingQuestsAlert: true,
    highStakesWarning: true,
    humorPrompts: true,
  },
};

export const INITIAL_DATA: SyllabornDataDocument = {
  version: 1,
  profile: null,
  courses: [],
  units: [],
  documents: [],
  jobs: [],
  gradingCategories: [],
  milestones: [],
  xpTransactions: [],
  activities: [],
  achievements: INITIAL_ACHIEVEMENTS,
  settings: DEFAULT_SETTINGS,
};

class StorageService {
  private memoryCache: SyllabornDataDocument | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
          this.memoryCache = null;
          this.notifySubscribers();
        }
      });
    }
  }

  /**
   * Broadcast change event so React hooks update immediately
   */
  private notifySubscribers() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
    }
  }

  /**
   * Load entire application document from localStorage with Zod validation
   */
  public load(): SyllabornDataDocument {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      return INITIAL_DATA;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.memoryCache = { ...INITIAL_DATA };
        return this.memoryCache;
      }

      const parsed = JSON.parse(raw);
      const validation = syllabornDataDocumentSchema.safeParse(parsed);

      if (!validation.success) {
        console.warn('Storage validation failed, recovering with defaults:', validation.error);
        // Soft migration/recovery
        const recovered: SyllabornDataDocument = {
          version: parsed?.version || 1,
          profile: parsed?.profile || null,
          courses: Array.isArray(parsed?.courses) ? parsed.courses : [],
          documents: Array.isArray(parsed?.documents) ? parsed.documents : [],
          jobs: Array.isArray(parsed?.jobs) ? parsed.jobs : [],
          gradingCategories: Array.isArray(parsed?.gradingCategories) ? parsed.gradingCategories : [],
          milestones: Array.isArray(parsed?.milestones) ? parsed.milestones : [],
          xpTransactions: Array.isArray(parsed?.xpTransactions) ? parsed.xpTransactions : [],
          activities: Array.isArray(parsed?.activities) ? parsed.activities : [],
          achievements: Array.isArray(parsed?.achievements) ? parsed.achievements : INITIAL_ACHIEVEMENTS,
          settings: parsed?.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
        };
        this.memoryCache = recovered;
        this.save(recovered);
        return recovered;
      }

      this.memoryCache = validation.data as SyllabornDataDocument;
      return this.memoryCache;
    } catch (err) {
      console.error('Failed to read or parse localStorage data:', err);
      this.memoryCache = { ...INITIAL_DATA };
      return this.memoryCache;
    }
  }

  /**
   * Write entire application document to localStorage with safety checks
   */
  public save(data: SyllabornDataDocument): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.memoryCache = data;
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      this.memoryCache = data;
      this.notifySubscribers();
      return true;
    } catch (err: any) {
      console.error('Failed to write to localStorage (quota exceeded or storage blocked):', err);
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.error('LocalStorage quota exceeded. Syllaborn keeps raw PDF data out of storage.');
      }
      return false;
    }
  }

  /**
   * Reset all local application data
   */
  public reset(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    this.memoryCache = { ...INITIAL_DATA };
    this.notifySubscribers();
  }

  public getTotalXp(): number {
    return this.load().xpTransactions.reduce((acc, t) => acc + t.amount, 0);
  }

  // --- Profile Operations ---
  public getProfile(): PlayerProfile & { totalXp: number } {
    const profile = this.load().profile;
    const totalXp = this.getTotalXp();
    if (!profile) {
      return {
        id: 'player-profile',
        displayName: 'Syllabus Scholar',
        semesterStartDate: new Date().toISOString().slice(0, 10),
        semesterEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10),
        timezone: 'UTC',
        characterName: 'Novice Adventurer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalXp,
      };
    }
    return {
      ...profile,
      totalXp,
    };
  }

  public saveProfile(profile: PlayerProfile): void {
    const data = this.load();
    const updated = {
      ...data,
      profile,
    };
    this.save(updated);
  }

  // --- Settings Operations ---
  public getSettings(): ApplicationSettings {
    return this.load().settings;
  }

  public updateSettings(settings: Partial<ApplicationSettings>): void {
    const data = this.load();
    const updated = {
      ...data,
      settings: { ...data.settings, ...settings },
    };
    this.save(updated);
  }

  // --- Course Operations ---
  public getCourses(): Course[] {
    return this.load().courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.load().courses.find((c) => c.id === id);
  }

  public saveCourse(course: Course): void {
    const data = this.load();
    const existingIndex = data.courses.findIndex((c) => c.id === course.id);
    let updatedCourses: Course[];

    if (existingIndex >= 0) {
      updatedCourses = [...data.courses];
      updatedCourses[existingIndex] = course;
    } else {
      updatedCourses = [course, ...data.courses];
    }

    const achievements = this.checkAchievements(
      data.milestones,
      data.xpTransactions,
      updatedCourses,
      data.achievements,
      data.units
    );

    this.save({
      ...data,
      courses: updatedCourses,
      achievements,
    });
  }

  /**
   * Delete course and cascaded relations (documents, milestones, grading categories)
   */
  public deleteCourse(courseId: string): void {
    const data = this.load();
    const course = data.courses.find((c) => c.id === courseId);

    const updatedCourses = data.courses.filter((c) => c.id !== courseId);
    const updatedDocs = data.documents.filter((d) => d.courseId !== courseId);
    const docIds = new Set(data.documents.filter((d) => d.courseId === courseId).map((d) => d.id));
    const updatedJobs = data.jobs.filter((j) => !docIds.has(j.documentId));
    const updatedMilestones = data.milestones.filter((m) => m.courseId !== courseId);
    const updatedCategories = data.gradingCategories.filter((g) => g.courseId !== courseId);
    const updatedUnits = (data.units || []).filter((u) => u.courseId !== courseId);

    const newActivity: ActivityEvent = {
      id: crypto.randomUUID(),
      courseId: null,
      eventType: 'course_deleted',
      title: 'Course Removed',
      description: `Course "${course?.courseName || courseId}" and all related quests were removed.`,
      createdAt: new Date().toISOString(),
    };

    this.save({
      ...data,
      courses: updatedCourses,
      units: updatedUnits,
      documents: updatedDocs,
      jobs: updatedJobs,
      milestones: updatedMilestones,
      gradingCategories: updatedCategories,
      activities: [newActivity, ...data.activities].slice(0, 100),
    });
  }

  // --- Unit & Topic Operations (Locations & Quests) ---
  public getUnits(courseId?: string): CourseUnit[] {
    const all = this.load().units || [];
    if (courseId) {
      return all.filter((u) => u.courseId === courseId);
    }
    return all;
  }

  public saveUnits(newUnits: CourseUnit[]): void {
    const data = this.load();
    const existing = data.units || [];
    const courseIds = new Set(newUnits.map((u) => u.courseId));
    const filtered = existing.filter((u) => !courseIds.has(u.courseId));
    this.save({
      ...data,
      units: [...filtered, ...newUnits],
    });
  }

  public toggleTopicStatus(topicId: string): { topic: CourseTopic; xpAwarded: number } | null {
    const data = this.load();
    const units = [...(data.units || [])];
    let foundTopic: CourseTopic | null = null;
    let foundUnit: CourseUnit | null = null;

    for (const unit of units) {
      const topicIndex = unit.topics.findIndex((t) => t.id === topicId);
      if (topicIndex >= 0) {
        foundUnit = unit;
        const topic = unit.topics[topicIndex];
        const newStatus = topic.status === 'completed' ? 'pending' : 'completed';
        const now = new Date().toISOString();
        const updatedTopic: CourseTopic = {
          ...topic,
          status: newStatus,
          completedAt: newStatus === 'completed' ? now : null,
        };
        unit.topics[topicIndex] = updatedTopic;
        foundTopic = updatedTopic;
        break;
      }
    }

    if (!foundTopic || !foundUnit) return null;

    const now = new Date().toISOString();
    let xpChange = 0;
    const updatedTransactions = [...data.xpTransactions];

    if (foundTopic.status === 'completed') {
      const idempotencyKey = `${topicId}:topic_completed`;
      const alreadyAwarded = data.xpTransactions.some((t) => t.idempotencyKey === idempotencyKey);
      if (!alreadyAwarded) {
        xpChange = foundTopic.xpReward || 50;
        updatedTransactions.push({
          id: crypto.randomUUID(),
          milestoneId: foundTopic.id,
          amount: xpChange,
          transactionType: 'milestone_completed',
          idempotencyKey,
          createdAt: now,
        });
      }
    } else {
      xpChange = -(foundTopic.xpReward || 50);
      updatedTransactions.push({
        id: crypto.randomUUID(),
        milestoneId: foundTopic.id,
        amount: xpChange,
        transactionType: 'milestone_reopened',
        idempotencyKey: `${topicId}:topic_reopened:${Date.now()}`,
        createdAt: now,
      });
    }

    const activity: ActivityEvent = {
      id: crypto.randomUUID(),
      courseId: foundTopic.courseId,
      milestoneId: foundTopic.id,
      eventType: foundTopic.status === 'completed' ? 'milestone_completed' : 'milestone_reopened',
      title: foundTopic.status === 'completed' ? 'Topic Quest Cleared!' : 'Quest Reopened',
      description:
        foundTopic.status === 'completed'
          ? `Completed quest "${foundTopic.questTitle || foundTopic.title}" (+${foundTopic.xpReward || 50} XP)`
          : `Reopened quest "${foundTopic.questTitle || foundTopic.title}"`,
      createdAt: now,
    };

    const achievements = this.checkAchievements(
      data.milestones,
      updatedTransactions,
      data.courses,
      data.achievements,
      units
    );

    this.save({
      ...data,
      units,
      xpTransactions: updatedTransactions,
      activities: [activity, ...data.activities].slice(0, 100),
      achievements,
    });

    return { topic: foundTopic, xpAwarded: xpChange };
  }

  public saveTopicGameConfig(topicId: string, gameConfig: QuestGameConfig): void {
    const data = this.load();
    const units = [...(data.units || [])];
    for (const unit of units) {
      const idx = unit.topics.findIndex((t) => t.id === topicId);
      if (idx >= 0) {
        unit.topics[idx] = { ...unit.topics[idx], gameConfig };
        this.save({ ...data, units });
        return;
      }
    }
  }

  public saveMilestoneGameConfig(milestoneId: string, gameConfig: QuestGameConfig): void {
    const data = this.load();
    const milestones = [...data.milestones];
    const idx = milestones.findIndex((m) => m.id === milestoneId);
    if (idx >= 0) {
      milestones[idx] = { ...milestones[idx], gameConfig };
      this.save({ ...data, milestones });
    }
  }

  /**
   * Complete a quest or boss fight via verified gameplay completion.
   * If already completed, ensures zero duplicate XP is awarded.
   */
  public completeQuestWithGame(
    questId: string,
    kind: 'topic' | 'milestone',
    details?: { gameMode?: string; score?: number }
  ): { success: boolean; xpAwarded: number; alreadyCompleted: boolean; title: string } | null {
    const data = this.load();
    const now = new Date().toISOString();
    let xpChange = 0;
    let alreadyCompleted = false;
    let questTitle = '';
    let courseId = '';

    const updatedTransactions = [...data.xpTransactions];

    if (kind === 'topic') {
      const units = [...(data.units || [])];
      let foundTopic: CourseTopic | null = null;

      for (const unit of units) {
        const topicIndex = unit.topics.findIndex((t) => t.id === questId);
        if (topicIndex >= 0) {
          const topic = unit.topics[topicIndex];
          foundTopic = topic;
          questTitle = topic.questTitle || topic.title;
          courseId = topic.courseId;
          alreadyCompleted = topic.status === 'completed';

          const idempotencyKey = `${questId}:topic_completed`;
          const alreadyAwarded = data.xpTransactions.some((t) => t.idempotencyKey === idempotencyKey);

          if (!alreadyAwarded) {
            xpChange = topic.xpReward || 50;
            updatedTransactions.push({
              id: crypto.randomUUID(),
              milestoneId: topic.id,
              amount: xpChange,
              transactionType: 'milestone_completed',
              idempotencyKey,
              createdAt: now,
            });
          }

          unit.topics[topicIndex] = {
            ...topic,
            status: 'completed',
            completedAt: topic.completedAt || now,
          };
          break;
        }
      }

      if (!foundTopic) return null;

      const activity: ActivityEvent = {
        id: crypto.randomUUID(),
        courseId,
        milestoneId: questId,
        eventType: 'milestone_completed',
        title: alreadyCompleted ? 'Quest Replayed!' : 'Quest Conquered!',
        description: alreadyCompleted
          ? `Replayed and completed "${questTitle}" in ${details?.gameMode || 'Game Mode'} (Practice mode - 0 duplicate XP).`
          : `Beat ${details?.gameMode || 'mini-game'} challenge for "${questTitle}" (+${xpChange} XP)!`,
        createdAt: now,
      };

      const achievements = this.checkAchievements(
        data.milestones,
        updatedTransactions,
        data.courses,
        data.achievements,
        units
      );

      this.save({
        ...data,
        units,
        xpTransactions: updatedTransactions,
        activities: [activity, ...data.activities].slice(0, 100),
        achievements,
      });

      return { success: true, xpAwarded: xpChange, alreadyCompleted, title: questTitle };
    } else {
      // Milestone / Boss fight
      const milestones = [...data.milestones];
      const milestoneIndex = milestones.findIndex((m) => m.id === questId);
      if (milestoneIndex === -1) return null;

      const milestone = milestones[milestoneIndex];
      questTitle = milestone.title;
      courseId = milestone.courseId;
      alreadyCompleted = milestone.status === 'completed';

      const idempotencyKey = `${questId}:milestone_completed`;
      const alreadyAwarded = data.xpTransactions.some((t) => t.idempotencyKey === idempotencyKey);

      if (!alreadyAwarded) {
        xpChange = milestone.xpReward || 150;
        updatedTransactions.push({
          id: crypto.randomUUID(),
          milestoneId: milestone.id,
          amount: xpChange,
          transactionType: 'milestone_completed',
          idempotencyKey,
          createdAt: now,
        });
      }

      milestones[milestoneIndex] = {
        ...milestone,
        status: 'completed',
        completedAt: milestone.completedAt || now,
        updatedAt: now,
      };

      const activity: ActivityEvent = {
        id: crypto.randomUUID(),
        courseId,
        milestoneId: questId,
        eventType: 'milestone_completed',
        title: alreadyCompleted ? 'Boss Encounter Replayed!' : 'Boss Vanquished in Arena!',
        description: alreadyCompleted
          ? `Replayed boss fight "${questTitle}" in ${details?.gameMode || 'Do-or-Die'} (Practice mode - 0 duplicate XP).`
          : `Vanquished the examination boss "${questTitle}" (+${xpChange} XP)!`,
        createdAt: now,
      };

      const achievements = this.checkAchievements(
        milestones,
        updatedTransactions,
        data.courses,
        data.achievements,
        data.units
      );

      this.save({
        ...data,
        milestones,
        xpTransactions: updatedTransactions,
        activities: [activity, ...data.activities].slice(0, 100),
        achievements,
      });

      return { success: true, xpAwarded: xpChange, alreadyCompleted, title: questTitle };
    }
  }

  // --- Milestone Operations ---
  public getMilestones(courseId?: string): Milestone[] {
    const all = this.load().milestones;
    if (courseId) {
      return all.filter((m) => m.courseId === courseId);
    }
    return all;
  }

  public getMilestoneById(id: string): Milestone | undefined {
    return this.load().milestones.find((m) => m.id === id);
  }

  public saveMilestone(milestone: Milestone): void {
    const data = this.load();
    const index = data.milestones.findIndex((m) => m.id === milestone.id);
    let updated: Milestone[];

    if (index >= 0) {
      updated = [...data.milestones];
      updated[index] = milestone;
    } else {
      updated = [milestone, ...data.milestones];
    }

    this.save({
      ...data,
      milestones: updated,
    });
  }

  public deleteMilestone(id: string): void {
    const data = this.load();
    const target = data.milestones.find((m) => m.id === id);
    if (!target) return;

    this.save({
      ...data,
      milestones: data.milestones.filter((m) => m.id !== id),
    });
  }

  /**
   * Complete milestone with idempotent XP transaction to guarantee no duplicate rewards
   */
  public toggleMilestoneStatus(milestoneId: string): { milestone: Milestone; xpAwarded: number } | null {
    const data = this.load();
    const milestoneIndex = data.milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) return null;

    const milestone = data.milestones[milestoneIndex];
    const newStatus = milestone.status === 'completed' ? 'pending' : 'completed';
    const now = new Date().toISOString();

    let xpChange = 0;
    const updatedTransactions = [...data.xpTransactions];

    if (newStatus === 'completed') {
      // Award XP using idempotent key
      const idempotencyKey = `${milestoneId}:milestone_completed`;
      const alreadyAwarded = data.xpTransactions.some((t) => t.idempotencyKey === idempotencyKey);

      if (!alreadyAwarded) {
        xpChange = milestone.xpReward;
        const transaction: XPTransaction = {
          id: crypto.randomUUID(),
          milestoneId: milestone.id,
          amount: xpChange,
          transactionType: 'milestone_completed',
          idempotencyKey,
          createdAt: now,
        };
        updatedTransactions.push(transaction);
      }
    } else {
      // Reopening milestone - adjust XP policy consistently
      const reopenIdempotencyKey = `${milestoneId}:milestone_reopened:${Date.now()}`;
      xpChange = -milestone.xpReward;
      const transaction: XPTransaction = {
        id: crypto.randomUUID(),
        milestoneId: milestone.id,
        amount: xpChange,
        transactionType: 'milestone_reopened',
        idempotencyKey: reopenIdempotencyKey,
        createdAt: now,
      };
      updatedTransactions.push(transaction);
    }

    const updatedMilestone: Milestone = {
      ...milestone,
      status: newStatus,
      completedAt: newStatus === 'completed' ? now : null,
      updatedAt: now,
    };

    const updatedMilestones = [...data.milestones];
    updatedMilestones[milestoneIndex] = updatedMilestone;

    // Log activity
    const activity: ActivityEvent = {
      id: crypto.randomUUID(),
      courseId: milestone.courseId,
      milestoneId: milestone.id,
      eventType: newStatus === 'completed' ? 'milestone_completed' : 'milestone_reopened',
      title: newStatus === 'completed' ? 'Quest Completed!' : 'Quest Reopened',
      description:
        newStatus === 'completed'
          ? `Completed "${milestone.title}" (+${milestone.xpReward} XP)`
          : `Reopened "${milestone.title}"`,
      createdAt: now,
    };

    const updatedAchievements = this.checkAchievements(
      updatedMilestones,
      updatedTransactions,
      data.courses,
      data.achievements,
      data.units
    );

    this.save({
      ...data,
      milestones: updatedMilestones,
      xpTransactions: updatedTransactions,
      activities: [activity, ...data.activities].slice(0, 100),
      achievements: updatedAchievements,
    });

    return { milestone: updatedMilestone, xpAwarded: xpChange };
  }

  // --- Syllabus & Job Operations ---
  public saveDocument(doc: SyllabusDocument): void {
    const data = this.load();
    const index = data.documents.findIndex((d) => d.id === doc.id);
    let updatedDocs: SyllabusDocument[];

    if (index >= 0) {
      updatedDocs = [...data.documents];
      updatedDocs[index] = doc;
    } else {
      updatedDocs = [doc, ...data.documents];
    }

    this.save({
      ...data,
      documents: updatedDocs,
    });
  }

  public saveJob(job: ProcessingJob): void {
    const data = this.load();
    const index = data.jobs.findIndex((j) => j.id === job.id);
    let updatedJobs: ProcessingJob[];

    if (index >= 0) {
      updatedJobs = [...data.jobs];
      updatedJobs[index] = job;
    } else {
      updatedJobs = [job, ...data.jobs];
    }

    this.save({
      ...data,
      jobs: updatedJobs,
    });
  }

  public saveGradingCategories(categories: GradingCategory[]): void {
    const data = this.load();
    // Replace categories for given courses
    const courseIds = new Set(categories.map((c) => c.courseId));
    const preserved = data.gradingCategories.filter((c) => !courseIds.has(c.courseId));

    this.save({
      ...data,
      gradingCategories: [...preserved, ...categories],
    });
  }

  // --- Activity Logging ---
  public logActivity(event: Omit<ActivityEvent, 'id' | 'createdAt'>): void {
    const data = this.load();
    const newEvent: ActivityEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.save({
      ...data,
      activities: [newEvent, ...data.activities].slice(0, 100),
    });
  }

  // --- Helper: Achievement Check ---
  private checkAchievements(
    milestones: Milestone[],
    transactions: XPTransaction[],
    courses: Course[],
    currentAchievements: Achievement[],
    units?: CourseUnit[]
  ): Achievement[] {
    const completedMilestonesCount = milestones.filter((m) => m.status === 'completed').length;
    const completedTopicsCount = (units || this.load().units || []).reduce(
      (acc, u) => acc + (u.topics || []).filter((t) => t.status === 'completed').length,
      0
    );
    const completedCount = completedMilestonesCount + completedTopicsCount;

    const bossesDefeated = milestones.filter(
      (m) => m.status === 'completed' && (m.difficultyCategory === 'boss_fight' || m.difficultyCategory === 'final_raid')
    ).length;
    const coursesCount = courses.length;
    const totalXp = transactions.reduce((acc, t) => acc + t.amount, 0);
    const now = new Date().toISOString();

    return currentAchievements.map((ach) => {
      if (ach.unlockedAt) return ach;

      let shouldUnlock = false;
      if (ach.conditionType === 'total_milestones' && completedCount >= ach.targetValue) {
        shouldUnlock = true;
      } else if (ach.conditionType === 'bosses_defeated' && bossesDefeated >= ach.targetValue) {
        shouldUnlock = true;
      } else if (ach.conditionType === 'courses_added' && coursesCount >= ach.targetValue) {
        shouldUnlock = true;
      } else if (ach.conditionType === 'level_reached' && totalXp >= xpForLevel(ach.targetValue)) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        return { ...ach, unlockedAt: now };
      }
      return ach;
    });
  }
}

export const storage = new StorageService();
