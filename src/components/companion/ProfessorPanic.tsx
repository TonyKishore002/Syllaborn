import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X, Volume2, ShieldAlert } from 'lucide-react';
import { useSyllaborn } from '../../hooks/useSyllaborn';

export type PanicMood = 'idle' | 'thinking' | 'confused' | 'worried' | 'cheering' | 'victory' | 'error';

interface ProfessorPanicProps {
  moodOverride?: PanicMood;
  customMessage?: string;
  className?: string;
}

const DIALOGUES = {
  chill: {
    idle: [
      "Ready to defeat one tiny academic monster today?",
      "One quest at a time, hero. Even dragons have office hours.",
      "Pacing ourselves is the true arcane secret. One milestone at a time.",
      "Your syllabus is mapped. The path ahead is clear.",
      "Remember to take water breaks between boss encounters, scholar.",
      "Steady progress conquers even the most terrifying finals.",
    ],
    worried: [
      "Boss approaching! Let's prepare before the dramatic music starts.",
      "A high-stakes examination approaches on the horizon. Let us prepare calmly.",
      "Deadlines are gathering ahead. A good moment to review your quest log.",
    ],
    cheering: [
      "Quest completed! Your brain has gained experience.",
      "Splendid work. Your academic foundation grows stronger.",
      "Another milestone conquered with grace and discipline.",
    ],
    victory: [
      "You're officially one level less confused.",
      "Triumph! Your dedication shines brightly across the semester.",
      "Level up achieved! Your persistence is bearing fruit.",
    ],
    error: [
      "The intelligence portal is momentarily dormant. Your saved quests remain secure.",
    ],
  },
  playful: {
    idle: [
      "Ready to defeat one tiny academic monster today?",
      "One quest at a time, hero. Even dragons have office hours.",
      "A new syllabus has entered the arena. Stay calm.",
      "I'm keeping an eye on the calendar. And by eye, I mean magical panic radar.",
      "Did you know? Studying 15 minutes today prevents 4 hours of 2 AM crying later.",
      "My book says 'PANIC' on the cover, but in friendly neon letters!",
    ],
    worried: [
      "Boss approaching! Let's prepare before the dramatic music starts.",
      "YOU HAVE A BOSS FIGHT LOOMING! Have you equipped your Legendary Coffee Flask?",
      "The deadline dragon is circling overhead. Do not make eye contact, just submit the assignment!",
    ],
    cheering: [
      "Quest completed! Your brain has gained experience.",
      "YOUR NEURONS HAVE FILED A COMPLAINT, BUT VICTORY IS YOURS!",
      "Quest vanquished! Take that, syllabus of doom!",
    ],
    victory: [
      "You're officially one level less confused.",
      "LEVEL UP! Your academic aura has increased by one suspiciously magical unit!",
      "VICTORY FANFARE! You are officially 12% more unstoppable than yesterday!",
    ],
    error: [
      "The intelligence portal is down. Even magical infrastructure needs maintenance. Your saved quests are safe.",
    ],
  },
  chaotic: {
    idle: [
      "Ready to defeat one tiny academic monster today?!",
      "One quest at a time, hero! Even dragons have office hours!",
      "A new syllabus has entered the arena. Stay calm! (Or scream slightly, I won't judge).",
      "AN ANCIENT SCROLL! Please tell me it doesn't contain 47 pages of unit-wise suffering.",
      "You're collecting quests like Pokémon. Perhaps we should complete one?!",
      "If we don't start this essay now, the Procrastination Goblin will eat our GPA!",
    ],
    worried: [
      "Boss approaching! Let's prepare before the dramatic music starts!",
      "CODE PURPLE! CODE PURPLE! THIS EXAM IS WORTH 30% OF YOUR MORTAL EXISTENCE!",
      "I am vibrating at 400 hertz out of pure academic tension! LOOK AT THE DUE DATE!",
    ],
    cheering: [
      "Quest completed! Your brain has gained experience!",
      "BOOM! CRITICAL HIT ON ACADEMIC DESPAIR! XP RAINING EVERYWHERE!",
      "WHO'S A CERTIFIED SYLLABUS CONQUEROR? YOU ARE! GO TOUCH SOME GRASS BRIEFLY!",
    ],
    victory: [
      "You're officially one level less confused!",
      "ASCENSION! THE ACADEMIC GODS WEEP TEARS OF JOY AND CONFUSION!",
      "LEVEL UP MADNESS! YOUR WIZARD HAT JUST GREW THREE INCHES IN THE ETHEREAL PLANE!",
    ],
    error: [
      "THE AI PORTAL SNEEZED! Don't panic! Well, I will panic for you, but your local quests are completely safe!",
    ],
  },
};

export const ProfessorPanic: React.FC<ProfessorPanicProps> = ({
  moodOverride,
  customMessage,
  className = '',
}) => {
  const { settings, milestones, levelInfo } = useSyllaborn();
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);

  const humorMode = settings.humorIntensity || 'playful';

  // Determine mood dynamically from application state if no override
  const dynamicMood: PanicMood = useMemo(() => {
    if (moodOverride) return moodOverride;

    const pendingHighStakes = milestones.filter(
      (m) =>
        m.status === 'pending' &&
        (m.difficultyCategory === 'boss_fight' || m.difficultyCategory === 'final_raid')
    );

    if (pendingHighStakes.length > 2) return 'worried';
    if (milestones.length > 0 && milestones.every((m) => m.status === 'completed')) return 'victory';

    return 'idle';
  }, [moodOverride, milestones]);

  // Select message pool
  const activePool = useMemo(() => {
    const category = DIALOGUES[humorMode] || DIALOGUES.playful;
    const moodKey = dynamicMood in category ? (dynamicMood as keyof typeof category) : 'idle';
    return category[moodKey] || category.idle;
  }, [humorMode, dynamicMood]);

  const currentMessage = useMemo(() => {
    if (customMessage) return customMessage;
    return activePool[currentLineIndex % activePool.length];
  }, [customMessage, activePool, currentLineIndex]);

  // Cycle message periodically or on click
  const cycleMessage = () => {
    setCurrentLineIndex((prev) => (prev + 1) % activePool.length);
    setIsBubbleOpen(true);
  };

  if (!settings.companionVisibility) {
    return null;
  }

  return (
    <div className={`relative flex items-end gap-3 select-none ${className}`}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {isBubbleOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-xs md:max-w-sm rounded-2xl p-3.5 bg-gradient-to-br from-[#181a30]/95 to-[#0f1122]/95 border border-purple-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-md text-xs md:text-sm text-slate-200"
          >
            {/* Triangular pointer */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-purple-500/40" />

            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400 font-fantasy tracking-wider text-[11px] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Prof. Panic (Lvl {levelInfo.level} Advisor)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBubbleOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                title="Dismiss bubble"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="leading-relaxed text-slate-200 font-medium cursor-pointer" onClick={cycleMessage}>
              "{currentMessage}"
            </p>

            <div className="mt-2 pt-2 border-t border-purple-500/15 flex items-center justify-between text-[10px] text-slate-400">
              <span className="italic">Click wizard for more wisdom</span>
              <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {humorMode} mode
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professor Panic Wizard Avatar */}
      <motion.button
        type="button"
        onClick={cycleMessage}
        className="relative group p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="Professor Panic — Click for commentary!"
      >
        {/* Glow Aura */}
        <div
          className={`absolute inset-0 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity ${
            dynamicMood === 'worried'
              ? 'bg-rose-500'
              : dynamicMood === 'victory'
              ? 'bg-amber-400'
              : dynamicMood === 'error'
              ? 'bg-orange-500'
              : 'bg-gradient-to-tr from-purple-600 via-cyan-500 to-pink-500'
          }`}
        />

        {/* Wizard SVG Artwork */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#121424] border-2 border-cyan-400/50 p-1 shadow-lg flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
              <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>

            {/* Glowing Aura Inside */}
            <circle cx="50" cy="50" r="45" fill="#090b14" />

            {/* Wizard Body / Robe */}
            <path d="M28 85 Q50 65 72 85 L76 96 L24 96 Z" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />

            {/* Beard */}
            <path d="M38 58 Q50 82 62 58 Q50 72 38 58 Z" fill="#e2e8f0" />

            {/* Face */}
            <circle cx="50" cy="50" r="14" fill="#fed7aa" />

            {/* Expressive Eyes */}
            {dynamicMood === 'worried' ? (
              // Wide terrified eyes
              <>
                <circle cx="45" cy="48" r="4" fill="#ffffff" />
                <circle cx="45" cy="48" r="2" fill="#000000" />
                <circle cx="55" cy="48" r="4" fill="#ffffff" />
                <circle cx="55" cy="48" r="2" fill="#000000" />
              </>
            ) : dynamicMood === 'victory' || dynamicMood === 'cheering' ? (
              // Happy crescent eyes
              <>
                <path d="M42 49 Q45 44 48 49" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M52 49 Q55 44 58 49" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            ) : dynamicMood === 'confused' ? (
              // One raised eye
              <>
                <circle cx="44" cy="49" r="2.5" fill="#1e1b4b" />
                <circle cx="56" cy="46" r="3.5" fill="#1e1b4b" />
                <path d="M53 41 Q56 39 59 41" stroke="#1e1b4b" strokeWidth="1.5" fill="none" />
              </>
            ) : (
              // Normal wise eyes
              <>
                <circle cx="45" cy="48" r="2.5" fill="#1e1b4b" />
                <circle cx="55" cy="48" r="2.5" fill="#1e1b4b" />
                <circle cx="46" cy="47" r="0.8" fill="#ffffff" />
                <circle cx="56" cy="47" r="0.8" fill="#ffffff" />
              </>
            )}

            {/* Oversized Wizard Hat */}
            <motion.g
              animate={
                dynamicMood === 'worried'
                  ? { rotate: [-2, 2, -2] }
                  : dynamicMood === 'victory'
                  ? { y: [-2, 0, -2] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {/* Hat brim */}
              <ellipse cx="50" cy="40" rx="26" ry="6" fill="#6d28d9" stroke="#c084fc" strokeWidth="1.5" />
              {/* Hat cone */}
              <path d="M26 39 Q50 8 72 16 Q58 28 74 39 Z" fill="url(#hatGrad)" stroke="#c084fc" strokeWidth="1.5" />
              {/* Hat star badge */}
              <circle cx="48" cy="28" r="2.5" fill="#fbbf24" />
            </motion.g>

            {/* Glowing Staff (held in left hand) */}
            <motion.g
              animate={{ rotate: [-1, 2, -1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ transformOrigin: '20px 85px' }}
            >
              <line x1="18" y1="92" x2="22" y2="35" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
              {/* Staff Crystal Orb */}
              <circle cx="22" cy="33" r="5.5" fill="url(#orbGrad)" />
              <circle cx="22" cy="33" r="7" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
            </motion.g>

            {/* The Famous PANIC Book (held in right hand) */}
            <g transform="translate(62, 60) rotate(10)">
              <rect x="0" y="0" width="18" height="24" rx="2" fill="#be123c" stroke="#f43f5e" strokeWidth="1" />
              <line x1="3" y1="0" x2="3" y2="24" stroke="#fb7185" strokeWidth="1" />
              {/* Text 'PANIC' */}
              <text x="5" y="14" fontSize="4.5" fontWeight="bold" fill="#fef08a" fontFamily="sans-serif">
                PANIC
              </text>
            </g>
          </svg>
        </div>
      </motion.button>
    </div>
  );
};
