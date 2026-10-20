import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  FileUp,
  Trash2,
  Edit,
  Swords,
  Sparkles,
  CheckCircle2,
  Percent,
  FileText,
  Gamepad2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MilestoneModal } from '../components/quests/MilestoneModal';
import { CourseModal } from '../components/courses/CourseModal';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { PlayQuestModal, PlayableQuestItem } from '../components/game/PlayQuestModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Milestone } from '../types';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data, courses, milestones, toggleMilestone, deleteCourse } = useSyllaborn();

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [selectedQuestForPlay, setSelectedQuestForPlay] = useState<PlayableQuestItem | null>(null);

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  const courseMilestones = useMemo(
    () => milestones.filter((m) => m.courseId === courseId),
    [milestones, courseId]
  );

  const gradingCategories = useMemo(
    () => data.gradingCategories.filter((g) => g.courseId === courseId),
    [data.gradingCategories, courseId]
  );

  const syllabusDocs = useMemo(
    () => data.documents.filter((d) => d.courseId === courseId),
    [data.documents, courseId]
  );

  // Group milestones: routine quests vs boss encounters
  const routineQuests = useMemo(
    () =>
      courseMilestones.filter(
        (m) => m.difficultyCategory !== 'boss_fight' && m.difficultyCategory !== 'final_raid'
      ),
    [courseMilestones]
  );

  const bossEncounters = useMemo(
    () =>
      courseMilestones.filter(
        (m) => m.difficultyCategory === 'boss_fight' || m.difficultyCategory === 'final_raid'
      ),
    [courseMilestones]
  );

  const completedCount = courseMilestones.filter((m) => m.status === 'completed').length;
  const progressPercent =
    courseMilestones.length > 0
      ? Math.round((completedCount / courseMilestones.length) * 100)
      : 0;

  const totalGradingWeight = useMemo(() => {
    return gradingCategories.reduce((acc, c) => acc + c.weightPercent, 0);
  }, [gradingCategories]);

  if (!course) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-fantasy text-slate-200">Course Realm Not Found</h2>
        <p className="text-xs text-slate-400">
          This course may have been removed or does not exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Return to Courses
        </Button>
      </div>
    );
  }

  const handlePlayMilestone = (e: React.MouseEvent, milestone: Milestone, isBoss = false) => {
    e.stopPropagation();
    setSelectedQuestForPlay({
      id: milestone.id,
      kind: 'milestone',
      title: milestone.title,
      description: milestone.description || undefined,
      courseId: milestone.courseId,
      courseCode: course?.courseCode,
      courseName: course?.courseName,
      xpReward: milestone.xpReward,
      status: milestone.status,
      gameConfig: milestone.gameConfig,
      bossHp: milestone.bossHp,
      weightPercent: milestone.weightPercent,
      isBoss,
    });
    setIsPlayModalOpen(true);
  };

  const handleDeleteCourse = () => {
    deleteCourse(course.id);
    navigate('/courses');
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsCourseModalOpen(true)}>
            <Edit className="w-3.5 h-3.5 mr-1" />
            <span>Edit Course</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <FileUp className="w-3.5 h-3.5 mr-1 text-cyan-300" />
            <span>Upload Syllabus</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteConfirmOpen(true)}
            title="Delete Course Realm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Course Realm Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141830] via-[#101324] to-[#0a0d18] border border-purple-500/25 shadow-2xl relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] opacity-40 pointer-events-none"
          style={{ backgroundColor: course.color }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-md"
                style={{ backgroundColor: course.color }}
              />
              <span className="font-mono text-sm font-bold text-cyan-400">
                {course.courseCode}
              </span>
              {course.semester && (
                <span className="text-xs text-slate-400 font-mono">
                  • {course.semester}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-fantasy font-bold text-slate-100">
              {course.courseName}
            </h1>

            {course.instructorName && (
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Instructor: {course.instructorName}
              </p>
            )}

            {course.description && (
              <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Course Progress
            </span>
            <div className="text-3xl font-mono font-bold text-cyan-300">
              {progressPercent}%
            </div>
            <span className="text-[11px] text-slate-500">
              {completedCount} / {courseMilestones.length} quests completed
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-purple-500/15">
          <ProgressBar value={progressPercent} size="md" variant="cyan" />
        </div>
      </div>

      {/* Grading Structure Box if available */}
      {gradingCategories.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-400" />
              <h3 className="font-fantasy font-bold text-sm text-slate-100">
                Syllabus Grading Weights Structure
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              Total Weight: {totalGradingWeight}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {gradingCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl bg-[#090c18] border border-slate-800 text-xs"
              >
                <span className="text-slate-400 block truncate">{cat.name}</span>
                <span className="font-mono text-sm font-bold text-purple-300">
                  {cat.weightPercent}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Boss Encounters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-fantasy font-bold text-slate-100">
              Major Boss Battles ({bossEncounters.length})
            </h2>
          </div>
        </div>

        {bossEncounters.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#121528]/40 border border-purple-500/15 text-center text-xs text-slate-400">
            No boss examinations registered for this course yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bossEncounters.map((boss) => (
              <div
                key={boss.id}
                onClick={() => {
                  setSelectedMilestone(boss);
                  setIsMilestoneModalOpen(true);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  boss.status === 'completed'
                    ? 'bg-[#101424]/60 border-emerald-500/30 opacity-75'
                    : 'bg-gradient-to-br from-[#1c1328] to-[#121528] border-rose-500/30 hover:border-rose-500/60 shadow-lg shadow-rose-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        boss.status === 'completed'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {boss.status === 'completed' ? '✓' : '⚔️'}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-rose-400 uppercase font-bold tracking-wider block">
                        {boss.difficultyCategory === 'final_raid' ? 'Final Raid' : 'Boss Fight'}
                      </span>
                      <h4
                        className={`text-sm font-bold ${
                          boss.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-100'
                        }`}
                      >
                        {boss.title}
                      </h4>
                    </div>
                  </div>

                  {boss.bossHp !== null && (
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-rose-300 block">
                        {boss.bossHp} HP
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {boss.weightPercent}% Weight
                      </span>
                    </div>
                  )}
                </div>

                {boss.bossHp !== null && (
                  <ProgressBar
                    value={boss.status === 'completed' ? 0 : boss.bossHp}
                    max={boss.bossHp}
                    size="sm"
                    variant="boss_hp"
                  />
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-purple-500/10">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{boss.dueDate || 'Date TBD'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-300 font-semibold mr-1">
                      +{boss.xpReward} XP
                    </span>
                    {boss.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={(e) => handlePlayMilestone(e, boss, true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-fantasy font-semibold text-xs shadow-md shadow-rose-950/30 border border-rose-400/30 transition-all active:scale-95"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Fight Boss</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handlePlayMilestone(e, boss, true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors"
                        title="Replay in practice mode"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Replay Battle</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Quests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-fantasy font-bold text-slate-100">
              Assignments &amp; Quests ({routineQuests.length})
            </h2>
          </div>

          <Button
            variant="cyan"
            size="sm"
            onClick={() => {
              setSelectedMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Quest</span>
          </Button>
        </div>

        {routineQuests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#121528]/40 border border-purple-500/15 text-center text-xs text-slate-400">
            No routine quests recorded. Click "Add Quest" to inscribe an assignment or quiz.
          </div>
        ) : (
          <div className="space-y-2.5">
            {routineQuests.map((quest) => (
              <div
                key={quest.id}
                onClick={() => {
                  setSelectedMilestone(quest);
                  setIsMilestoneModalOpen(true);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  quest.status === 'completed'
                    ? 'bg-[#0f1220]/60 border-slate-800 opacity-60'
                    : 'bg-[#121528]/90 hover:bg-[#161a32] border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 text-xs font-bold ${
                      quest.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    {quest.status === 'completed' ? '✓' : '🎯'}
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        quest.status === 'completed'
                          ? 'line-through text-slate-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {quest.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize">{quest.milestoneType}</span>
                      {quest.weightPercent !== null && (
                        <span>• {quest.weightPercent}% weight</span>
                      )}
                      {quest.sourceExcerpt && (
                        <span className="italic text-slate-500 truncate max-w-xs">
                          • {quest.sourceExcerpt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span className="text-xs font-mono text-slate-300 block">
                      {quest.dueDate || 'TBD'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">
                      +{quest.xpReward} XP
                    </span>
                  </div>
                  {quest.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={(e) => handlePlayMilestone(e, quest, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-fantasy font-semibold text-xs shadow-md shadow-purple-900/30 border border-purple-400/30 transition-all active:scale-95 group"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
                      <span>Play</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handlePlayMilestone(e, quest, false)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors"
                      title="Replay in practice mode"
                    >
                      <RotateCcw className="w-3 h-3 text-emerald-400" />
                      <span>Replay</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1222] border border-rose-500/30 p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold font-fantasy text-rose-300">
              Disband Course Realm?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{course.courseName}"</span>? All quests, boss encounters, and grading structures will be removed.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleDeleteCourse}>
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        milestoneToEdit={selectedMilestone}
        defaultCourseId={course.id}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        courseToEdit={course}
      />

      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultCourseId={course.id}
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
