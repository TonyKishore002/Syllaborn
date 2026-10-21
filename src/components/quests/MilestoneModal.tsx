import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Swords,
  Calendar,
  Clock,
  Percent,
  Check,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileText,
  Gamepad2,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PlayQuestModal } from '../game/PlayQuestModal';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { Milestone, MilestoneType } from '../../types';
import {
  calculateBossHp,
  calculateXpReward,
  determineDifficultyCategory,
  DIFFICULTY_LABELS,
} from '../../lib/gamification';
import { triggerQuestCelebration } from '../../lib/celebration';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneToEdit?: Milestone | null;
  defaultCourseId?: string;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  milestoneToEdit,
  defaultCourseId,
}) => {
  const { courses, saveMilestone, deleteMilestone, toggleMilestone, logActivity } = useSyllaborn();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(defaultCourseId || courses[0]?.id || '');
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('assignment');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [weightPercent, setWeightPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title);
      setDescription(milestoneToEdit.description || '');
      setCourseId(milestoneToEdit.courseId);
      setMilestoneType(milestoneToEdit.milestoneType);
      setDueDate(milestoneToEdit.dueDate || '');
      setDueTime(milestoneToEdit.dueTime || '');
      setWeightPercent(milestoneToEdit.weightPercent ?? null);
    } else {
      setTitle('');
      setDescription('');
      setCourseId(defaultCourseId || courses[0]?.id || '');
      setMilestoneType('assignment');
      setDueDate('');
      setDueTime('');
      setWeightPercent(null);
    }
    setError(null);
  }, [milestoneToEdit, defaultCourseId, courses, isOpen]);

  const bossHp = calculateBossHp(weightPercent);
  const difficulty = determineDifficultyCategory(milestoneType, weightPercent);
  const xpReward = calculateXpReward(milestoneType, weightPercent);
  const difficultyInfo = DIFFICULTY_LABELS[difficulty];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!courseId) {
      setError('Please select or create a course first.');
      return;
    }

    const isEdit = Boolean(milestoneToEdit);
    const updatedMilestone: Milestone = {
      id: milestoneToEdit?.id || crypto.randomUUID(),
      courseId,
      documentId: milestoneToEdit?.documentId || null,
      title: title.trim(),
      description: description.trim() || undefined,
      milestoneType,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      weightPercent,
      sourcePage: milestoneToEdit?.sourcePage || null,
      sourceExcerpt: milestoneToEdit?.sourceExcerpt || null,
      extractionConfidence: milestoneToEdit?.extractionConfidence || null,
      difficultyCategory: difficulty,
      bossHp,
      xpReward,
      status: milestoneToEdit?.status || 'pending',
      sourceType: milestoneToEdit?.sourceType || 'manual',
      completedAt: milestoneToEdit?.completedAt || null,
      createdAt: milestoneToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMilestone(updatedMilestone);

    logActivity({
      courseId,
      milestoneId: updatedMilestone.id,
      eventType: isEdit ? 'milestone_created' : 'milestone_created',
      title: isEdit ? 'Quest Updated' : 'New Quest Inscribed',
      description: `Quest "${updatedMilestone.title}" (${difficultyInfo.label}) saved.`,
    });

    onClose();
  };

  const handleToggleComplete = () => {
    if (!milestoneToEdit) return;
    const res = toggleMilestone(milestoneToEdit.id);
    if (res && res.milestone.status === 'completed') {
      triggerQuestCelebration();
    }
    onClose();
  };

  const handleDelete = () => {
    if (!milestoneToEdit) return;
    deleteMilestone(milestoneToEdit.id);
    onClose();
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {difficulty === 'boss_fight' || difficulty === 'final_raid' ? (
            <Swords className="w-5 h-5 text-rose-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-sky-400" />
          )}
          <span>{milestoneToEdit ? 'Inspect Quest / Boss Encounter' : 'Inscribe New Academic Quest'}</span>
        </div>
      }
      description="Track assignments as routine quests and examinations as formidable boss encounters."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dynamic RPG Preview Banner */}
        <div className="p-4 rounded-3xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono uppercase border border-white/10 shadow-neu-raised-sm ${difficultyInfo.badgeColor}`}
              >
                {difficultyInfo.label}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                +{xpReward} XP Bounty
              </span>
            </div>
            <p className="text-[11px] text-slate-300">{difficultyInfo.description}</p>
          </div>

          {bossHp !== null && (
            <div className="text-right">
              <span className="text-[10px] text-rose-400 font-mono uppercase block font-semibold">
                Boss Health
              </span>
              <span className="text-sm font-mono text-rose-400 font-bold">{bossHp} HP</span>
              <span className="text-[10px] text-slate-400 block">({weightPercent}% grade weight)</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Quest / Assessment Title <span className="text-indigo-400 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm Examination or Lab 3: Binary Search"
            className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
          />
        </div>

        {/* Course and Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Course <span className="text-indigo-400 font-bold">*</span>
            </label>
            <select
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
            >
              {courses.length === 0 && <option value="">No courses created yet</option>}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode}: {c.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quest Type</label>
            <select
              value={milestoneType}
              onChange={(e) => setMilestoneType(e.target.value as MilestoneType)}
              className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
            >
              <option value="assignment">Assignment (Quest)</option>
              <option value="quiz">Quiz (Elite Encounter)</option>
              <option value="lab">Lab Practical (Elite Encounter)</option>
              <option value="project">Project / Paper (Elite Encounter)</option>
              <option value="presentation">Presentation (Elite Encounter)</option>
              <option value="midterm">Midterm Examination (Boss Fight)</option>
              <option value="final_exam">Final Examination (Final Raid)</option>
              <option value="reading">Assigned Reading</option>
              <option value="other">Other Academic Milestone</option>
            </select>
          </div>
        </div>

        {/* Due Date, Time, and Assessment Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Due Time (Optional)</label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assessment Weight (%)
            </label>
            <div className="relative">
              <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="e.g. 25"
                value={weightPercent !== null ? weightPercent : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  setWeightPercent(isNaN(val as number) ? null : val);
                }}
                className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description or Objectives
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Topics covered, submission guidelines, or notes..."
            className="w-full bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm focus:border-indigo-500/50 rounded-2xl px-3 py-2 text-xs text-slate-100 focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Source syllabus excerpt if AI-extracted */}
        {milestoneToEdit?.sourceExcerpt && (
          <div className="p-3 rounded-2xl bg-[#070b14] border border-white/[0.03] shadow-neu-inset-sm text-[11px] text-slate-300 flex items-start gap-2">
            <FileText className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-400">Extracted from Syllabus: </span>
              <span className="italic text-slate-200">"{milestoneToEdit.sourceExcerpt}"</span>
              {milestoneToEdit.sourcePage && (
                <span className="text-slate-400 ml-1.5">(Page {milestoneToEdit.sourcePage})</span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            {milestoneToEdit && (
              <>
                {milestoneToEdit.sourceType === 'ai_extracted' || (milestoneToEdit.gameConfig && milestoneToEdit.gameConfig.questions && milestoneToEdit.gameConfig.questions.length > 0) ? (
                  milestoneToEdit.status === 'pending' ? (
                    <Button
                      type="button"
                      variant="cyan"
                      size="sm"
                      onClick={() => setIsPlayModalOpen(true)}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 mr-1" />
                      <span>Play Quest</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsPlayModalOpen(true)}
                        title="Replay in practice mode (0 duplicate XP)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1 text-sky-400" />
                        <span>Replay</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleComplete}
                        className="text-xs text-slate-300 hover:text-white"
                        title="Reopen quest"
                      >
                        Reopen
                      </Button>
                    </>
                  )
                ) : (
                  <Button
                    type="button"
                    variant={milestoneToEdit.status === 'completed' ? 'secondary' : 'cyan'}
                    size="sm"
                    onClick={handleToggleComplete}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {milestoneToEdit.status === 'completed' ? 'Reopen Quest' : 'Complete Quest'}
                  </Button>
                )}
                <Button type="button" variant="danger" size="sm" onClick={handleDelete} title="Delete quest">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              <Check className="w-4 h-4 mr-1.5" />
              {milestoneToEdit ? 'Save Quest' : 'Create Quest'}
            </Button>
          </div>
        </div>
      </form>

      {/* Interactive Play Quest Modal */}
      {milestoneToEdit && (
        <PlayQuestModal
          isOpen={isPlayModalOpen}
          onClose={() => {
            setIsPlayModalOpen(false);
            onClose();
          }}
          quest={{
            id: milestoneToEdit.id,
            kind: 'milestone',
            title: milestoneToEdit.title,
            description: milestoneToEdit.description,
            courseId: milestoneToEdit.courseId,
            courseCode: courses.find((c) => c.id === milestoneToEdit.courseId)?.courseCode,
            courseName: courses.find((c) => c.id === milestoneToEdit.courseId)?.courseName,
            xpReward: milestoneToEdit.xpReward,
            status: milestoneToEdit.status,
            gameConfig: milestoneToEdit.gameConfig,
            weightPercent: milestoneToEdit.weightPercent,
            bossHp: milestoneToEdit.bossHp,
            isBoss:
              milestoneToEdit.difficultyCategory === 'boss_fight' ||
              milestoneToEdit.difficultyCategory === 'final_raid',
          }}
        />
      )}
    </Modal>
  );
};
