import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords,
  Puzzle,
  Flame,
  Zap,
  Brain,
  Shield,
  FileText,
  BarChart3,
  Sparkles,
  Trophy,
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Heart,
  CheckCircle2,
} from 'lucide-react';

interface GameMode {
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  ctaText: string;
  route: string;
  backgroundImage: string;
}

const gameModesData: GameMode[] = [
  {
    name: 'Boss Slayer',
    tagline: 'Real-Time Multi-Phase RPG Combat',
    description:
      'Face off against towering syllabus bosses generated from midterms and final exams. Dodge incoming attacks and strike weaknesses with accurate course knowledge.',
    icon: <Swords className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'Fight Bosses',
    route: '/bosses',
    backgroundImage: '/_next/static/media/background.1g0xcnp65cqm_.jpg',
  },
  {
    name: 'Puzzle Quest',
    tagline: 'Concept Matching & Order Sequencing',
    description:
      'Solve syllabus-based interactive puzzles: match definitions to terms, sort historical or algorithmic steps in order, and drag-and-drop category classifications.',
    icon: <Puzzle className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'Solve Puzzles',
    route: '/quests',
    backgroundImage: '/_next/static/media/background.1ukge300x29ux.jpg',
  },
  {
    name: 'Do or Die',
    tagline: 'High-Octane Academic Runner',
    description:
      'Sprint through hazardous academic obstacle courses, collecting streak powerups and clearing rapid-fire syllabus checkpoints before time runs out.',
    icon: <Flame className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'Run Gauntlet',
    route: '/quests',
    backgroundImage: '/_next/static/media/background.0kzxmn3myd28s.jpg',
  },
  {
    name: 'Quiz Battle',
    tagline: 'Tactical Turn-Based Knowledge Arena',
    description:
      'Engage in tactical turn-based duels where deep syllabus knowledge charges your special abilities, restores player HP, and counters critical enemy debuffs.',
    icon: <Zap className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'Enter Arena',
    route: '/quests',
    backgroundImage: '/_next/static/media/background.3eqrinb036dmu.jpg',
  },
  {
    name: 'AI Syllabus Parser',
    tagline: 'Instant PDF Document Extraction',
    description:
      'Upload university course syllabi or exam schedules. Syllaborn automatically extracts grade weights, assessment dates, and generates course-specific challenges.',
    icon: <FileText className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'Upload PDF',
    route: '/dashboard',
    backgroundImage: '/_next/static/media/background.3fct0xenr1mod.jpg',
  },
  {
    name: 'Professor Panic & RPG Hub',
    tagline: 'Level Up, Streaks & Eccentric Banter',
    description:
      'Climb through student tiers from Freshman Fledgling to Academic Archmage while your eccentric professor guide reacts to every triumph and blunder.',
    icon: <Sparkles className="w-8 h-8 text-[#ff5623]" />,
    ctaText: 'View RPG Hub',
    route: '/dashboard',
    backgroundImage: '/_next/static/media/lunar-space.3u5cl68x8az_8.jpg',
  },
];

interface FeatureSlot {
  primary: { title: string; subtitle: string; icon: React.ReactNode };
  secondary: { title: string; subtitle: string; icon: React.ReactNode };
}

const featureSlotsData: FeatureSlot[] = [
  {
    primary: { title: 'PDF Ingestion', subtitle: 'Automated Text Extraction', icon: <FileText className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Smart Parsing', subtitle: 'Grade Weights & Dates', icon: <Brain className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Multi-Phase Bosses', subtitle: '3 Escalating Combat Stages', icon: <Swords className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Real-Time Combat', subtitle: 'Attacks, Dodges & Counters', icon: <Zap className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Matching Pairs', subtitle: 'Key Definitions & Terms', icon: <Puzzle className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Step Ordering', subtitle: 'Chronological Sequencing', icon: <Layers className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Do or Die Runner', subtitle: 'Hazard Sprinting Gameplay', icon: <Flame className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Rapid Checkpoints', subtitle: 'Timed Knowledge Gates', icon: <Clock className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Turn-Based Arena', subtitle: 'Tactical Quiz Battles', icon: <Shield className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Special Attacks', subtitle: 'Syllabus-Charged Skills', icon: <Sparkles className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'XP Progression', subtitle: 'Rank & Mastery Scaling', icon: <Trophy className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Academic Tiers', subtitle: 'Freshman to Archmage', icon: <CheckCircle2 className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Professor Panic', subtitle: 'Interactive Character Guide', icon: <Brain className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Live Commentary', subtitle: 'Contextual Reactions', icon: <Sparkles className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Daily Streaks', subtitle: 'Consistency Multipliers', icon: <Flame className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Streak Shields', subtitle: 'Missed-Day Protection', icon: <Shield className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Assessment Weighting', subtitle: 'HP Linked to Syllabus %', icon: <BarChart3 className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Difficulty Scaling', subtitle: 'Exam-Level Rigor', icon: <Zap className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Instant Feedback', subtitle: 'Explanations & Study Hints', icon: <CheckCircle2 className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Active Recall', subtitle: 'Spaced Memory Retrieval', icon: <Brain className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: '100% Local Storage', subtitle: 'Zero External Database', icon: <Shield className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Privacy Preserved', subtitle: 'Offline-First Security', icon: <Heart className="w-6 h-6 text-[#fdfcf4]" /> },
  },
  {
    primary: { title: 'Semester Roadmap', subtitle: 'Milestones & Deadlines', icon: <Compass className="w-6 h-6 text-[#ff5623]" /> },
    secondary: { title: 'Burndown Analytics', subtitle: 'Weekly Workload Tracking', icon: <BarChart3 className="w-6 h-6 text-[#fdfcf4]" /> },
  },
];

const footerGameModes = ['Boss Slayer RPG', 'Puzzle Quest', 'Do or Die Runner', 'Quiz Battle Arena'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [glitchingSlotIndex, setGlitchingSlotIndex] = useState<number | null>(null);
  const [activeSlotStates, setActiveSlotStates] = useState<boolean[]>(featureSlotsData.map(() => false));
  const [footerModeIndex, setFooterModeIndex] = useState(0);

  // Counter animation states
  const [statsVisible, setStatsVisible] = useState(false);
  const [modesCount, setModesCount] = useState(0);
  const [xpCount, setXpCount] = useState(0);
  const [privacyPercent, setPrivacyPercent] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Stats number counter animation
  useEffect(() => {
    if (!statsVisible) return;
    const duration = 1600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setModesCount(Math.round(ease * 4));
      setXpCount(Math.round(ease * 50));
      setPrivacyPercent(Math.round(ease * 100));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [statsVisible]);

  // Feature Glitch Interval (toggles slot every 2 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * featureSlotsData.length);
      setGlitchingSlotIndex(randomIndex);

      setTimeout(() => {
        setActiveSlotStates((prev) => {
          const next = [...prev];
          next[randomIndex] = !next[randomIndex];
          return next;
        });
      }, 200);

      setTimeout(() => {
        setGlitchingSlotIndex(null);
      }, 500);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  // Footer mode ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setFooterModeIndex((prev) => (prev + 1) % footerGameModes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="XAjNtG_variable _0mu-Sa_variable min-h-screen flex flex-col bg-black text-[#fdfcf4] antialiased selection:bg-[#ff5623] selection:text-[#fdfcf4]">
      {/* Top Header */}
      <header
        className={`pointer-events-auto w-full max-w-400 max-h-dvh pb-0 p-5 flex flex-col fixed top-0 z-50 transition-all duration-300 lg:gap-5 lg:left-[50%] lg:translate-x-[-50%] ${
          isMenuOpen ? 'bg-black' : isScrolled ? 'bg-black/85 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        {/* Sub-header game mode ticker (desktop) */}
        <div className="w-fit mask-[linear-gradient(to_bottom,black,black)] max-lg:hidden">
          <div className="flex items-center gap-6">
            <a
              href="#modes"
              className="flex items-center gap-2 opacity-65 hover:opacity-100 transition-opacity"
            >
              <Swords className="w-4 h-4 text-[#ff5623]" />
              <span className="text-xs font-mono tracking-tight">Boss Slayer RPG</span>
            </a>
            <div className="w-px h-6 bg-white/20" />
            <a
              href="#modes"
              className="flex items-center gap-2 opacity-65 hover:opacity-100 transition-opacity"
            >
              <Puzzle className="w-4 h-4 text-[#ff5623]" />
              <span className="text-xs font-mono tracking-tight">Puzzle Quest</span>
            </a>
            <div className="w-px h-6 bg-white/20" />
            <a
              href="#modes"
              className="flex items-center gap-2 opacity-65 hover:opacity-100 transition-opacity"
            >
              <Flame className="w-4 h-4 text-[#ff5623]" />
              <span className="text-xs font-mono tracking-tight">Do or Die Runner</span>
            </a>
            <div className="w-px h-6 bg-white/20" />
            <a
              href="#modes"
              className="flex items-center gap-2 opacity-65 hover:opacity-100 transition-opacity"
            >
              <Zap className="w-4 h-4 text-[#ff5623]" />
              <span className="text-xs font-mono tracking-tight">Quiz Battle Arena</span>
            </a>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div>
          <nav className="w-full max-w-400 mx-auto rounded-md flex items-center justify-between gap-10 max-lg:pb-5 lg:p-5 lg:bg-white/5 lg:backdrop-blur-xl border border-white/10">
            {/* Syllaborn Brand Mark */}
            <a className="cursor-pointer flex items-center gap-3" href="/">
              <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-gradient-to-tr from-[#ff5623] to-[#ff8450] p-[1px]">
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Swords className="w-4 h-4 text-[#ff5623]" />
                </div>
              </div>
              <span className="text-2xl font-mono tracking-tight font-bold text-[#fdfcf4]">
                SYLLABORN<span className="text-secondary">.</span>
              </span>
            </a>

            {/* Navigation links */}
            <div className="w-full flex justify-center gap-10 max-lg:hidden">
              <a
                className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                href="#hero"
              >
                <span className="whitespace-nowrap">Home</span>
              </a>
              <a
                className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                href="#stats"
              >
                <span className="whitespace-nowrap">Features</span>
              </a>
              <a
                className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                href="#modes"
              >
                <span className="whitespace-nowrap">Game Modes</span>
              </a>
              <a
                className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                href="#mechanics"
              >
                <span className="whitespace-nowrap">Mechanics</span>
              </a>
              <a
                className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                href="#cta"
              >
                <span className="whitespace-nowrap">Get Started</span>
              </a>
            </div>

            {/* Header Right Action */}
            <div className="flex items-center gap-4">
              <div className="w-full flex justify-end max-lg:hidden">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-fit bg-secondary px-8 py-3 flex justify-center items-center cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95 shadow-lg shadow-[#ff5623]/20"
                >
                  <span className="text-base font-mono whitespace-nowrap text-[#fdfcf4] font-medium flex items-center gap-2">
                    <span>Start Adventure</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>

              {/* Mobile hamburger button */}
              <button
                aria-pressed={isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-2.5 relative cursor-pointer before:w-full before:h-0.5 before:bg-white before:block before:absolute before:top-0 before:transition-all after:w-full after:h-0.5 after:bg-white after:block after:absolute after:bottom-0 after:transition-all aria-pressed:before:top-[50%] aria-pressed:before:translate-y-[-50%] aria-pressed:after:bottom-[50%] aria-pressed:after:translate-y-[50%] lg:hidden"
              />
            </div>
          </nav>
        </div>

        {/* Mobile menu overlay */}
        {isMenuOpen && (
          <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center gap-8 bg-black/95 backdrop-blur-2xl lg:hidden border-t border-white/10 mt-2">
            <a
              href="#hero"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-mono hover:text-[#ff5623]"
            >
              Home
            </a>
            <a
              href="#stats"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-mono hover:text-[#ff5623]"
            >
              Features
            </a>
            <a
              href="#modes"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-mono hover:text-[#ff5623]"
            >
              Game Modes
            </a>
            <a
              href="#mechanics"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-mono hover:text-[#ff5623]"
            >
              Mechanics
            </a>
            <a
              href="#cta"
              onClick={() => setIsMenuOpen(false)}
              className="text-2xl font-mono hover:text-[#ff5623]"
            >
              Get Started
            </a>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-64 bg-secondary py-3 text-center text-lg font-mono text-[#fdfcf4] font-medium"
            >
              Start Adventure
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-62.5 max-lg:gap-30 pt-0!">
        {/* HERO SECTION */}
        <section
          id="hero"
          className="max-w-full w-screen h-svh p-5 relative flex items-center justify-center overflow-hidden"
        >
          {/* Center Title & Crosshairs */}
          <div className="max-w-240 w-full flex items-center justify-center relative z-2">
            {/* Right Crosshairs */}
            <div className="size-7.5 absolute right-0">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-0 opacity-100"
              >
                <path d="M14.5 0H15.5V30H14.5V0Z" fill="#FDFCF4" />
                <path d="M30 14.5V15.5L0 15.5L4.37103e-08 14.5L30 14.5Z" fill="#FDFCF4" />
              </svg>
            </div>

            {/* Left Crosshairs */}
            <div className="size-7.5 absolute left-0">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-0 opacity-100"
              >
                <path d="M14.5 0H15.5V30H14.5V0Z" fill="#FDFCF4" />
                <path d="M30 14.5V15.5L0 15.5L4.37103e-08 14.5L30 14.5Z" fill="#FDFCF4" />
              </svg>
            </div>

            <div className="flex flex-col gap-5 text-center">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/20 w-fit mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5623]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#fdfcf4]">
                  AI-Powered Academic RPG
                </span>
              </div>

              <h1 className="text-[clamp(2.75rem,5.5vw,4.5rem)] text-center leading-none tracking-tight">
                Turn Your Syllabus <br />
                Into Your Next Play
              </h1>

              <p className="text-lg text-center font-mono max-lg:text-base opacity-80 max-w-xl mx-auto">
                Syllaborn converts course PDFs into playable mini-games, midterm boss raids, and
                semester quests with XP, levels, and persistent progress.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-secondary px-8 py-3.5 flex items-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff5623]/25"
                >
                  <span className="text-base font-mono text-[#fdfcf4] font-medium">
                    Upload Syllabus PDF
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#fdfcf4]" />
                </button>
                <a
                  href="#modes"
                  className="px-8 py-3.5 border border-white/20 bg-white/5 backdrop-blur-md font-mono text-base text-[#fdfcf4] hover:bg-white/10 transition-colors"
                >
                  Explore Mini-Games
                </a>
              </div>
            </div>
          </div>

          {/* Background Video (Atmospheric Gaming Backdrop) */}
          <div className="w-screen h-screen absolute overflow-hidden pointer-events-none opacity-45">
            <iframe
              src="https://customer-h4p7oej3n1ezm93w.cloudflarestream.com/2301c26cd0f7a61546f4b3b0b167038e/iframe?muted=true&preload=true&loop=true&autoplay=true&poster=https%3A%2F%2Fcustomer-h4p7oej3n1ezm93w.cloudflarestream.com%2F2301c26cd0f7a61546f4b3b0b167038e%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600&controls=false"
              loading="lazy"
              title="Syllaborn Background"
              className="w-screen h-screen absolute top-[50%] left-[50%] translate-[-50%] [@media(min-aspect-ratio:16/9)]:h-[56.25vw] [@media(max-aspect-ratio:16/9)]:w-[177.78vh] pointer-events-none border-0"
            />
          </div>
        </section>

        {/* STATS / FEATURES OVERVIEW SECTION */}
        <section
          id="stats"
          ref={statsRef}
          className="max-w-400 w-full px-5 mx-auto flex flex-col items-center gap-20 max-lg:gap-10"
        >
          <h2 className="text-[clamp(1.75rem,5vw,2.75rem)] text-center leading-none tracking-tight max-lg:text-left">
            Syllaborn combines <span className="text-secondary">AI syllabus parsing</span> with real
            interactive gameplay — transforming static deadlines into high-stakes quests, multi-phase
            bosses, and semester-long victories.
          </h2>

          <div className="w-full flex gap-5 max-lg:flex-col">
            {/* Stat 1 */}
            <div className="w-full aspect-7/5 bg-white/5 flex flex-col items-center justify-center border border-white/20 transition-all duration-300 hover:border-white/40">
              <span className="text-[clamp(4.25rem,8vw,8rem)] font-mono tracking-tight">
                {modesCount > 0 ? `${modesCount}` : '0'}
              </span>
              <span className="text-lg font-mono opacity-60 max-lg:text-base">
                Interactive Game Modes
              </span>
            </div>

            {/* Stat 2 */}
            <div className="w-full aspect-7/5 bg-white/5 flex flex-col items-center justify-center border border-white/20 transition-all duration-300 hover:border-white/40">
              <span className="text-[clamp(4.25rem,8vw,8rem)] font-mono tracking-tight">
                {xpCount > 0 ? `${xpCount}k+` : '0'}
              </span>
              <span className="text-lg font-mono opacity-60 max-lg:text-base">
                XP Earned Across Quests
              </span>
            </div>

            {/* Stat 3 */}
            <div className="w-full aspect-7/5 bg-white/5 flex flex-col items-center justify-center border border-white/20 transition-all duration-300 hover:border-white/40">
              <span className="text-[clamp(4.25rem,8vw,8rem)] font-mono tracking-tight">
                {privacyPercent > 0 ? `${privacyPercent}%` : '0'}
              </span>
              <span className="text-lg font-mono opacity-60 max-lg:text-base">
                Local-First & Offline Privacy
              </span>
            </div>
          </div>
        </section>

        {/* GAME MODES (6-CARD PORTFOLIO GRID) */}
        <section
          id="modes"
          className="max-w-400 w-full px-5 mx-auto flex flex-col gap-20 max-lg:gap-10"
        >
          <div className="flex flex-col items-center justify-center gap-5">
            <h2 className="text-center text-[clamp(1.75rem,5vw,2.75rem)] leading-none tracking-tight">
              Playable Academic Mini-Games
            </h2>
            <p className="max-w-180 text-center font-mono text-lg opacity-70 max-lg:text-base">
              Every course assessment, milestone, and exam becomes an interactive challenge tailored
              directly to your course topics.
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-5 max-lg:grid-cols-1">
            {gameModesData.map((mode, index) => (
              <div
                key={index}
                className="group w-full aspect-7/5 flex items-center justify-center relative max-lg:aspect-square overflow-hidden border border-white/10"
              >
                {/* Foreground Content */}
                <div className="flex flex-col items-center gap-4 relative z-2 p-8 text-center max-w-md">
                  <div className="p-3 rounded-md bg-white/10 backdrop-blur-md border border-white/10">
                    {mode.icon}
                  </div>

                  <h3 className="text-[clamp(2rem,4vw,2.75rem)] font-bold text-center leading-none tracking-tight text-[#fdfcf4]">
                    {mode.name}
                  </h3>

                  <span className="text-xs font-mono tracking-wider uppercase text-[#ff5623]">
                    {mode.tagline}
                  </span>

                  <p className="font-mono text-base text-center opacity-75 leading-relaxed line-clamp-3">
                    {mode.description}
                  </p>

                  <button
                    onClick={() => navigate(mode.route)}
                    className="w-fit bg-secondary px-8 py-2.5 mt-2 flex justify-center cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95"
                  >
                    <span className="text-sm font-mono whitespace-nowrap text-[#fdfcf4] font-medium flex items-center gap-2">
                      <span>{mode.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>

                {/* Background Image with Hover Scale */}
                <div className="w-full h-full absolute top-0 pointer-events-none z-1 overflow-hidden transition duration-500 group-hover:scale-75 after:w-full after:h-full after:bg-black after:absolute after:top-0 after:opacity-60 after:block">
                  <img
                    alt={`${mode.name} Background`}
                    className="object-cover w-full h-full opacity-100 blur-xs transition-all duration-500"
                    src={mode.backgroundImage}
                  />
                </div>

                {/* 4 Corner Crosshairs */}
                <div className="w-full h-full p-4 grid grid-cols-[auto_auto] justify-between content-between absolute top-0 opacity-100 z-[-1] transition duration-500 group-hover:scale-100 group-hover:opacity-100 scale-75 pointer-events-none">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <svg
                      key={i}
                      width="30"
                      height="30"
                      viewBox="0 0 30 30"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M14.5 0H15.5V30H14.5V0Z" fill="#FDFCF4" />
                      <path
                        d="M30 14.5V15.5L0 15.5L4.37103e-08 14.5L30 14.5Z"
                        fill="#FDFCF4"
                      />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MECHANICS & CAPABILITIES GLITCH GRID */}
        <section
          id="mechanics"
          className="max-w-400 w-full px-5 mx-auto flex flex-col gap-20 max-lg:gap-10"
        >
          <div className="flex flex-col items-center justify-center gap-5">
            <h2 className="text-center text-[clamp(1.75rem,5vw,2.75rem)] leading-none tracking-tight">
              Engineered for Academic Mastery
            </h2>
            <p className="max-w-180 text-center font-mono text-lg opacity-70 max-lg:text-base">
              Every quest, boss encounter, and puzzle is driven by syllabus-grounded AI, dynamic
              difficulty scaling, and pedagogical reinforcement.
            </p>
          </div>

          <div className="grid grid-cols-4 max-lg:grid-cols-2 border-t border-l border-white/10">
            {featureSlotsData.map((slot, slotIndex) => {
              const isToggled = activeSlotStates[slotIndex];
              const isGlitching = glitchingSlotIndex === slotIndex;
              const activeItem = isToggled ? slot.secondary : slot.primary;

              return (
                <div
                  key={slotIndex}
                  className="w-full aspect-4/3 flex flex-col items-center justify-center relative pointer-events-none border-b border-r border-white/10 p-6 overflow-hidden text-center transition-all duration-300"
                >
                  <div
                    className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                      isGlitching ? 'scale-105 filter drop-shadow-[2px_0_0_#ff5623]' : 'scale-100'
                    }`}
                  >
                    <div className="mb-1 p-2 rounded-full bg-white/5 border border-white/10">
                      {activeItem.icon}
                    </div>
                    <span className="font-mono font-bold text-base tracking-tight text-[#fdfcf4]">
                      {activeItem.title}
                    </span>
                    <span className="font-mono text-xs opacity-60 uppercase tracking-wider">
                      {activeItem.subtitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA SECTION */}
        <section
          id="cta"
          className="max-w-full w-screen h-screen p-5 relative flex items-center justify-center overflow-hidden max-lg:max-h-175"
        >
          {/* Background Image */}
          <div className="w-full h-full absolute flex items-center justify-center">
            <img
              alt="Call to Action"
              loading="lazy"
              className="object-cover w-full h-full brightness-50"
              src="/_next/static/media/studio.3wbsa-185wa4x.jpg"
            />
          </div>

          {/* Crosshairs & Content */}
          <div className="max-w-240 w-full flex items-center justify-center relative z-2">
            {/* Right Crosshair */}
            <div className="size-7.5 absolute right-0">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-0 opacity-100"
              >
                <path d="M14.5 0H15.5V30H14.5V0Z" fill="#FDFCF4" />
                <path d="M30 14.5V15.5L0 15.5L4.37103e-08 14.5L30 14.5Z" fill="#FDFCF4" />
              </svg>
            </div>

            {/* Left Crosshair */}
            <div className="size-7.5 absolute left-0">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute top-0 opacity-100"
              >
                <path d="M14.5 0H15.5V30H14.5V0Z" fill="#FDFCF4" />
                <path d="M30 14.5V15.5L0 15.5L4.37103e-08 14.5L30 14.5Z" fill="#FDFCF4" />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5623]/20 border border-[#ff5623]/40 text-[#ff8450] text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NO ACCOUNTS REQUIRED • 100% OFFLINE FIRST</span>
              </div>

              <h2 className="text-[clamp(2rem,5vw,3.75rem)] text-center leading-none tracking-tight font-bold">
                Ready to Conquer Your Semester?
              </h2>

              <p className="text-lg text-center font-mono opacity-75 max-lg:text-base max-w-xl">
                Upload your course syllabus PDF, let our AI extract your academic quests, and level up
                your grades with interactive games.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-fit bg-secondary px-10 py-3.5 flex justify-center items-center cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff5623]/25"
                >
                  <span className="text-base font-mono whitespace-nowrap text-[#fdfcf4] font-medium flex items-center gap-2">
                    <span>Enter Syllaborn</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
                <button
                  onClick={() => navigate('/quest-map')}
                  className="w-fit border border-white/20 bg-white/5 backdrop-blur-md px-8 py-3.5 font-mono text-base text-[#fdfcf4] hover:bg-white/10 transition-colors"
                >
                  View Quest Map
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="max-w-400 w-full min-h-95 p-5 pt-62.5 mx-auto flex flex-col justify-between gap-15 max-lg:pt-30 border-t border-white/10 mt-20">
        <div className="w-full grid grid-cols-[1fr_0.75fr] gap-10 max-lg:grid-cols-1">
          <div className="flex flex-col gap-7 justify-between">
            <h2 className="text-[clamp(1.75rem,5vw,3rem)] leading-none tracking-tight">
              Crafting academic games <br className="max-xl:hidden" /> trusted by ambitious
              students.
            </h2>

            {/* Logo Ticker */}
            <div className="w-full flex items-center gap-7 pointer-events-none overflow-hidden max-lg:gap-5">
              <div className="max-w-fit h-full flex items-center gap-3">
                <div className="w-7 h-7 rounded-sm bg-gradient-to-tr from-[#ff5623] to-[#ff8450] p-[1px]">
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <Swords className="w-3.5 h-3.5 text-[#ff5623]" />
                  </div>
                </div>
                <span className="text-xl font-mono font-bold text-[#fdfcf4]">SYLLABORN</span>
              </div>

              <div className="w-px h-14 bg-white/20" />

              <div className="w-1/2 h-14 relative flex items-center">
                <span className="text-base font-mono text-[#ff8450] tracking-wider uppercase font-semibold">
                  {footerGameModes[footerModeIndex]}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-flow-col gap-10">
            <div className="flex flex-col gap-6">
              <h4 className="text-xl opacity-60 font-mono">Navigation</h4>
              <div className="flex flex-col gap-3">
                <a
                  className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                  href="#hero"
                >
                  <span className="whitespace-nowrap">Home</span>
                </a>
                <a
                  className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                  href="#stats"
                >
                  <span className="whitespace-nowrap">Features</span>
                </a>
                <a
                  className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                  href="#modes"
                >
                  <span className="whitespace-nowrap">Game Modes</span>
                </a>
                <a
                  className="text-base font-mono flex gap-2 transition hover:text-[#ff5623]"
                  href="#mechanics"
                >
                  <span className="whitespace-nowrap">Mechanics</span>
                </a>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Dashboard</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h4 className="text-xl opacity-60 font-mono">Adventure</h4>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/quests')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Quest Log</span>
                </button>
                <button
                  onClick={() => navigate('/bosses')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Boss Battles</span>
                </button>
                <button
                  onClick={() => navigate('/quest-map')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Semester Map</span>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Analytics</span>
                </button>
                <button
                  onClick={() => navigate('/rewards')}
                  className="text-base font-mono text-left transition hover:text-[#ff5623]"
                >
                  <span className="whitespace-nowrap">Trophy Case</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Credits */}
        <div className="w-full flex items-center justify-between gap-3 max-lg:flex-col max-lg:items-start pt-8 border-t border-white/5">
          <span className="font-mono max-lg:opacity-60 text-sm">
            2026© Syllaborn | All Rights Reserved
          </span>

          <div className="flex gap-6">
            <span className="text-sm font-mono opacity-60">
              Offline-First & LocalStorage Powered
            </span>
            <span className="text-sm font-mono opacity-60">
              Zero External Database Required
            </span>
          </div>

          <span className="font-mono text-sm">
            Turn Your Syllabus Into Your Next Adventure
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
