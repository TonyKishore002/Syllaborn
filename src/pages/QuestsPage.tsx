import React, { useState, useMemo } from 'react';
import {
  Swords,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  FileUp,
  Sparkles,
  Search,
  BookOpen,
  Check,
  Gamepad2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { MilestoneModal } from '../components/quests/MilestoneModal';
import { PlayQuestModal, PlayableQuestItem } from '../components/game/PlayQuestModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { CourseTopic, Milestone } from '../types';

interface DisplayQuest {
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

export const QuestsPage: React.FC = () => {
  const {
    courses,
    milestones,
    units,
    toggleMilestone,
    toggleTopic,
  } = useSyllaborn();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedMilestoneForEdit, setSelectedMilestoneForEdit] = useState<Milestone | null>(null);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedQuestForPlay, setSelectedQuestForPlay] = useState<PlayableQuestItem | null>(null);

  // Combine Milestones and Unit Topics into clean Game Quests
  const allQuests = useMemo(() => {
    const list: DisplayQuest[] = [];

    // Add Course Milestones
    milestones.forEach((m) => {
      const course = courses.find((c) => c.id === m.courseId);
      let diff: 'Easy' | 'Medium' | 'Hard' = 'Easy';
      if (m.difficultyCategory === 'final_raid' || m.difficultyCategory === 'boss_fight') {
        diff = 'Hard';
      } else if (
        m.difficultyCategory === 'elite_encounter' ||
        (m.weightPercent && m.weightPercent >= 10)
      ) {
        diff = 'Medium';
      }

      list.push({
        id: m.id,
        kind: 'milestone',
        title: m.title,
        description: m.description || 'Study milestone from course syllabus.',
        courseId: m.courseId,
        courseName: course?.courseName || 'Course',
        courseCode: course?.courseCode || 'COURSE',
        courseColor: course?.color || '#8b5cf6',
        timeEstimate:
          m.milestoneType === 'reading'
            ? '25 mins'
            : m.milestoneType === 'quiz'
            ? '35 mins'
            : m.milestoneType === 'project'
            ? '90 mins'
            : '45 mins',
        difficulty: diff,
        xpReward: m.xpReward || 50,
        dueDate: m.dueDate,
        status: m.status,
      });
    });

    // Add Unit Topics
    units.forEach((u) => {
      const course = courses.find((c) => c.id === u.courseId);
      u.topics.forEach((t) => {
        list.push({
          id: t.id,
          kind: 'topic',
          title: t.questTitle || t.title,
          description: t.description || `Study task for ${u.locationName}.`,
          courseId: u.courseId,
          courseName: course?.courseName || 'Course',
          courseCode: course?.courseCode || 'COURSE',
          courseColor: course?.color || '#06b6d4',
          timeEstimate: '25 mins',
          difficulty: 'Easy',
          xpReward: t.xpReward || 25,
          status: t.status,
        });
      });
    });

    return list;
  }, [milestones, units, courses]);

  // Filtered by status, course, search
  const filteredQuests = useMemo(() => {
    return allQuests.filter((q) => {
      const matchesStatus =
        activeTab === 'active' ? q.status === 'pending' : q.status === 'completed';
      const matchesCourse =
        selectedCourseId === 'all' || q.courseId === selectedCourseId;
      const matchesSearch =
        !searchQuery ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.courseName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesCourse && matchesSearch;
    });
  }, [allQuests, activeTab, selectedCourseId, searchQuery]);

  // Group filtered quests by Course
  const questsByCourse = useMemo(() => {
    const map = new Map<string, { courseName: string; courseCode: string; color: string; quests: DisplayQuest[] }>();

    filteredQuests.forEach((q) => {
      if (!map.has(q.courseId)) {
        map.set(q.courseId, {
          courseName: q.courseName,
          courseCode: q.courseCode,
          color: q.courseColor,
          quests: [],
        });
      }
      map.get(q.courseId)!.quests.push(q);
    });

    return Array.from(map.entries());
  }, [filteredQuests]);

  const activeCount = useMemo(
    () => allQuests.filter((q) => q.status === 'pending').length,
    [allQuests]
  );
  const completedCount = useMemo(
    () => allQuests.filter((q) => q.status === 'completed').length,
    [allQuests]
  );

  const handlePlayQuest = (quest: DisplayQuest) => {
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-slate-100">
              My Quests
            </h1>
            <span className="text-xs font-mono font-black px-3 py-0.5 rounded-full bg-[#070b14] text-sky-300 border border-sky-500/30 shadow-neu-inset-sm">
              {activeCount} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete study tasks to earn XP and level up your semester adventure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-white" />
            <span>Upload Syllabus</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedMilestoneForEdit(null);
              setIsMilestoneModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5 text-sky-300" />
            <span>New Quest</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Controls - Sunken Pill Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
        {/* Status Tabs in Inset Slot */}
        <div className="p-1.5 rounded-2xl bg-[#060810] border border-white/[0.04] shadow-neu-inset flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-fantasy transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-br from-[#161e34] to-[#0c101c] text-white border border-white/[0.08] shadow-neu-raised'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Quests ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-fantasy transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-br from-[#161e34] to-[#0c101c] text-emerald-300 border border-emerald-400/30 shadow-neu-raised'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Course Filter & Search */}
        <div className="flex items-center gap-2.5">
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-[#060810] border border-white/[0.04] shadow-neu-inset text-xs font-bold text-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.courseName}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quests..."
              className="bg-[#060810] border border-white/[0.04] shadow-neu-inset text-xs font-bold text-slate-200 rounded-2xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 w-36 sm:w-52 placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Quests Display */}
      {courses.length === 0 ? (
        <EmptyState
          icon={<Swords className="w-8 h-8 text-sky-400" />}
          title="No Quests Yet"
          description="Upload your course syllabus PDF to automatically generate study quests and turn your topics into adventure tasks."
          actionLabel="Upload Syllabus PDF"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : filteredQuests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0E1322] border border-white/[0.04] shadow-neu-raised space-y-2">
          <p className="text-slate-200 font-fantasy text-sm font-black">
            {activeTab === 'active'
              ? 'No active quests found!'
              : 'No completed quests in this view.'}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {activeTab === 'active'
              ? 'Great job! You have cleared all pending quests in this filter.'
              : 'Complete active quests to populate your conquest history.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questsByCourse.map(([courseId, group]) => (
            <div key={courseId} className="space-y-3">
              {/* Course Group Header */}
              <div className="flex items-center gap-2.5 px-1">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-neu-raised-sm"
                  style={{ backgroundColor: group.color }}
                />
                <h3 className="font-fantasy font-black text-sm text-slate-200">
                  {group.courseName}
                </h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  ({group.courseCode})
                </span>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-[#070b14] text-indigo-300 border border-indigo-500/30 shadow-neu-inset-sm ml-auto">
                  {group.quests.length} {group.quests.length === 1 ? 'quest' : 'quests'}
                </span>
              </div>

              {/* Grid of Quest Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.quests.map((quest) => (
                  <Card
                    key={quest.id}
                    className="p-5 rounded-3xl bg-[#0E1322] hover:bg-[#12182a] border border-white/[0.04] shadow-neu-raised hover:shadow-neu-raised-lg transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border border-white/10 shadow-neu-raised-sm"
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

                        <span className="text-xs font-mono font-black text-amber-300 shrink-0">
                          +{quest.xpReward} XP
                        </span>
                      </div>

                      {/* Quest Title & Description */}
                      <h4 className="font-fantasy font-black text-sm text-slate-100 group-hover:text-sky-300 transition-colors">
                        {quest.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {quest.description}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {quest.dueDate ? `Due: ${quest.dueDate}` : 'Self-paced'}
                      </span>

                      {quest.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handlePlayQuest(quest)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#5357c8] to-[#397db8] hover:from-[#5c61d6] hover:to-[#4189c7] text-white font-fantasy font-black text-xs border border-indigo-400/25 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all active:translate-y-0.5 group"
                        >
                          <Gamepad2 className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                          <span>Play Quest</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePlayQuest(quest)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#0E1322] hover:bg-[#131a2e] text-slate-200 text-xs font-bold font-fantasy border border-white/[0.04] shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all active:translate-y-0.5"
                          title="Replay in practice mode (0 duplicate XP)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-200" />
                          <span>Replay Quest</span>
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Manual Milestone Quest Creation Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestoneToEdit={selectedMilestoneForEdit}
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
