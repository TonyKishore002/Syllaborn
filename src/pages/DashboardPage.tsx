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
        <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#121630] via-[#101428] to-[#0c0f1e] border-2 border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-center overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>THE CASUAL SEMESTER ADVENTURE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-fantasy font-black tracking-wide text-slate-100">
              Welcome to Syllaborn,{' '}
              <span className="bg-gradient-to-r from-purple-300 via-cyan-300 to-pink-300 bg-clip-text text-transparent">
                {profile?.displayName || 'Hero'}
              </span>
              !
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Organize your entire semester by playing a fun, easy-to-understand game.
              Defeat academic monsters, complete bite-sized study quests, and level up without stress.
            </p>

            {/* One Large Obvious Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-fantasy font-bold text-base shadow-xl shadow-purple-900/40 border border-purple-400/40 transition-all duration-200 active:scale-95 group"
              >
                <FileUp className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>Upload My Syllabus PDF</span>
                <ArrowRight className="w-5 h-5 text-purple-200 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* The 5-Step Game Loop Guide */}
        <div className="rounded-3xl p-6 sm:p-8 bg-[#101324] border border-purple-500/20 shadow-lg">
          <div className="text-center mb-6">
            <h3 className="font-fantasy font-bold text-lg text-slate-200">How the Game Works</h3>
            <p className="text-xs text-slate-400 mt-1">
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
            ].map((item, idx) => (
              <div
                key={item.step}
                className="p-4 rounded-2xl bg-[#14182e] border border-purple-500/15 flex flex-col items-center text-center relative group hover:border-purple-500/40 transition-all"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-[11px] font-mono text-purple-400 font-bold mb-1">
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
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-purple-950/50 via-[#101428] to-[#0c1424] border border-purple-500/25 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Semester Adventure Hub
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {profile?.universityName || 'Academic Realm'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-slate-100">
            Hey,{' '}
            <span className="bg-gradient-to-r from-purple-300 via-cyan-300 to-pink-300 bg-clip-text text-transparent">
              {profile?.displayName || 'Adventurer'}
            </span>
            !
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            "Ready to defeat one tiny academic monster today?"
          </p>
        </div>

        {/* Large Obvious Button: ▶ Continue Adventure */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleContinueAdventure}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-fantasy font-bold text-sm shadow-lg shadow-purple-900/40 border border-purple-400/40 transition-all duration-200 active:scale-95 group"
          >
            <Play className="w-4 h-4 fill-cyan-300 text-cyan-300 group-hover:scale-110 transition-transform" />
            <span>▶ Continue Adventure</span>
          </button>

          <Button variant="ghost" size="md" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-cyan-400" />
            <span>Upload Syllabus</span>
          </Button>
        </div>
      </div>

      {/* The 4 Main Game Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. YOUR LEVEL */}
        <Card className="p-6 rounded-3xl border-purple-500/20 bg-[#101324] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="font-fantasy font-bold text-base text-slate-100">Your Level</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/rewards')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View Rewards →
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-fantasy font-black text-xl text-white shadow-lg shadow-purple-900/30 shrink-0">
              {levelInfo.level}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-fantasy font-bold text-sm text-cyan-300 truncate">
                  {levelInfo.levelTitle}
                </span>
                <span className="font-mono text-xs text-slate-400 shrink-0">
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

          <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Total Academic XP: {levelInfo.totalXp}
            </span>
            <span className="text-[11px] text-purple-300 font-medium">
              {levelInfo.xpRequiredForNextLevel - levelInfo.xpInCurrentLevel} XP until Level{' '}
              {levelInfo.level + 1}
            </span>
          </div>
        </Card>

        {/* 4. NEXT BOSS */}
        <Card className="p-6 rounded-3xl border-purple-500/20 bg-[#101324] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="font-fantasy font-bold text-base text-slate-100">Next Boss</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/bosses')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              All Bosses →
            </button>
          </div>

          {nextBoss ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-fantasy font-bold text-base text-slate-100">
                    {nextBoss.boss.title}
                  </h3>
                  <p className="text-xs text-purple-300 font-medium">
                    {nextBoss.course?.courseName || 'Course Exam'}
                  </p>
                </div>
                <Badge variant={nextBoss.isFinal ? 'rose' : 'purple'}>
                  {nextBoss.boss.dueDate ? nextBoss.boss.dueDate : 'Date TBA'}
                </Badge>
              </div>

              {/* Boss Health Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 font-medium">
                    Boss HP: {nextBoss.currentHp} / {nextBoss.maxHp}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300">
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

              <p className="text-[11px] text-slate-400 leading-snug">
                Complete your preparation quests to reduce the boss's HP.
              </p>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => navigate('/bosses')}
                >
                  <Swords className="w-4 h-4 mr-1.5" />
                  <span>Prepare for Boss</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#14182e] border border-purple-500/15 text-center text-xs text-slate-400 space-y-2">
              <p className="text-slate-300 font-medium">No boss encounters scheduled right now.</p>
              <p className="text-[11px] text-slate-500">
                Major midterm and final exams from your syllabi will appear here as boss fights.
              </p>
            </div>
          )}
        </Card>

        {/* 2. TODAY'S QUESTS */}
        <Card className="p-6 rounded-3xl border-purple-500/20 bg-[#101324] space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-cyan-400" />
              <h2 className="font-fantasy font-bold text-base text-slate-100">Today's Quests</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {todaysQuests.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quests')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              All Quests →
            </button>
          </div>

          {todaysQuests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#14182e] border border-purple-500/15 text-center text-xs text-slate-400 space-y-1">
              <p className="text-emerald-400 font-bold">All quests cleared!</p>
              <p className="text-[11px] text-slate-500">
                Take a breather or upload another syllabus to continue your adventure.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todaysQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="p-3.5 rounded-2xl bg-[#14182e] hover:bg-[#181d38] border border-purple-500/15 hover:border-purple-500/35 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                        style={{
                          backgroundColor: `${quest.courseColor}20`,
                          color: quest.courseColor,
                          border: `1px solid ${quest.courseColor}40`,
                        }}
                      >
                        {quest.courseCode}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {quest.timeEstimate}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                          quest.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : quest.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {quest.difficulty}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                      {quest.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {quest.description}
                    </p>
                  </div>

                  {/* Play Quest Action */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      +{quest.xpReward} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayQuest(quest)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-fantasy font-semibold text-xs shadow-md shadow-purple-900/30 border border-purple-400/30 transition-all active:scale-95 group"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 3. YOUR ADVENTURE (Courses & Progress) */}
        <Card className="p-6 rounded-3xl border-purple-500/20 bg-[#101324] space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h2 className="font-fantasy font-bold text-base text-slate-100">Your Adventure</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {courses.length} Courses
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
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
                  className="p-3.5 rounded-2xl bg-[#14182e] hover:bg-[#181d38] border border-purple-500/15 hover:border-purple-500/35 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: course.color || '#8b5cf6' }}
                      />
                      <span className="font-fantasy font-bold text-xs sm:text-sm text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                        {course.courseName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-cyan-300 font-bold shrink-0">
                      {percent}%
                    </span>
                  </div>

                  <ProgressBar value={percent} size="sm" variant="cyan" />

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                    <span>{course.courseCode}</span>
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
      <div className="rounded-2xl p-4 bg-[#0d0f1e] border border-purple-500/15 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-center text-xs text-slate-400">
        <span className="text-purple-300 font-fantasy font-semibold">The Semester Loop:</span>
        <span className="flex items-center gap-1.5 font-medium">📄 Upload Syllabus</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-medium">⚔️ Get Quests</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-medium">🎯 Complete Quests</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-medium">⭐ Earn XP</span>
        <span>→</span>
        <span className="flex items-center gap-1.5 font-medium">👑 Level Up</span>
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
