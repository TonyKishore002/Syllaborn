import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Swords,
  Calendar,
  CheckCircle2,
  FileUp,
  Percent,
  Sparkles,
  ArrowRight,
  Crown,
  Heart,
  Check,
  Gamepad2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import { SyllabusUploadModal } from '../components/syllabus/SyllabusUploadModal';
import { BossSlayerModal } from '../components/boss/BossSlayerModal';
import { useSyllaborn } from '../hooks/useSyllaborn';
import { Course, Milestone } from '../types';

export const BossFightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { courses, milestones } = useSyllaborn();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [activeArenaBoss, setActiveArenaBoss] = useState<Milestone | null>(null);
  const [activeArenaCourse, setActiveArenaCourse] = useState<Course | null>(null);

  const handleLaunchArena = (boss: Milestone | null, course: Course | null) => {
    setActiveArenaBoss(boss);
    setActiveArenaCourse(course);
    setIsArenaOpen(true);
  };

  // Identify all high-stakes assessments (midterms, finals, weight >= 15%, or boss category)
  const bossAssessments = useMemo(() => {
    const list = milestones.filter(
      (m) =>
        m.difficultyCategory === 'boss_fight' ||
        m.difficultyCategory === 'final_raid' ||
        m.milestoneType === 'midterm' ||
        m.milestoneType === 'final_exam' ||
        (m.weightPercent && m.weightPercent >= 15)
    );

    // Sort: pending first, then by earliest due date
    return list.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [milestones]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h1 className="text-2xl sm:text-3xl font-fantasy font-black text-slate-100">
              Boss Fights
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {bossAssessments.filter((b) => b.status === 'pending').length} Upcoming
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Major examinations and high-stakes assessments represented as semester boss encounters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleLaunchArena(bossAssessments[0] || null, courses[0] || null)}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          >
            <Crown className="w-4 h-4 mr-1.5 text-amber-300" />
            <span>Play Boss Slayer Arena</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-cyan-300" />
            <span>Upload Syllabus</span>
          </Button>
        </div>
      </div>

      {/* Plain English Game Mechanic Explanation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/25 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-cyan-300 block mb-0.5 font-fantasy">
            How Boss Fights Work:
          </span>
          "Complete your preparation quests to reduce the boss's HP."
          Every regular study quest you complete weakens the boss before exam day.
          Boss HP is based on the actual course grading weight from your syllabus.
        </div>
      </div>

      {/* Boss Cards List */}
      {courses.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-rose-400" />}
          title="No Boss Encounters Yet"
          description="Upload your university syllabus PDF to automatically identify midterms, finals, and major exams as boss fights."
          actionLabel="Upload Syllabus PDF"
          onAction={() => setIsUploadModalOpen(true)}
        />
      ) : bossAssessments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#101324] border border-purple-500/15 space-y-2">
          <p className="text-slate-300 font-fantasy text-sm font-bold">
            No Boss Fights Scheduled Yet!
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your uploaded courses don't have midterms or finals scheduled yet. When exams are added or detected in your syllabi, they will appear here with custom health bars.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {bossAssessments.map((boss) => {
            const course = courses.find((c) => c.id === boss.courseId);
            const isFinal =
              boss.difficultyCategory === 'final_raid' || boss.milestoneType === 'final_exam';

            // Real grading weight
            const hasWeight = boss.weightPercent !== null && boss.weightPercent !== undefined && !isNaN(boss.weightPercent);
            const maxHp = hasWeight ? Math.round(boss.weightPercent! * 10) : 200;

            // Course preparation progress
            const courseQuests = milestones.filter((m) => m.courseId === boss.courseId);
            const completedCourseQuests = courseQuests.filter((m) => m.status === 'completed');
            const prepRatio =
              courseQuests.length > 0
                ? completedCourseQuests.length / courseQuests.length
                : 0;

            const isDefeated = boss.status === 'completed';
            const currentHp = isDefeated ? 0 : Math.max(0, Math.round(maxHp * (1 - prepRatio)));
            const prepPercent = Math.round(prepRatio * 100);

            return (
              <Card
                key={boss.id}
                className={`p-5 rounded-3xl border transition-all space-y-4 ${
                  isDefeated
                    ? 'bg-[#0f1422]/70 border-emerald-500/30 opacity-80'
                    : 'bg-[#101324] border-purple-500/20 hover:border-purple-500/40 shadow-lg'
                }`}
              >
                {/* Boss Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0 ${
                        isDefeated
                          ? 'bg-emerald-950/60 border border-emerald-500/40'
                          : isFinal
                          ? 'bg-rose-950/60 border border-rose-500/40'
                          : 'bg-purple-950/60 border border-purple-500/40'
                      }`}
                    >
                      {isDefeated ? '🏆' : isFinal ? '👑' : '🐉'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: course?.color || '#8b5cf6' }}
                        />
                        <span className="text-[11px] font-mono text-slate-400">
                          {course?.courseCode || 'COURSE'}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            isFinal
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}
                        >
                          {isFinal ? 'Final Raid Boss' : 'Major Exam Boss'}
                        </span>
                      </div>

                      <h3 className="font-fantasy font-bold text-base text-slate-100">
                        {boss.title}
                      </h3>
                    </div>
                  </div>

                  <Badge variant={isDefeated ? 'emerald' : boss.dueDate ? 'purple' : 'slate'}>
                    {isDefeated ? 'Defeated' : boss.dueDate ? boss.dueDate : 'Date TBA'}
                  </Badge>
                </div>

                {/* Course Name */}
                <p className="text-xs text-purple-300 font-medium">
                  Course: {course?.courseName || 'University Course'}
                </p>

                {/* Health Bar Section */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#14182e] border border-purple-500/15">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-fantasy font-bold flex items-center gap-1.5 text-rose-300">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>Boss Health:</span>
                      <span className="font-mono text-slate-200">
                        {currentHp} / {maxHp} HP
                      </span>
                    </span>

                    <span className="font-mono text-[11px] text-cyan-300">
                      Preparation: {prepPercent}%
                    </span>
                  </div>

                  <ProgressBar
                    value={maxHp - currentHp}
                    max={maxHp}
                    size="md"
                    variant="boss_hp"
                  />

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                    <span>
                      {hasWeight
                        ? `Grading Weight: ${boss.weightPercent}% of course`
                        : 'Grading weight not specified (default 200 HP)'}
                    </span>
                    <span>
                      {completedCourseQuests.length} / {courseQuests.length} prep quests
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/10">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleLaunchArena(boss, course || null)}
                    className="text-xs bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-fantasy shadow-md"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 mr-1 text-amber-300" />
                    <span>{isDefeated ? "Replay Boss Slayer Arena" : "Fight in Boss Slayer Arena"}</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/quests')}
                      className="text-xs"
                    >
                      <Swords className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      <span>Prep Quests</span>
                    </Button>

                    {isDefeated && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-fantasy font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Defeated ✓</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Boss Slayer Interactive RPG Combat Modal */}
      <BossSlayerModal
        isOpen={isArenaOpen}
        onClose={() => setIsArenaOpen(false)}
        selectedBoss={activeArenaBoss}
        selectedCourse={activeArenaCourse}
      />
    </div>
  );
};
