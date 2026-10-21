import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Swords,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileUp,
  ArrowRight,
  Play,
  ShieldAlert,
  Flame,
  Check,
  Gamepad2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { PlayQuestModal, PlayableQuestItem } from '../components/game/PlayQuestModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Milestone, CourseTopic } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    courses,
    milestones,
    units,
    levelInfo,
    toggleMilestone,
    toggleTopic,
  } = useSyllaborn();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedQuestForPlay, setSelectedQuestForPlay] = useState<PlayableQuestItem | null>(null);

  // Compile all pending quests (combining milestones and unit topics)
  const pendingMilestones = useMemo(
    () => milestones.filter((m) => m.status === 'pending'),
    [milestones]
  );

  const pendingTopics = useMemo(() => {
    const list: { topic: CourseTopic; courseId: string; locationName: string }[] = [];
    units.forEach((u) => {
      u.topics.forEach((t) => {
        if (t.status === 'pending') {
          list.push({ topic: t, courseId: u.courseId, locationName: u.locationName });
        }
      });
    });
    return list;
  }, [units]);

  // Unified "Today's Quests" list (up to 4 immediate actionable items)
  const todaysQuests = useMemo(() => {
    interface UnifiedQuest {
      id: string;
      kind: 'milestone' | 'topic';
      title: string;
      description: string;
      courseId: string;
      courseName: string;
      courseCode: string;
      courseColor: string;
      timeEstimate: string;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      xpReward: number;
      dueDate?: string | null;
      status: 'pending' | 'completed';
    }

    const items: UnifiedQuest[] = [];

    // Prioritize upcoming due milestones
    const sortedMilestones = [...pendingMilestones].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    sortedMilestones.slice(0, 3).forEach((m) => {
      const course = courses.find((c) => c.id === m.courseId);
      let diff: 'Easy' | 'Medium' | 'Hard' = 'Easy';
      if (m.difficultyCategory === 'final_raid' || m.difficultyCategory === 'boss_fight') {
        diff = 'Hard';
      } else if (m.difficultyCategory === 'elite_encounter' || (m.weightPercent && m.weightPercent >= 10)) {
        diff = 'Medium';
      }

      items.push({
        id: m.id,
        kind: 'milestone',
        title: m.title,
        description: m.description || 'Study milestone from your course syllabus.',
        courseId: m.courseId,
        courseName: course?.courseName || 'Course',
        courseCode: course?.courseCode || 'COURSE',
        courseColor: course?.color || '#8b5cf6',
        timeEstimate: m.milestoneType === 'reading' ? '20 mins' : m.milestoneType === 'quiz' ? '30 mins' : '45 mins',
        difficulty: diff,
        xpReward: m.xpReward || 50,
        dueDate: m.dueDate,
        status: m.status,
      });
    });

    // Add unit topics if space remains
    pendingTopics.forEach(({ topic, courseId }) => {
      if (items.length >= 4) return;
      const course = courses.find((c) => c.id === courseId);
      items.push({
        id: topic.id,
        kind: 'topic',
        title: topic.questTitle || topic.title,
        description: topic.description || `Unit topic quest for ${course?.courseName || 'your course'}.`,
        courseId,
        courseName: course?.courseName || 'Course',
        courseCode: course?.courseCode || 'COURSE',
        courseColor: course?.color || '#06b6d4',
        timeEstimate: '25 mins',
        difficulty: 'Easy',
        xpReward: topic.xpReward || 25,
        status: topic.status,
      });
    });

    return items;
  }, [pendingMilestones, pendingTopics, courses]);

  // Next Boss identification
  const nextBoss = useMemo(() => {
    const bossMilestones = milestones.filter(
      (m) =>
        m.status === 'pending' &&
        (m.difficultyCategory === 'boss_fight' ||
          m.difficultyCategory === 'final_raid' ||
          (m.weightPercent && m.weightPercent >= 15))
    );

    if (bossMilestones.length === 0) return null;

    // Sort by earliest date first
    bossMilestones.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    const boss = bossMilestones[0];
    const course = courses.find((c) => c.id === boss.courseId);

    // Calculate max HP from syllabus weight or default
    const maxHp = boss.weightPercent ? Math.round(boss.weightPercent * 10) : 200;

    // Preparation progress based on completed items for this course
    const courseMilestones = milestones.filter((m) => m.courseId === boss.courseId);
    const completedCourseMilestones = courseMilestones.filter((m) => m.status === 'completed');
    const prepRatio =
      courseMilestones.length > 0 ? completedCourseMilestones.length / courseMilestones.length : 0;
    const currentHp = Math.max(0, Math.round(maxHp * (1 - prepRatio)));

    return {
      boss,
      course,
      maxHp,
      currentHp,
      prepPercent: Math.round(prepRatio * 100),
      isFinal: boss.difficultyCategory === 'final_raid',
    };
  }, [milestones, courses]);

  // Launch interactive mini-game for quest
  const handlePlayQuest = (quest: {
    id: string;
    kind: 'milestone' | 'topic';
    title: string;
    description?: string;
    courseId: string;
    courseName?: string;
    courseCode?: string;
    xpReward: number;
    status: 'pending' | 'completed';
  }) => {
    let gameConfig = undefined;
    if (quest.kind === 'milestone') {
      const m = milestones.find((item) => item.id === quest.id);
      gameConfig = m?.gameConfig;
    } else {
      for (const u of units) {
        const t = u.topics.find((item) => item.id === quest.id);
        if (t) {
          gameConfig = t.gameConfig;
          break;
        }
      }
    }

    setSelectedQuestForPlay({
      id: quest.id,
      kind: quest.kind,
      title: quest.title,
      description: quest.description,
      courseId: quest.courseId,
      courseCode: quest.courseCode,
      courseName: quest.courseName,
      xpReward: quest.xpReward,
      status: quest.status,
      gameConfig,
    });
    setIsPlayModalOpen(true);
  };

  // Continue Adventure primary action
  const handleContinueAdventure = () => {
    if (courses.length === 0) {
      setIsUploadModalOpen(true);
      return;
    }
    if (todaysQuests.length > 0) {
      navigate('/quests');
      return;
    }
    if (nextBoss) {
      navigate('/bosses');
      return;
    }
    navigate('/courses');
  };

  // -------------------------------------------------------------
  // NEW USER ONBOARDING STATE (0 Courses)
  // -------------------------------------------------------------
  if (courses.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-4">
        {/* Casual Adventure Welcome Hero */}
        <div className="relative rounded-3xl p-8 sm:p-12 bg-[#0E1322] border border-white/[0.04] shadow-neu-raised-lg text-center overflow-hidden backdrop-blur-md">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#070b14] text-indigo-300 border border-indigo-500/30 shadow-neu-inset-sm text-xs font-black font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>THE CASUAL SEMESTER ADVENTURE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-fantasy font-black tracking-wide text-white">
              Welcome to Syllaborn,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">
                {profile?.displayName || 'Hero'}
              </span>
              !
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Organize your entire semester by playing a fun, easy-to-understand game.
              Defeat academic monsters, complete bite-sized study quests, and level up without stress.
            </p>

            {/* One Large Obvious Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-fantasy font-black text-base border border-indigo-400/30 shadow-neu-raised hover:shadow-neu-raised-lg active:shadow-neu-inset active:translate-y-0.5 transition-all group"
              >
                <FileUp className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Upload My Syllabus PDF</span>
                <ArrowRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* The 5-Step Game Loop Guide */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#0E1322] border border-white/[0.04] shadow-neu-raised">
          <div className="text-center mb-6">
            <h3 className="font-fantasy font-black text-lg text-slate-100">How the Game Works</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Your semester loop in 5 easy steps. No complicated rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { step: '1', title: 'Upload Syllabus', desc: 'Drop your course PDF', icon: '📄' },
              { step: '2', title: 'Get Quests', desc: 'Topics become study tasks', icon: '⚔️' },
              { step: '3', title: 'Complete Quests', desc: 'Finish at your own pace', icon: '🎯' },
              { step: '4', title: 'Earn XP', desc: 'Gain experience points', icon: '⭐' },
              { step: '5', title: 'Level Up', desc: 'Vanquish the semester', icon: '👑' },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm flex flex-col items-center text-center relative group hover:border-indigo-500/30 transition-all"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-[11px] font-mono text-sky-400 font-black mb-1">
                  STEP {item.step}
                </span>
                <span className="text-xs font-bold text-slate-100 mb-0.5">{item.title}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Syllabus Upload Modal */}
        <SyllabusUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      </div>
    );
  }


  // -------------------------------------------------------------
  // ACTIVE ADVENTURE DASHBOARD (Show Only What Matters)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Greeting + Continue Adventure Big Button */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#101524] to-[#0a0d17] border border-white/[0.05] shadow-neu-raised flex flex-col md:flex-row md:items-center justify-between gap-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-widest">
              Semester Adventure Hub
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-bold font-mono">
              {profile?.universityName || 'Academic Realm'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-white">
            Hey,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
              {profile?.displayName || 'Adventurer'}
            </span>
            !
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
            "Ready to defeat one tiny academic monster today?"
          </p>
        </div>

        {/* Large Tactile Button: ▶ Continue Adventure (Calm, Soft Color) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleContinueAdventure}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#5357c8] via-[#4b51bf] to-[#397db8] hover:from-[#5c61d6] hover:to-[#4189c7] text-white font-fantasy font-black text-sm border border-indigo-400/30 shadow-neu-raised hover:shadow-neu-raised-lg active:shadow-neu-inset active:translate-y-0.5 transition-all group"
          >
            <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
            <span>▶ Continue Adventure</span>
          </button>

          <Button variant="secondary" size="md" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-sky-300" />
            <span>Upload Syllabus</span>
          </Button>
        </div>
      </div>

      {/* The 4 Main Game Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. YOUR LEVEL */}
        <Card className="p-6 rounded-3xl border border-white/[0.04] bg-[#0E1322] shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="font-fantasy font-black text-base text-slate-100">Your Level</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/rewards')}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold font-mono underline"
            >
              View Rewards →
            </button>
          </div>

          <div className="flex items-center gap-5">
            {/* Neumorphic Extruded Dial with Sunken Concentric Moat (like reference image) */}
            <div className="w-20 h-20 rounded-full neu-dial-moat p-1.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full neu-dial flex items-center justify-center font-fantasy font-black text-2xl text-amber-200 border border-white/[0.12] shadow-neu-raised">
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{levelInfo.level}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-fantasy font-bold text-sm text-sky-400 truncate">
                  {levelInfo.levelTitle}
                </span>
                <span className="font-mono text-xs text-slate-300 font-bold shrink-0">
                  {levelInfo.xpInCurrentLevel} / {levelInfo.xpRequiredForNextLevel} XP
                </span>
              </div>
              <ProgressBar
                value={levelInfo.xpInCurrentLevel}
                max={levelInfo.xpRequiredForNextLevel}
                size="md"
                variant="xp"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#060810] border border-white/[0.04] shadow-neu-inset flex items-center justify-between text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 font-mono font-bold">
              <Flame className="w-3.5 h-3.5 text-indigo-400" />
              Total Academic XP: {levelInfo.totalXp}
            </span>
            <span className="text-[11px] text-amber-300 font-bold font-mono">
              {levelInfo.xpRequiredForNextLevel - levelInfo.xpInCurrentLevel} XP until Level{' '}
              {levelInfo.level + 1}
            </span>
          </div>
        </Card>

        {/* 4. NEXT BOSS */}
        <Card className="p-6 rounded-3xl border border-white/[0.04] bg-[#0E1322] shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="font-fantasy font-black text-base text-slate-100">Next Boss</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/bosses')}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold font-mono underline"
            >
              All Bosses →
            </button>
          </div>

          {nextBoss ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-fantasy font-black text-base text-slate-100">
                    {nextBoss.boss.title}
                  </h3>
                  <p className="text-xs text-sky-400 font-bold font-mono">
                    {nextBoss.course?.courseName || 'Course Exam'}
                  </p>
                </div>
                <Badge variant={nextBoss.isFinal ? 'rose' : 'purple'}>
                  {nextBoss.boss.dueDate ? nextBoss.boss.dueDate : 'Date TBA'}
                </Badge>
              </div>

              {/* Boss Health Bar - Sunken Channel */}
              <div className="p-4 rounded-2xl bg-[#060810] border border-white/[0.04] shadow-neu-inset space-y-2">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className="text-rose-400">
                    Boss HP: {nextBoss.currentHp} / {nextBoss.maxHp}
                  </span>
                  <span className="text-[11px] text-sky-400">
                    Preparation: {nextBoss.prepPercent}%
                  </span>
                </div>
                <ProgressBar
                  value={nextBoss.maxHp - nextBoss.currentHp}
                  max={nextBoss.maxHp}
                  size="md"
                  variant="boss_hp"
                />
              </div>

              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                Complete your preparation quests to reduce the boss's HP.
              </p>

              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center font-black"
                  onClick={() => navigate('/bosses')}
                >
                  <Swords className="w-4 h-4 mr-1.5" />
                  <span>Prepare for Boss</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm text-center text-xs text-slate-300 space-y-2">
              <p className="text-slate-100 font-bold">No boss encounters scheduled right now.</p>
              <p className="text-[11px] text-slate-400">
                Major midterm and final exams from your syllabi will appear here as boss fights.
              </p>
            </div>
          )}
        </Card>

        {/* 2. TODAY'S QUESTS */}
        <Card className="p-6 rounded-3xl border border-white/[0.04] bg-[#0E1322] shadow-neu-raised space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-sky-400" />
              <h2 className="font-fantasy font-black text-base text-slate-100">Today's Quests</h2>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#070b14] text-sky-300 border border-sky-500/30 shadow-neu-inset-sm">
                {todaysQuests.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quests')}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold font-mono underline"
            >
              All Quests →
            </button>
          </div>

          {todaysQuests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm text-center text-xs text-slate-300 space-y-1">
              <p className="text-sky-400 font-bold">All quests cleared!</p>
              <p className="text-[11px] text-slate-400">
                Take a breather or upload another syllabus to continue your adventure.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="p-3.5 rounded-2xl bg-[#0E1322] hover:bg-[#12182a] border border-white/[0.03] shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full border border-white/10 shadow-neu-raised-sm"
                        style={{
                          backgroundColor: quest.courseColor,
                          color: '#ffffff',
                        }}
                      >
                        {quest.courseCode}
                      </span>
                      <span className="text-[10px] text-slate-300 flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {quest.timeEstimate}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                          quest.difficulty === 'Easy'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-neu-inset-sm'
                            : quest.difficulty === 'Medium'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-neu-inset-sm'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-neu-inset-sm'
                        }`}
                      >
                        {quest.difficulty}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-sky-300 transition-colors">
                      {quest.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {quest.description}
                    </p>
                  </div>

                  {/* Play Quest Action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono font-black text-amber-300">
                      +{quest.xpReward} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayQuest(quest)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#5357c8] to-[#397db8] hover:from-[#5c61d6] hover:to-[#4189c7] text-white font-fantasy font-black text-xs border border-indigo-400/25 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all active:translate-y-0.5 group"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 3. YOUR ADVENTURE (Courses & Progress) */}
        <Card className="p-6 rounded-3xl border border-white/[0.04] bg-[#0E1322] shadow-neu-raised space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h2 className="font-fantasy font-black text-base text-slate-100">Your Adventure</h2>
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#070b14] text-indigo-300 border border-indigo-500/30 shadow-neu-inset-sm">
                {courses.length} Courses
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="text-xs text-indigo-400 hover:text-sky-300 font-bold font-mono underline"
            >
              All Courses →
            </button>
          </div>

          <div className="space-y-3">
            {courses.slice(0, 3).map((course) => {
              const courseMilestones = milestones.filter((m) => m.courseId === course.id);
              const completedMilestones = courseMilestones.filter((m) => m.status === 'completed');
              const percent =
                courseMilestones.length > 0
                  ? Math.round((completedMilestones.length / courseMilestones.length) * 100)
                  : 0;

              return (
                <div
                  key={course.id}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="p-3.5 rounded-2xl bg-[#0E1322] hover:bg-[#12182a] border border-white/[0.03] shadow-neu-raised-sm hover:shadow-neu-raised transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-neu-raised-sm"
                        style={{ backgroundColor: course.color || '#6366f1' }}
                      />
                      <span className="font-fantasy font-bold text-xs sm:text-sm text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                        {course.courseName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-sky-400 font-black shrink-0">
                      {percent}%
                    </span>
                  </div>

                  <ProgressBar value={percent} size="sm" variant="cyan" />

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-0.5">
                    <span className="font-bold text-slate-300">{course.courseCode}</span>
                    <span>
                      {completedMilestones.length} / {courseMilestones.length} Quests Conquered
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Visual Game Loop Footer Guide */}
      <div className="rounded-2xl p-4 bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-center text-xs text-slate-300 font-bold font-mono">
        <span className="text-indigo-300 font-fantasy font-black uppercase">The Semester Loop:</span>
        <span className="flex items-center gap-1.5 font-bold">📄 Upload Syllabus</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-bold">⚔️ Get Quests</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-bold">🎯 Complete Quests</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-bold">⭐ Earn XP</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-bold">👑 Level Up</span>
      </div>

      {/* Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Interactive Quest Play Modal */}
      <PlayQuestModal
        isOpen={isPlayModalOpen}
        onClose={() => {
          setIsPlayModalOpen(false);
          setSelectedQuestForPlay(null);
        }}
        quest={selectedQuestForPlay}
      />
    </div>
  );
};

