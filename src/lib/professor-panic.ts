// Professor Panic Commentary Engine
// Provides humorous, encouraging, and topic-aware reactions to gameplay events

export type PanicMood =
  | 'correct'
  | 'wrong'
  | 'retry'
  | 'quest_complete'
  | 'boss_victory'
  | 'puzzle_match'
  | 'puzzle_wrong'
  | 'puzzle_hint'
  | 'puzzle_order_wrong'
  | 'puzzle_order_correct'
  | 'boss_dodge_incoming'
  | 'boss_dodge_success'
  | 'boss_phase2'
  | 'boss_phase3'
  | 'boss_player_low_hp'
  | 'boss_potion_used'
  | 'boss_defeat'
  | 'idle';

const CORRECT_DIALOGUES = [
  "GENIUS MOVE! The hole has been denied its lunch.",
  "BRILLIANT! That obstacle just vaporized into pure academic glory.",
  "SUPERB! Even I couldn't have deduced that with such speed.",
  "CLEVER HERO! The syllabus smiles upon your neurons.",
  "PRECISION HIT! That concept never stood a chance.",
  "OUTSTANDING! Your GPA just let out a sigh of relief."
];

const WRONG_DIALOGUES = [
  "DOWN YOU GO! At least gravity is still functioning correctly.",
  "OH NO! You have been claimed by the Hole of Incorrect Assumptions!",
  "SPLASH! A minor detour into the Pit of Overthinking.",
  "OUCH! That platform collapsed faster than an uncompiled build.",
  "DOWN TO THE VOID! The syllabus monster strikes with surprising accuracy.",
  "TRIPPED! The laws of academic physics remain undefeated."
];

const RETRY_DIALOGUES = [
  "Another attempt! Even legendary heroes occasionally confuse their queues with their stacks.",
  "Back on your feet! The syllabus doesn't defeat you, it only tempers your steel.",
  "Take a breath! Wisdom is just failure after it's had coffee.",
  "Dust yourself off! That checkpoint is begging for a rematch.",
  "No shame in a retry! Even Einstein had to erase a few blackboards."
];

const QUEST_COMPLETE_DIALOGUES = [
  "VICTORY! Your brain has received a suspicious amount of XP.",
  "CONQUEST ACHIEVED! Another syllabus topic bends to your will!",
  "MAGNIFICENT! You have earned your academic laurels today.",
  "TOPIC MASTERED! One step closer to semester legend status.",
  "CLEARED! You danced through that challenge with textbook elegance."
];

const BOSS_VICTORY_DIALOGUES = [
  "THE BOSS HAS FALLEN! I definitely wasn't hiding behind that rock.",
  "UNBELIEVABLE! The examination colossus has crumbled to dust!",
  "HUZZAH! You have vanquished the semester nightmare itself!",
  "EXTRAORDINARY! You just slayed a midterm with your bare intellect!",
  "VICTORY ROYALE! The syllabus dragon has signed your passing grade."
];

const BOSS_DODGE_INCOMING_DIALOGUES = [
  "INCOMING ATTACK! Hit DODGE or Spacebar before your GPA drops!",
  "WATCH OUT! The boss is winding up a syllabus smash! DODGE!",
  "DODGE ALERT! Move! That attack carries a 30% grading weight penalty!",
  "DANGER! Telegraph detected! Evade or answer immediately to interrupt!"
];

const BOSS_DODGE_SUCCESS_DIALOGUES = [
  "MAGNIFICENT EVASION! You dodged like a student avoiding an 8 AM lecture!",
  "PARRIED! Clean footwork! The syllabus attack strikes empty air!",
  "CLEAN DODGE! That exam curve missed you completely!",
  "INSPECTOR PANIC APPROVES! 0 damage taken, pure agility!"
];

const BOSS_PHASE2_DIALOGUES = [
  "PHASE 2 UNLOCKED! The boss is enraged! Questions now require active problem solving!",
  "WARNING! The colossus entered Phase 2! Theory is over, application begins!",
  "LOOK ALIVE! The attacks are faster and the scenarios are trickier!",
  "ENRAGED STATE! Synthesize your concepts or face academic ruin!"
];

const BOSS_PHASE3_DIALOGUES = [
  "FINAL EXAM OVERDRIVE! Cross-unit questions converging! Everything is on the test!",
  "MAY THE CURVE BE WITH YOU! Phase 3 combines all syllabus units into one storm!",
  "MAXIMUM DIFFICULTY! Do not guess randomly—mastery is required!",
  "THIS IS IT! The cumulative final exam boss unleashes everything!"
];

const BOSS_LOW_HP_DIALOGUES = [
  "CRITICAL HEALTH! Drink a potion before your semester ends prematurely!",
  "WARNING: HP IN DANGER! Use your healing elixir immediately!",
  "HEART RATE ACCELERATING! We need healing right this second!"
];

const BOSS_POTION_DIALOGUES = [
  "CHUG! That concentrated espresso potion restored vital cognitive HP!",
  "GLUG GLUG! Energy restored! Now counter-attack!",
  "AHHH! Refreshing academic restoration! Back into the fray!"
];

const BOSS_DEFEAT_DIALOGUES = [
  "DEFEATED BY THE EXAM! Dust yourself off, review the syllabus, and demand a rematch!",
  "Academic casualty! But failure is merely the prerequisite to victory. Try again!",
  "The boss triumphed this round. Don't worry, your course progress is safe—take the rematch!"
];

const PUZZLE_MATCH_DIALOGUES = [
  "A MATCH MADE IN HEAVEN! Those concepts belong together.",
  "PERFECT PAIRING! The logic gates are fully aligned.",
  "CLICK! Synapses connecting at supersonic speeds.",
  "BEAUTIFULLY MATCHED! The syllabus pieces click into place like magic!"
];

const PUZZLE_WRONG_DIALOGUES = [
  "Hmm, those two concepts politely refused to shake hands. Try another pair!",
  "Not quite! Those definitions are currently filing for academic divorce.",
  "Close, but that category looks a bit suspicious. Give it another thought!",
  "OH DEAR! You just attempted to link a recursion base case with infinite chaos!"
];

const PUZZLE_HINT_DIALOGUES = [
  "HINT SUMMONED! Look closely at the foundational definition or prerequisite step.",
  "Professor Panic whispers: identify the first initial state before applying operations!",
  "A gentle academic nudge: compare the core principle with its expected transformation.",
  "Ponder the invariant! One concept describes the rule, while the other applies it."
];

const PUZZLE_ORDER_WRONG_DIALOGUES = [
  "THE TIMELINE HAS WARPED! You ran the code before compiling it!",
  "Chronological paradox detected! Reorder those steps before causality collapses.",
  "Not quite in sequence! An earlier prerequisite must be performed first.",
  "Almost there! Swap the misplaced steps to restore logical flow."
];

const PUZZLE_ORDER_CORRECT_DIALOGUES = [
  "CHRONOLOGICAL PERFECTION! The workflow runs like clockwork.",
  "FLAWLESS SEQUENCE! Every algorithmic step executed in textbook order.",
  "POETRY IN MOTION! The procedure has been rigorously verified."
];

export function getProfessorPanicComment(mood: PanicMood, customContext?: string): string {
  let pool: string[];

  switch (mood) {
    case 'correct':
      pool = CORRECT_DIALOGUES;
      break;
    case 'wrong':
      pool = WRONG_DIALOGUES;
      break;
    case 'retry':
      pool = RETRY_DIALOGUES;
      break;
    case 'quest_complete':
      pool = QUEST_COMPLETE_DIALOGUES;
      break;
    case 'boss_victory':
      pool = BOSS_VICTORY_DIALOGUES;
      break;
    case 'boss_dodge_incoming':
      pool = BOSS_DODGE_INCOMING_DIALOGUES;
      break;
    case 'boss_dodge_success':
      pool = BOSS_DODGE_SUCCESS_DIALOGUES;
      break;
    case 'boss_phase2':
      pool = BOSS_PHASE2_DIALOGUES;
      break;
    case 'boss_phase3':
      pool = BOSS_PHASE3_DIALOGUES;
      break;
    case 'boss_player_low_hp':
      pool = BOSS_LOW_HP_DIALOGUES;
      break;
    case 'boss_potion_used':
      pool = BOSS_POTION_DIALOGUES;
      break;
    case 'boss_defeat':
      pool = BOSS_DEFEAT_DIALOGUES;
      break;
    case 'puzzle_match':
      pool = PUZZLE_MATCH_DIALOGUES;
      break;
    case 'puzzle_wrong':
      pool = PUZZLE_WRONG_DIALOGUES;
      break;
    case 'puzzle_hint':
      pool = PUZZLE_HINT_DIALOGUES;
      break;
    case 'puzzle_order_wrong':
      pool = PUZZLE_ORDER_WRONG_DIALOGUES;
      break;
    case 'puzzle_order_correct':
      pool = PUZZLE_ORDER_CORRECT_DIALOGUES;
      break;
    case 'idle':
    default:
      return customContext || "I am watching closely. Tread carefully, scholar!";
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

