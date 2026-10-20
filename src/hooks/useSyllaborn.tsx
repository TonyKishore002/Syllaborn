import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  QuestGameConfig,
} from '../types';
import { calculatePlayerLevel, PlayerLevelInfo } from '../lib/gamification';
import { storage, STORAGE_CHANGE_EVENT } from '../lib/storage';

interface SyllabornContextValue {
  data: SyllabornDataDocument;
  profile: PlayerProfile | null;
  courses: Course[];
  units: CourseUnit[];
  milestones: Milestone[];
  activities: ActivityEvent[];
  achievements: Achievement[];
  settings: ApplicationSettings;
  levelInfo: PlayerLevelInfo;
  saveProfile: (profile: PlayerProfile) => void;
  saveCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  saveUnits: (units: CourseUnit[]) => void;
  toggleTopic: (id: string) => { topic: CourseTopic; xpAwarded: number } | null;
  saveMilestone: (milestone: Milestone) => void;
  deleteMilestone: (id: string) => void;
  toggleMilestone: (id: string) => { milestone: Milestone; xpAwarded: number } | null;
  completeQuestWithGame: (
    questId: string,
    kind: 'topic' | 'milestone',
    details?: { gameMode?: string; score?: number }
  ) => { success: boolean; xpAwarded: number; alreadyCompleted: boolean; title: string } | null;
  saveTopicGameConfig: (topicId: string, config: QuestGameConfig) => void;
  saveMilestoneGameConfig: (milestoneId: string, config: QuestGameConfig) => void;
  saveGradingCategories: (categories: GradingCategory[]) => void;
  saveDocument: (doc: SyllabusDocument) => void;
  saveJob: (job: ProcessingJob) => void;
  logActivity: (event: Omit<ActivityEvent, 'id' | 'createdAt'>) => void;
  updateSettings: (settings: Partial<ApplicationSettings>) => void;
  resetData: () => void;
  refresh: () => void;
}

const SyllabornContext = createContext<SyllabornContextValue | null>(null);

export const SyllabornProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SyllabornDataDocument>(() => storage.load());

  const refresh = useCallback(() => {
    setData(storage.load());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setData(storage.load());
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    };
  }, []);

  const totalXp = useMemo(() => {
    return data.xpTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [data.xpTransactions]);

  const levelInfo = useMemo(() => {
    return calculatePlayerLevel(totalXp);
  }, [totalXp]);

  const saveProfile = useCallback((profile: PlayerProfile) => {
    storage.saveProfile(profile);
  }, []);

  const saveCourse = useCallback((course: Course) => {
    storage.saveCourse(course);
  }, []);

  const deleteCourse = useCallback((id: string) => {
    storage.deleteCourse(id);
  }, []);

  const saveUnits = useCallback((units: CourseUnit[]) => {
    storage.saveUnits(units);
  }, []);

  const toggleTopic = useCallback((id: string) => {
    return storage.toggleTopicStatus(id);
  }, []);

  const saveMilestone = useCallback((milestone: Milestone) => {
    storage.saveMilestone(milestone);
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    storage.deleteMilestone(id);
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    return storage.toggleMilestoneStatus(id);
  }, []);

  const completeQuestWithGame = useCallback(
    (
      questId: string,
      kind: 'topic' | 'milestone',
      details?: { gameMode?: string; score?: number }
    ) => {
      return storage.completeQuestWithGame(questId, kind, details);
    },
    []
  );

  const saveTopicGameConfig = useCallback((topicId: string, config: QuestGameConfig) => {
    storage.saveTopicGameConfig(topicId, config);
  }, []);

  const saveMilestoneGameConfig = useCallback((milestoneId: string, config: QuestGameConfig) => {
    storage.saveMilestoneGameConfig(milestoneId, config);
  }, []);

  const saveGradingCategories = useCallback((categories: GradingCategory[]) => {
    storage.saveGradingCategories(categories);
  }, []);

  const saveDocument = useCallback((doc: SyllabusDocument) => {
    storage.saveDocument(doc);
  }, []);

  const saveJob = useCallback((job: ProcessingJob) => {
    storage.saveJob(job);
  }, []);

  const logActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'createdAt'>) => {
    storage.logActivity(event);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ApplicationSettings>) => {
    storage.updateSettings(newSettings);
  }, []);

  const resetData = useCallback(() => {
    storage.reset();
  }, []);

  const value = useMemo(
    () => ({
      data,
      profile: data.profile,
      courses: data.courses,
      units: data.units || [],
      milestones: data.milestones,
      activities: data.activities,
      achievements: data.achievements,
      settings: data.settings,
      levelInfo,
      saveProfile,
      saveCourse,
      deleteCourse,
      saveUnits,
      toggleTopic,
      saveMilestone,
      deleteMilestone,
      toggleMilestone,
      completeQuestWithGame,
      saveTopicGameConfig,
      saveMilestoneGameConfig,
      saveGradingCategories,
      saveDocument,
      saveJob,
      logActivity,
      updateSettings,
      resetData,
      refresh,
    }),
    [
      data,
      levelInfo,
      saveProfile,
      saveCourse,
      deleteCourse,
      saveUnits,
      toggleTopic,
      saveMilestone,
      deleteMilestone,
      toggleMilestone,
      completeQuestWithGame,
      saveTopicGameConfig,
      saveMilestoneGameConfig,
      saveGradingCategories,
      saveDocument,
      saveJob,
      logActivity,
      updateSettings,
      resetData,
      refresh,
    ]
  );
  return <SyllabornContext.Provider value={value}>{children}</SyllabornContext.Provider>;
};

export function useSyllaborn() {
  const context = useContext(SyllabornContext);
  if (!context) {
    throw new Error('useSyllaborn must be used within a SyllabornProvider');
  }
  return context;
}
