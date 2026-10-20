import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Play,
  Heart,
  Gamepad2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { extractTextFromPDF } from '../../services/pdf-extractor.service';
import { requestSyllabusAnalysis } from '../../services/ai-client.service';
import {
  AISyllabusResponse,
  Course,
  CourseUnit,
  GradingCategory,
  Milestone,
  MilestoneType,
  GameMode,
  GameQuestion,
  PuzzleData,
} from '../../types';
import {
  calculateBossHp,
  calculateXpReward,
  determineDifficultyCategory,
} from '../../lib/gamification';
import {
  generateFallbackGameConfig,
  generateFallbackQuestions,
  selectIntelligentGameMode,
  sanitizeGameConfig,
} from '../../lib/game-generator';
import { triggerQuestCelebration, triggerLevelUpCelebration } from '../../lib/celebration';

interface SyllabusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseId?: string;
}

export type ProcessingPipelineStep =
  | 'uploaded'
  | 'extracting_content'
  | 'analyzing_syllabus'
  | 'generating_quests'
  | 'generating_game_questions'
  | 'validating_game_content'
  | 'ready_to_play';

type ModalStage = 'upload' | 'processing' | 'review' | 'manual_fallback';

export const SyllabusUploadModal: React.FC<SyllabusUploadModalProps> = ({
  isOpen,
  onClose,
  defaultCourseId,
}) => {
  const navigate = useNavigate();
  const {
    courses,
    saveCourse,
    saveUnits,
    saveMilestone,
    saveGradingCategories,
    saveDocument,
    saveJob,
    logActivity,
  } = useSyllaborn();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ModalStage>('upload');
  const [pipelineStep, setPipelineStep] = useState<ProcessingPipelineStep>('uploaded');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetCourseId] = useState<string>(
    defaultCourseId || (courses[0]?.id ?? 'new')
  );

  // Extraction State
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review State
  const [reviewCourseName, setReviewCourseName] = useState('');
  const [reviewCourseCode, setReviewCourseCode] = useState('');
  const [reviewRegionName, setReviewRegionName] = useState('');
  const [reviewUnits, setReviewUnits] = useState<
    Array<{
      id: string;
      unit_number: number;
      title: string;
      location_name: string;
      description?: string;
      topics: Array<{
        id: string;
        title: string;
        quest_title: string;
        description?: string;
        game_mode: GameMode;
        difficulty: 'easy' | 'medium' | 'hard';
        questions: GameQuestion[];
        puzzle_data?: PuzzleData | null;
      }>;
    }>
  >([]);
  const [reviewCategories, setReviewCategories] = useState<
    Array<{ name: string; weight_percent: number; evidence?: string | null }>
  >([]);
  const [reviewMilestones, setReviewMilestones] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      type: MilestoneType;
      weight_percent: number | null;
      due_date: string | null;
      due_time: string | null;
      boss_name?: string;
      confidence?: number;
      evidence?: string | null;
      questions?: GameQuestion[];
    }>
  >([]);
  const [isDuplicateCourse, setIsDuplicateCourse] = useState(false);

  // Manual Fallback Form State
  const [manualCourseName, setManualCourseName] = useState('');
  const [manualCourseCode, setManualCourseCode] = useState('');
  const [manualUnitName, setManualUnitName] = useState('');
  const [manualQuestTitle, setManualQuestTitle] = useState('');
  const [manualAssessmentName, setManualAssessmentName] = useState('');
  const [manualAssessmentDate, setManualAssessmentDate] = useState('');
  const [manualAssessmentWeight, setManualAssessmentWeight] = useState<string>('');
  const [manualFormError, setManualFormError] = useState<string | null>(null);

  const resetWorkflow = () => {
    setStage('upload');
    setPipelineStep('uploaded');
    setSelectedFile(null);
    setExtractedText('');
    setExtractionProgress(0);
    setErrorMessage(null);
    setReviewMilestones([]);
    setReviewCategories([]);
    setReviewUnits([]);
    setIsDuplicateCourse(false);
    setManualFormError(null);
  };

  // Step 1: Read and Extract PDF
  const processSelectedFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF syllabus document.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('PDF file size exceeds 25 MB limit.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setStage('processing');
    setPipelineStep('extracting_content');
    setExtractionProgress(15);

    try {
      const result = await extractTextFromPDF(file, (progress) => {
        setExtractionProgress(Math.max(15, progress));
      });

      if (!result.success || !result.text || result.text.trim().length === 0) {
        setErrorMessage(
          result.error ||
            'This PDF appears to contain scanned pages or unreadable text. Please upload a text-based PDF or add its content manually.'
        );
        return;
      }

      setExtractedText(result.text);
      setPageCount(result.numPages);
      setWordCount(result.wordCount);

      // Proceed immediately to Stages 3-6: AI Analysis & Game Generation
      await executeAIAnalysis(result.text, file.name, file.size);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'Failed to read PDF file.');
    }
  };

  // Step 2: Analyze Syllabus & Generate Playable Game Content via Backend
  const executeAIAnalysis = async (text: string, filename: string, filesize: number) => {
    setStage('processing');
    setPipelineStep('analyzing_syllabus');
    setErrorMessage(null);

    const docId = crypto.randomUUID();
    const jobId = crypto.randomUUID();

    saveDocument({
      id: docId,
      courseId: targetCourseId === 'new' ? 'pending' : targetCourseId,
      originalFilename: filename,
      fileSizeBytes: filesize,
      processingStatus: 'analyzing_syllabus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    saveJob({
      id: jobId,
      documentId: docId,
      status: 'analyzing_syllabus',
      attemptCount: 1,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      // Simulate/advance pipeline states for clear feedback
      const aiPromise = requestSyllabusAnalysis(text);

      // Advance visual state to generating quests
      setTimeout(() => {
        setPipelineStep((prev) => (prev === 'analyzing_syllabus' ? 'generating_quests' : prev));
      }, 2500);

      // Advance visual state to generating game questions
      setTimeout(() => {
        setPipelineStep((prev) =>
          prev === 'generating_quests' || prev === 'analyzing_syllabus'
            ? 'generating_game_questions'
            : prev
        );
      }, 5500);

      const response = await aiPromise;

      if (!response.success || !response.data) {
        setErrorMessage(response.error || 'AI analysis could not be completed.');
        saveJob({
          id: jobId,
          documentId: docId,
          status: 'failed',
          attemptCount: 1,
          lastError: response.error,
          finishedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      // Validating game content stage
      setPipelineStep('validating_game_content');

      const aiData: AISyllabusResponse = response.data;

      // Extract Course & Region
      const cName = aiData.course_name || filename.replace('.pdf', '') || 'New Course';
      const cCode = aiData.course_code || 'CRS-101';
      setReviewCourseName(cName);
      setReviewCourseCode(cCode);
      setReviewRegionName(aiData.region_name || `Realm of ${cName}`);

      // Check for duplicate course
      const duplicateExists = courses.some(
        (c) =>
          c.courseName.toLowerCase() === cName.toLowerCase() ||
          c.courseCode.toLowerCase() === cCode.toLowerCase()
      );
      setIsDuplicateCourse(duplicateExists);

      // Extract Units (Locations) & Topics (Quests) with Game Configurations
      let parsedUnits = (aiData.units || []).map((u, uIdx) => ({
        id: crypto.randomUUID(),
        unit_number: u.unit_number || uIdx + 1,
        title: u.title || `Unit ${uIdx + 1}`,
        location_name:
          u.location_name || `Location ${uIdx + 1}: ${u.title || 'Sanctum of Knowledge'}`,
        description: u.description || '',
        topics: (u.topics || []).map((t) => {
          const gameMode = t.game_mode || selectIntelligentGameMode(t.title, t.description);
          const rawQuestions = t.questions && t.questions.length > 0
            ? t.questions
            : generateFallbackQuestions(t.title, cName);

          const { sanitizedConfig } = sanitizeGameConfig({
            questId: crypto.randomUUID(),
            topic: t.title,
            gameMode,
            difficulty: t.difficulty || 'easy',
            questions: rawQuestions,
            puzzleData: t.puzzle_data,
          });

          return {
            id: crypto.randomUUID(),
            title: t.title,
            quest_title: t.quest_title || `Quest: Master ${t.title}`,
            description: t.description || '',
            game_mode: sanitizedConfig.gameMode,
            difficulty: sanitizedConfig.difficulty || 'easy',
            questions: sanitizedConfig.questions,
            puzzle_data: sanitizedConfig.puzzleData,
          };
        }),
      }));

      // Ensure at least 1 unit with topics exists
      if (parsedUnits.length === 0) {
        const fallbackConfig = generateFallbackGameConfig(
          'Foundations & Core Principles',
          cName,
          'do-or-die'
        );
        parsedUnits = [
          {
            id: crypto.randomUUID(),
            unit_number: 1,
            title: 'Foundations & Core Principles',
            location_name: 'The Outpost of Foundations',
            description: 'Core introductory study',
            topics: [
              {
                id: crypto.randomUUID(),
                title: 'Introduction & Core Concepts',
                quest_title: 'Survey the Realm of Study',
                description: 'Core foundational principles',
                game_mode: fallbackConfig.gameMode,
                difficulty: fallbackConfig.difficulty || 'easy',
                questions: fallbackConfig.questions,
                puzzle_data: fallbackConfig.puzzleData,
              },
            ],
          },
        ];
      }
      setReviewUnits(parsedUnits);

      // Extract Assessments & Bosses with Exam Questions
      setReviewCategories(aiData.grading_structure || []);
      setReviewMilestones(
        (aiData.milestones || []).map((m) => {
          const matchingAssessment = (aiData.assessments || []).find(
            (a) => a.title.toLowerCase() === m.title.toLowerCase()
          );
          const questions =
            matchingAssessment?.questions && matchingAssessment.questions.length > 0
              ? matchingAssessment.questions
              : generateFallbackQuestions(m.title, cName);

          return {
            id: crypto.randomUUID(),
            title: m.title,
            description: m.description,
            type: m.type || 'assignment',
            weight_percent: m.weight_percent ?? null,
            due_date: m.due_date ?? null,
            due_time: m.due_time ?? null,
            boss_name: matchingAssessment?.boss_name || `Guardian of ${m.title}`,
            confidence: m.confidence ?? 0.9,
            evidence: m.evidence ?? null,
            questions,
          };
        })
      );

      // Ready to play!
      setPipelineStep('ready_to_play');
      setTimeout(() => {
        setStage('review');
      }, 600);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setErrorMessage(err.message || 'Failed to contact AI backend.');
    }
  };

  // Step 3 & 4: Commit and Save the RPG World to LocalStorage
  const handleStartMyAdventure = () => {
    let finalCourseId = targetCourseId;

    if (finalCourseId === 'new') {
      finalCourseId = crypto.randomUUID();
      const newCourse: Course = {
        id: finalCourseId,
        courseName: reviewCourseName.trim() || 'Untitled Course',
        courseCode: reviewCourseCode.trim() || 'CRS-100',
        regionName: reviewRegionName.trim() || `Realm of ${reviewCourseName.trim()}`,
        color: '#8b5cf6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveCourse(newCourse);
    } else {
      const existing = courses.find((c) => c.id === finalCourseId);
      if (existing) {
        saveCourse({
          ...existing,
          courseName: reviewCourseName.trim() || existing.courseName,
          courseCode: reviewCourseCode.trim() || existing.courseCode,
          regionName:
            reviewRegionName.trim() || existing.regionName || `Realm of ${existing.courseName}`,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Save Units as Locations and Topics as Quests WITH GAME CONFIGS
    const courseUnitsToSave: CourseUnit[] = reviewUnits.map((u) => ({
      id: u.id,
      courseId: finalCourseId,
      unitNumber: u.unit_number,
      title: u.title,
      locationName: u.location_name,
      description: u.description,
      topics: u.topics.map((t) => ({
        id: t.id,
        unitId: u.id,
        courseId: finalCourseId,
        title: t.title,
        questTitle: t.quest_title,
        description: t.description,
        xpReward: 50,
        status: 'pending',
        gameConfig: {
          questId: t.id,
          topic: t.title,
          gameMode: t.game_mode,
          difficulty: t.difficulty,
          questions: t.questions,
          puzzleData: t.puzzle_data,
        },
      })),
    }));
    saveUnits(courseUnitsToSave);

    // Save Grading Categories
    const categoriesToSave: GradingCategory[] = reviewCategories.map((c) => ({
      id: crypto.randomUUID(),
      courseId: finalCourseId,
      name: c.name,
      weightPercent: c.weight_percent,
      sourceExcerpt: c.evidence,
    }));
    saveGradingCategories(categoriesToSave);

    // Save Milestones & Boss Fights WITH EXAM QUESTIONS
    reviewMilestones.forEach((m) => {
      const difficulty = determineDifficultyCategory(m.type, m.weight_percent);
      const bossHp = calculateBossHp(m.weight_percent);
      const xpReward = calculateXpReward(m.type, m.weight_percent);

      const milestone: Milestone = {
        id: m.id,
        courseId: finalCourseId,
        title: m.title,
        description: m.description,
        milestoneType: m.type,
        dueDate: m.due_date,
        dueTime: m.due_time,
        weightPercent: m.weight_percent,
        sourceExcerpt: m.evidence,
        extractionConfidence: m.confidence,
        difficultyCategory: difficulty,
        bossHp,
        xpReward,
        status: 'pending',
        sourceType: 'ai_extracted',
        gameConfig: {
          questId: m.id,
          topic: m.title,
          gameMode: 'do-or-die',
          difficulty: 'hard',
          questions:
            m.questions && m.questions.length > 0
              ? m.questions
              : generateFallbackQuestions(m.title, reviewCourseName),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveMilestone(milestone);
    });

    const totalTopics = reviewUnits.reduce((acc, u) => acc + u.topics.length, 0);

    logActivity({
      courseId: finalCourseId,
      eventType: 'syllabus_analyzed',
      title: 'Playable RPG World Forged!',
      description: `Forged "${reviewCourseName}" into Region "${reviewRegionName}" with ${reviewUnits.length} Locations, ${totalTopics} Playable Mini-Games, and ${reviewMilestones.length} Boss Fights.`,
    });

    triggerLevelUpCelebration();
    resetWorkflow();
    onClose();
    navigate('/quests');
  };

  // Step 5: Manual Course & Quest Creation Fallback
  const handleSaveManualFallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCourseName.trim()) {
      setManualFormError('Course name is required.');
      return;
    }
    if (!manualUnitName.trim()) {
      setManualFormError('Unit name is required.');
      return;
    }
    if (!manualQuestTitle.trim()) {
      setManualFormError('Quest title is required.');
      return;
    }

    const newCourseId = crypto.randomUUID();
    const newUnitId = crypto.randomUUID();
    const newTopicId = crypto.randomUUID();

    // Create Course
    const course: Course = {
      id: newCourseId,
      courseName: manualCourseName.trim(),
      courseCode: manualCourseCode.trim() || 'MAN-101',
      regionName: `Realm of ${manualCourseName.trim()}`,
      color: '#06b6d4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCourse(course);

    // Create Unit & Topic Quest with Playable Fallback Game
    const gameConfig = generateFallbackGameConfig(
      manualQuestTitle.trim(),
      manualCourseName.trim(),
      'do-or-die'
    );

    const unit: CourseUnit = {
      id: newUnitId,
      courseId: newCourseId,
      unitNumber: 1,
      title: manualUnitName.trim(),
      locationName: `Sanctum of ${manualUnitName.trim()}`,
      topics: [
        {
          id: newTopicId,
          unitId: newUnitId,
          courseId: newCourseId,
          title: manualQuestTitle.trim(),
          questTitle: manualQuestTitle.trim(),
          description: 'Manually inscribed syllabus study quest.',
          xpReward: 50,
          status: 'pending',
          gameConfig,
        },
      ],
    };
    saveUnits([unit]);

    // Optional Assessment / Boss
    if (manualAssessmentName.trim()) {
      const weightNum = manualAssessmentWeight ? parseFloat(manualAssessmentWeight) : null;
      const bossConfig = generateFallbackGameConfig(
        manualAssessmentName.trim(),
        manualCourseName.trim(),
        'do-or-die'
      );

      const milestone: Milestone = {
        id: crypto.randomUUID(),
        courseId: newCourseId,
        title: manualAssessmentName.trim(),
        description: 'Semester examination boss fight.',
        milestoneType: 'midterm',
        dueDate: manualAssessmentDate || null,
        dueTime: null,
        weightPercent: isNaN(weightNum as number) ? null : weightNum,
        difficultyCategory: 'boss_fight',
        bossHp: weightNum ? Math.round(weightNum * 10) : 200,
        xpReward: 150,
        status: 'pending',
        sourceType: 'manual',
        gameConfig: bossConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveMilestone(milestone);
    }

    triggerQuestCelebration();
    resetWorkflow();
    onClose();
    navigate('/quests');
  };

  const PIPELINE_STAGES: Array<{ key: ProcessingPipelineStep; label: string; desc: string }> = [
    { key: 'uploaded', label: 'Document Uploaded', desc: 'Syllabus PDF received safely' },
    { key: 'extracting_content', label: 'Extracting Content', desc: 'Reading readable text & structure' },
    { key: 'analyzing_syllabus', label: 'Analyzing Syllabus', desc: 'Mapping units, topics & assessments' },
    { key: 'generating_quests', label: 'Generating Quests', desc: 'Forging manageable academic tasks' },
    { key: 'generating_game_questions', label: 'Generating Game Questions', desc: 'Crafting syllabus-grounded challenges' },
    { key: 'validating_game_content', label: 'Validating Game Content', desc: 'Verifying answer keys & options' },
    { key: 'ready_to_play', label: 'Ready to Play', desc: 'Playable mini-games ready for adventure' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetWorkflow();
        onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>Syllabus Quest &amp; Game Forge</span>
        </div>
      }
      description="Upload your syllabus to generate real, playable mini-games (Do-or-Die, Quiz Battle, Puzzle Quest) directly from your course curriculum."
      maxWidth="3xl"
    >
      {/* Dynamic Professor Panic Commentary */}
      <div className="p-3 rounded-2xl bg-purple-950/25 border border-purple-500/25 flex items-start gap-3 mb-4">
        <span className="text-xl shrink-0 mt-0.5">🧙‍♂️</span>
        <div className="text-xs text-purple-200 leading-relaxed">
          <span className="font-fantasy font-bold text-cyan-300 block text-[11px] uppercase tracking-wider mb-0.5">
            Professor Panic:
          </span>
          {stage === 'upload' &&
            "An ancient syllabus has appeared! Drop your PDF here and let me forge it into playable survival games."}
          {stage === 'processing' &&
            pipelineStep === 'extracting_content' &&
            "Extracting syllabus text... Scanning for topics and exam traps!"}
          {stage === 'processing' &&
            pipelineStep === 'analyzing_syllabus' &&
            "Summoning academic AI to identify your course units and topics..."}
          {stage === 'processing' &&
            (pipelineStep === 'generating_quests' || pipelineStep === 'generating_game_questions') &&
            "Generating real mini-games from your curriculum! No generic questions allowed."}
          {stage === 'processing' &&
            pipelineStep === 'validating_game_content' &&
            "Verifying answer keys and puzzle paths. Almost ready to play!"}
          {stage === 'review' &&
            "YOUR GAMES ARE READY! Every quest is a playable mini-game grounded in your syllabus."}
          {stage === 'manual_fallback' &&
            "No worries, hero. We can forge this course and its playable quests by hand!"}
          {errorMessage &&
            " A magical interruption occurred. Your existing data is safe. You can retry anytime."}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* STAGE 1: UPLOAD                                                   */}
      {/* ----------------------------------------------------------------- */}
      {stage === 'upload' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processSelectedFile(file);
            }}
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) processSelectedFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-purple-500/30 hover:border-cyan-400/50 rounded-2xl p-8 sm:p-12 text-center bg-[#131627]/60 hover:bg-[#161a30]/80 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto mb-4 group-hover:scale-110 group-hover:text-cyan-300 transition-all shadow-lg shadow-purple-900/20">
              <FileUp className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">
              Select or Drop Your Syllabus PDF
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Your syllabus automatically generates real playable mini-games: Do-or-Die survival hurdles, Quiz Battles, and Puzzle Quests.
            </p>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Don't have a PDF right now?</span>
            <button
              type="button"
              onClick={() => setStage('manual_fallback')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Create Course &amp; Quests Manually</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STAGE 2: 7-STEP ASYNCHRONOUS PROCESSING PIPELINE                   */}
      {/* ----------------------------------------------------------------- */}
      {stage === 'processing' && (
        <div className="py-6 px-4 space-y-6">
          <div className="text-center space-y-1">
            <h4 className="font-fantasy font-bold text-lg text-slate-100">
              Forging Playable Games from Syllabus...
            </h4>
            <p className="text-xs text-slate-400">
              Target preparation time: under 10 minutes (usually ready in seconds!)
            </p>
          </div>

          {/* Pipeline Visual Stepper */}
          <div className="p-4 rounded-2xl bg-[#11152a] border border-purple-500/20 space-y-3">
            {PIPELINE_STAGES.map((s, idx) => {
              const currentStepIdx = PIPELINE_STAGES.findIndex((st) => st.key === pipelineStep);
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={s.key}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/60 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                      : isPast
                      ? 'bg-[#0d1020] border-emerald-500/30 text-emerald-300'
                      : 'bg-[#0a0d18] border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isCurrent
                          ? 'bg-purple-600 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <div>
                      <span className={`text-xs font-semibold block ${isCurrent ? 'text-cyan-300 font-fantasy' : ''}`}>
                        {s.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {s.key === 'extracting_content' && extractionProgress > 0
                          ? `${s.desc} (${extractionProgress}%)`
                          : s.desc}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-mono text-purple-300 animate-pulse font-bold">
                      Processing...
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      Completed
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message and Recovery Options */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setStage('upload')}>
                  Back to Upload
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    executeAIAnalysis(
                      extractedText,
                      selectedFile?.name || 'syllabus.pdf',
                      selectedFile?.size || 0
                    )
                  }
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Retry Generation
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setStage('manual_fallback')}>
                  Add Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STAGE 3: REVIEW & START ADVENTURE                                  */}
      {/* ----------------------------------------------------------------- */}
      {stage === 'review' && (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Duplicate Course Warning */}
          {isDuplicateCourse && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                A course with this code or title already exists in your semester. Starting will update this course realm.
              </span>
            </div>
          )}

          {/* Course Name & Region */}
          <div className="p-4 rounded-2xl bg-[#14182c] border border-purple-500/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={reviewCourseName}
                  onChange={(e) => setReviewCourseName(e.target.value)}
                  className="w-full bg-[#0d1020] border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={reviewCourseCode}
                  onChange={(e) => setReviewCourseCode(e.target.value)}
                  className="w-full bg-[#0d1020] border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {pageCount > 0 && (
              <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Source: {selectedFile?.name || 'Uploaded Syllabus'}</span>
                <span>{pageCount} page{pageCount > 1 ? 's' : ''} ({wordCount.toLocaleString()} words)</span>
              </div>
            )}
          </div>

          {/* Generated Playable Quests Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-fantasy font-bold text-slate-200 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>
                Generated Playable Quests ({reviewUnits.reduce((acc, u) => acc + u.topics.length, 0)} Quests)
              </span>
            </h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {reviewUnits.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-[#14182c] border border-purple-500/15 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs font-semibold text-purple-300">
                    <span>{u.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {u.topics.length} Playable Quests
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {u.topics.map((t) => (
                      <div
                        key={t.id}
                        className="text-[11px] text-slate-300 bg-[#0d1020] p-2 rounded-xl border border-purple-500/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                              t.game_mode === 'do-or-die'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : t.game_mode === 'puzzle-quest'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {t.game_mode}
                          </span>
                          <span className="truncate">{t.quest_title || t.title}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.questions.length} Questions
                          </span>
                          <span className="text-amber-300 font-mono text-[10px] font-bold">
                            +50 XP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessments & Boss Fights */}
          <div className="space-y-2">
            <h4 className="text-xs font-fantasy font-bold text-slate-200 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Extracted Boss Encounters ({reviewMilestones.length} Exams / Assessments)</span>
            </h4>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {reviewMilestones.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-[#14182c] border border-rose-500/20 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-200 block truncate">{m.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {m.due_date ? `Due: ${m.due_date}` : 'Date TBA'} •{' '}
                      {m.weight_percent ? `Weight: ${m.weight_percent}%` : 'Standard Exam Scale'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-purple-300">
                      {m.questions?.length || 4} Boss Challenges
                    </span>
                    <span className="font-mono text-rose-400 font-bold">
                      {m.weight_percent ? `${Math.round(m.weight_percent * 10)} HP` : '200 HP'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStage('upload')}>
              Cancel
            </Button>

            <button
              type="button"
              onClick={handleStartMyAdventure}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-fantasy font-bold text-sm shadow-xl shadow-purple-900/40 border border-purple-400/40 transition-all active:scale-95 group"
            >
              <Play className="w-4 h-4 fill-cyan-300 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span>Start My Adventure</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STAGE 4: MANUAL FALLBACK                                          */}
      {/* ----------------------------------------------------------------- */}
      {stage === 'manual_fallback' && (
        <form onSubmit={handleSaveManualFallback} className="space-y-4">
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300">
            Create your course and initial study quest manually. We will automatically generate playable challenges for it!
          </div>

          {manualFormError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {manualFormError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Course Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={manualCourseName}
                onChange={(e) => setManualCourseName(e.target.value)}
                placeholder="e.g. Data Structures &amp; Algorithms"
                className="w-full bg-[#14182b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Course Code (Optional)
              </label>
              <input
                type="text"
                value={manualCourseCode}
                onChange={(e) => setManualCourseCode(e.target.value)}
                placeholder="e.g. CS-201"
                className="w-full bg-[#14182b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                First Unit / Module <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={manualUnitName}
                onChange={(e) => setManualUnitName(e.target.value)}
                placeholder="e.g. Linked Lists &amp; Pointer Operations"
                className="w-full bg-[#14182b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                First Quest Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={manualQuestTitle}
                onChange={(e) => setManualQuestTitle(e.target.value)}
                placeholder="e.g. Master Singly Linked Lists"
                className="w-full bg-[#14182b] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#14182b] border border-purple-500/15 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Optional Exam / Boss Fight
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={manualAssessmentName}
                  onChange={(e) => setManualAssessmentName(e.target.value)}
                  placeholder="e.g. Midterm 1"
                  className="w-full bg-[#0d1020] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Exam Date</label>
                <input
                  type="date"
                  value={manualAssessmentDate}
                  onChange={(e) => setManualAssessmentDate(e.target.value)}
                  className="w-full bg-[#0d1020] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Grading Weight %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={manualAssessmentWeight}
                  onChange={(e) => setManualAssessmentWeight(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full bg-[#0d1020] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStage('upload')}>
              Back to Upload
            </Button>
            <Button type="submit" variant="primary" size="md">
              <Play className="w-3.5 h-3.5 mr-1" />
              <span>Create Adventure</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
