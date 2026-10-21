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
            <span className="text-xs font-mono font-black px-3 py-0.5 rounded-full bg-[#070b14] text-rose-300 border border-rose-500/30 shadow-neu-inset-sm">
              {bossAssessments.filter((b) => b.status === 'pending').length} Upcoming
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Major examinations and high-stakes assessments represented as semester boss encounters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleLaunchArena(bossAssessments[0] || null, courses[0] || null)}
          >
            <Crown className="w-4 h-4 mr-1.5 text-white" />
            <span>Play Boss Slayer Arena</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
            <FileUp className="w-4 h-4 mr-1.5 text-white" />
            <span>Upload Syllabus</span>
          </Button>
        </div>
      </div>

      {/* Plain English Game Mechanic Explanation */}
      <div className="p-5 rounded-3xl bg-[#0E1322] border border-white/[0.04] shadow-neu-raised flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed font-medium">
          <span className="font-black text-indigo-300 block mb-0.5 font-fantasy uppercase tracking-wider">
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
        <div className="p-12 text-center rounded-3xl bg-[#0E1322] border border-white/[0.04] shadow-neu-raised space-y-2">
          <p className="text-slate-100 font-fantasy text-sm font-black">
            No Boss Fights Scheduled Yet!
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
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
                className={`p-6 rounded-3xl border border-white/[0.04] shadow-neu-raised hover:shadow-neu-raised-lg transition-all space-y-4 ${
                  isDefeated
                    ? 'bg-[#0E1322] opacity-80'
                    : 'bg-[#0E1322]'
                }`}
              >
                {/* Boss Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Circular Neumorphic Dial for Boss Avatar with outer sunken moat */}
                    <div className="w-16 h-16 rounded-full neu-dial-moat p-1 flex items-center justify-center shrink-0">
                      <div
                        className={`w-full h-full rounded-full neu-dial shadow-neu-raised flex items-center justify-center text-2xl border ${
                          isDefeated
                            ? 'border-sky-400/40 text-sky-200'
                            : isFinal
                            ? 'border-rose-400/40 text-rose-200'
                            : 'border-white/[0.12] text-amber-200'
                        }`}
                      >
                        {isDefeated ? '🏆' : isFinal ? '👑' : '🐉'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20 shadow-neu-raised-sm"
                          style={{ backgroundColor: course?.color || '#6366f1' }}
                        />
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {course?.courseCode || 'COURSE'}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                            isFinal
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-neu-inset-sm'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-neu-inset-sm'
                          }`}
                        >
                          {isFinal ? 'Final Raid Boss' : 'Major Exam Boss'}
                        </span>
                      </div>

                      <h3 className="font-fantasy font-black text-base text-slate-100">
                        {boss.title}
                      </h3>
                    </div>
                  </div>

                  <Badge variant={isDefeated ? 'emerald' : boss.dueDate ? 'purple' : 'slate'}>
                    {isDefeated ? 'Defeated' : boss.dueDate ? boss.dueDate : 'Date TBA'}
                  </Badge>
                </div>

                {/* Course Name */}
                <p className="text-xs text-sky-400 font-bold font-mono">
                  Course: {course?.courseName || 'University Course'}
                </p>

                {/* Health Bar Section - Sunken Inset Track */}
                <div className="space-y-2 p-4 rounded-2xl bg-[#060810] border border-white/[0.04] shadow-neu-inset">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-fantasy font-black flex items-center gap-1.5 text-rose-400">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>Boss Health:</span>
                      <span className="font-mono text-slate-100 font-black">
                        {currentHp} / {maxHp} HP
                      </span>
                    </span>

                    <span className="font-mono text-[11px] text-sky-400 font-black">
                      Preparation: {prepPercent}%
                    </span>
                  </div>

                  <ProgressBar
                    value={maxHp - currentHp}
                    max={maxHp}
                    size="md"
                    variant="boss_hp"
                  />

                  <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono font-bold pt-0.5">
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
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => handleLaunchArena(boss, course || null)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#5357c8] to-[#b8384f] hover:from-[#5c61d6] hover:to-[#c73f57] text-white font-fantasy font-black text-xs border border-indigo-400/25 shadow-neu-raised-sm hover:shadow-neu-raised active:shadow-neu-inset-sm transition-all active:translate-y-0.5"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-white" />
                    <span>{isDefeated ? "Replay Boss Slayer Arena" : "Fight in Boss Slayer Arena"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/quests')}
                    >
                      <Swords className="w-3.5 h-3.5 mr-1 text-sky-400" />
                      <span>Prep Quests</span>
                    </Button>

                    {isDefeated && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-fantasy font-black bg-[#070b14] text-emerald-300 border border-emerald-500/30 shadow-neu-inset-sm">
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
