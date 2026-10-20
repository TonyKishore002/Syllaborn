import React, { useState, useEffect } from 'react';
import {
  Swords,
  Heart,
  Shield,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameQuestion, QuestGameConfig } from '../../types';
import { getProfessorPanicComment } from '../../lib/professor-panic';
import { soundFX } from '../../lib/audio-effects';

interface QuizBattleGameProps {
  gameConfig: QuestGameConfig;
  onComplete: (score: number) => void;
  courseCode?: string;
  courseTitle?: string;
  isBossEncounter?: boolean;
  bossHpOverride?: number;
}

export const QuizBattleGame: React.FC<QuizBattleGameProps> = ({
  gameConfig,
  onComplete,
  courseCode,
  courseTitle,
  isBossEncounter = false,
  bossHpOverride,
}) => {
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  const questions: GameQuestion[] =
    gameConfig.questions && gameConfig.questions.length > 0
      ? gameConfig.questions
      : [
          {
            id: 'q1',
            question: `What fundamental principle defines ${gameConfig.topic}?`,
            options: [
              `The core structural and behavioral model of ${gameConfig.topic}`,
              'An unregulated arbitrary parameter',
              'An obsolete convention without modern application',
              'A purely decorative syntax tag',
            ],
            correctAnswerIndex: 0,
            explanation: `${gameConfig.topic} is an essential academic foundation in this syllabus.`,
            hint: 'Select the statement outlining the structural and behavioral model.',
          },
        ];

  // Monster stats
  const totalQuestions = questions.length;
  const maxMonsterHp = bossHpOverride || (isBossEncounter ? 200 : totalQuestions * 35);
  const damagePerHit = Math.ceil(maxMonsterHp / totalQuestions);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(maxMonsterHp);
  const [playerShields, setPlayerShields] = useState(3);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'none' | 'attacking' | 'wrong' | 'won'>('none');
  const [floatingDamage, setFloatingDamage] = useState<number | null>(null);
  const [monsterAnimation, setMonsterAnimation] = useState<'idle' | 'hit' | 'attack' | 'defeat'>('idle');
  const [heroAnimation, setHeroAnimation] = useState<'idle' | 'attack' | 'hit'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [professorMessage, setProfessorMessage] = useState<string>(
    isBossEncounter
      ? "THE EXAMINATION BOSS HAS RISEN! Strike with your knowledge!"
      : `A syllabus monster approaches! Defeat it with ${gameConfig.topic} concepts!`
  );
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentQIndex] || questions[0];

  // Funny Monster Name Generation
  const monsterName = isBossEncounter
    ? `The Overlord of ${gameConfig.topic}`
    : `The ${gameConfig.topic.split(' ')[0]} Golem`;

  const monsterFace = () => {
    if (monsterAnimation === 'defeat') return '😵‍💫';
    if (monsterAnimation === 'hit') return '😣';
    if (monsterAnimation === 'attack') return '😈';
    const hpPercent = (monsterHp / maxMonsterHp) * 100;
    if (hpPercent > 66) return isBossEncounter ? '🐉' : '👾';
    if (hpPercent > 33) return isBossEncounter ? '👹' : '🧟';
    return isBossEncounter ? '💀' : '🫠';
  };

  const handleSelectOption = (idx: number) => {
    if (feedbackState !== 'none') return;
    setSelectedOption(idx);

    const isCorrect = idx === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      soundFX.playAttack();
      setHeroAnimation('attack');
      setFeedbackState('attacking');

      setTimeout(() => {
        soundFX.playCorrect();
        setMonsterAnimation('hit');
        const damage = damagePerHit;
        setFloatingDamage(damage);

        setMonsterHp((prev) => {
          const nextHp = Math.max(0, prev - damage);
          return nextHp;
        });

        setScore((s) => s + 50);
        setProfessorMessage(getProfessorPanicComment('correct'));

        setTimeout(() => {
          setFloatingDamage(null);
          setHeroAnimation('idle');
          setMonsterAnimation('idle');

          const nextIndex = currentQIndex + 1;
          if (nextIndex >= totalQuestions || monsterHp - damage <= 0) {
            // Monster Defeated!
            setMonsterAnimation('defeat');
            setFeedbackState('won');
            soundFX.playVictory();
            setProfessorMessage(
              isBossEncounter
                ? getProfessorPanicComment('boss_victory')
                : getProfessorPanicComment('quest_complete')
            );
          } else {
            setCurrentQIndex(nextIndex);
            setSelectedOption(null);
            setFeedbackState('none');
            setShowHint(false);
          }
        }, 1200);
      }, 400);
    } else {
      soundFX.playWrong();
      setFeedbackState('wrong');
      setMonsterAnimation('attack');
      setHeroAnimation('hit');
      setPlayerShields((s) => Math.max(1, s - 1));
      setProfessorMessage(getProfessorPanicComment('wrong'));

      setTimeout(() => {
        setMonsterAnimation('idle');
        setHeroAnimation('idle');
      }, 600);
    }
  };

  const handleRetryQuestion = () => {
    setFeedbackState('none');
    setSelectedOption(null);
    setProfessorMessage(getProfessorPanicComment('retry'));
  };

  const handleFinishBattle = () => {
    onComplete(score + (isBossEncounter ? 150 : 50));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1022] text-slate-100 rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl">
      {/* HUD Header */}
      <div className="px-5 py-3 bg-[#131730] border-b border-purple-500/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">{isBossEncounter ? '👑' : '⚔️'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-fantasy font-bold text-sm text-slate-100">
                {isBossEncounter ? 'EXAMINATION BOSS FIGHT' : 'QUIZ BATTLE ARENA'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {courseCode || 'COURSE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Question {currentQIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>+{score} XP</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const m = soundFX.toggleMute();
              setIsMuted(m);
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Professor Panic Commentary Bar */}
      <div className="px-5 py-2.5 bg-gradient-to-r from-purple-950/40 to-slate-900 border-b border-purple-500/15 flex items-center gap-2.5 text-xs text-purple-200">
        <span className="text-lg">🧙‍♂️</span>
        <div className="flex-1">
          <span className="font-fantasy font-bold text-cyan-300 mr-2 text-[11px] uppercase tracking-wider">
            Professor Panic:
          </span>
          <span className="italic">{professorMessage}</span>
        </div>
      </div>

      {/* Combat Visual Stage */}
      <div className="px-6 py-6 bg-gradient-to-b from-[#10132b] to-[#0a0d1e] flex flex-col justify-between gap-6 relative border-b border-purple-500/15">
        {/* Monster HP Bar */}
        <div className="max-w-md mx-auto w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs font-fantasy font-bold">
            <span className="text-rose-300 flex items-center gap-1.5">
              <span>{monsterName}</span>
            </span>
            <span className="font-mono text-slate-300">
              {monsterHp} / {maxMonsterHp} HP
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-950/80 rounded-full border border-rose-500/30 p-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, (monsterHp / maxMonsterHp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Combatants Arena */}
        <div className="flex items-center justify-around max-w-xl mx-auto w-full py-4 relative">
          {/* Hero Side */}
          <div
            className={`flex flex-col items-center gap-2 transition-transform duration-200 ${
              heroAnimation === 'attack'
                ? 'translate-x-8 scale-110'
                : heroAnimation === 'hit'
                ? '-translate-x-4 opacity-70'
                : ''
            }`}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-2 border-cyan-400/40 flex items-center justify-center text-4xl shadow-xl shadow-cyan-950/40">
              🧙
            </div>
            <span className="font-fantasy font-bold text-xs text-cyan-300">Scholar Hero</span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Shield
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < playerShields
                      ? 'text-cyan-400 fill-cyan-400/40'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Floating Damage Indicator */}
          {floatingDamage && (
            <div className="absolute top-2 right-24 animate-bounce font-fantasy font-black text-2xl text-amber-300 drop-shadow-md z-10">
              -{floatingDamage} HP!
            </div>
          )}

          {/* VS Icon */}
          <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-xs font-fantasy font-black text-purple-300">
            VS
          </div>

          {/* Monster Side */}
          <div
            className={`flex flex-col items-center gap-2 transition-transform duration-200 ${
              monsterAnimation === 'hit'
                ? 'translate-x-6 scale-90 rotate-6'
                : monsterAnimation === 'attack'
                ? '-translate-x-8 scale-110'
                : monsterAnimation === 'defeat'
                ? 'opacity-40 scale-75 rotate-45'
                : 'animate-pulse'
            }`}
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border-2 border-rose-400/40 flex items-center justify-center text-5xl shadow-xl shadow-rose-950/40">
              {monsterFace()}
            </div>
            <span className="font-fantasy font-bold text-xs text-rose-300">{monsterName}</span>
          </div>
        </div>
      </div>

      {/* Questions & Battle Command Cards */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 overflow-y-auto">
        {feedbackState !== 'won' ? (
          <>
            {/* Question Header & Hint */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-purple-300 font-bold uppercase tracking-wider">
                  Attack Question {currentQIndex + 1}/{totalQuestions}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Hint?'}</span>
                </button>
              </div>

              {showHint && currentQuestion.hint && (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{currentQuestion.hint}</span>
                </div>
              )}

              <p className="font-semibold text-sm sm:text-base text-slate-100 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Attack Options Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQuestion.options.map((option, idx) => {
                let btnStyle =
                  'bg-[#141830] border-purple-500/20 text-slate-200 hover:bg-purple-900/30 hover:border-purple-400/50';

                if (feedbackState === 'attacking' && idx === currentQuestion.correctAnswerIndex) {
                  btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-2 ring-emerald-500/40';
                } else if (feedbackState === 'wrong') {
                  if (idx === currentQuestion.correctAnswerIndex) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/40';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={feedbackState !== 'none'}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Wrong Answer Feedback & Retry */}
            {feedbackState === 'wrong' && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs space-y-2 animate-in zoom-in-95">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">
                      Attack Missed! The monster counter-attacked!
                    </span>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleRetryQuestion}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-fantasy text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Victory Banner */
          <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-emerald-950/40">
              🏆
            </div>
            <div>
              <h3 className="font-fantasy font-black text-xl text-slate-100">
                {isBossEncounter ? 'EXAM BOSS VANQUISHED!' : 'MONSTER DEFEATED!'}
              </h3>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                You successfully answered the syllabus challenges!
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinishBattle}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-fantasy font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all active:scale-95"
            >
              Claim Quest Rewards (+{score + (isBossEncounter ? 150 : 50)} XP) ⚔️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
