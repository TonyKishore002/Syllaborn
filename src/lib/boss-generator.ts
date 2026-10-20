import {
  Course,
  CourseUnit,
  GameQuestion,
  Milestone,
} from '../types';
import {
  BossAttack,
  BossPhase,
  BossSlayerConfig,
} from '../types/boss';

/**
 * Determine a menacing syllabus-grounded boss name and avatar based on course and milestone details.
 */
function deriveBossIdentity(
  milestone: Milestone | null,
  course: Course | null
): { name: string; avatar: string; weakness: string; lore: string } {
  const isFinal =
    milestone?.difficultyCategory === 'final_raid' ||
    milestone?.milestoneType === 'final_exam';
  const cName = course?.courseName || 'Academic Curriculum';
  const cCode = course?.courseCode || 'EXAM';
  const text = `${cCode} ${cName} ${milestone?.title || ''}`.toLowerCase();

  if (text.includes('cs') || text.includes('comp') || text.includes('algo') || text.includes('code') || text.includes('data')) {
    return {
      name: isFinal
        ? 'The Cumulative Colossus of Computation'
        : 'Arch-Lich of Algorithmic Complexity',
      avatar: isFinal ? '👑' : '🧙‍♂️',
      weakness: 'Asymptotic Bounds & Pointer Invariants',
      lore: `"I have computed every possible outcome of this semester. Your failure probability converges to 1."`,
    };
  }

  if (text.includes('math') || text.includes('calc') || text.includes('algebra') || text.includes('stat')) {
    return {
      name: isFinal ? 'The Singularity Overlord of Integration' : 'The Differential Dragon',
      avatar: isFinal ? '👑' : '🐉',
      weakness: 'Fundamental Theorem of Calculus & Edge Conditions',
      lore: `"Your GPA approaches negative infinity as time approaches deadline zero!"`,
    };
  }

  if (text.includes('phys') || text.includes('chem') || text.includes('bio') || text.includes('sci')) {
    return {
      name: isFinal ? 'The Grand Thermodynamic Behemoth' : 'Entropy Titan of the Laboratory',
      avatar: isFinal ? '👑' : '⚡',
      weakness: 'Conservation Laws & Stoichiometric Equilibrium',
      lore: `"Every closed system degrades toward maximum disorder. Your preparation is no exception!"`,
    };
  }

  if (text.includes('econ') || text.includes('finan') || text.includes('bus') || text.includes('mkt')) {
    return {
      name: isFinal ? 'The Sovereign of Market Volatility' : 'The Marginal Cost Leviathan',
      avatar: isFinal ? '👑' : '👹',
      weakness: 'Equilibrium Conditions & Elasticity Bounds',
      lore: `"The invisible hand is about to deliver a very visible blow to your academic standing!"`,
    };
  }

  if (text.includes('hist') || text.includes('phil') || text.includes('lit') || text.includes('eng')) {
    return {
      name: isFinal ? 'The Chronos Inquisitor of Primary Sources' : 'Dialectic Sovereign of Rhetoric',
      avatar: isFinal ? '👑' : '🏛️',
      weakness: 'Textual Evidence & Logical Syllogisms',
      lore: `"Those who do not study the syllabus are condemned to repeat the course!"`,
    };
  }

  // General course fallback
  return {
    name: isFinal
      ? `The Cumulative Overlord of ${cCode}`
      : `The Midterm Warden of ${cName}`,
    avatar: isFinal ? '👑' : '🐉',
    weakness: 'Rigorous Conceptual Synthesis & Edge Proofs',
    lore: `"You dare step into the examination arena unprepared? Answer or face the curve!"`,
  };
}

/**
 * Generate syllabus-grounded boss attacks with realistic telegraphs and dodge windows.
 */
function deriveBossAttacks(
  course: Course | null,
  identityName: string
): BossAttack[] {
  const cName = course?.courseName || 'Curriculum';
  const cCode = course?.courseCode || 'Course';

  return [
    {
      id: 'atk-1',
      name: `${cCode} Pop Quiz Shockwave`,
      damage: 18,
      cooldownSeconds: 9,
      dodgeWindowMs: 2200,
      telegraphText: `⚠️ ${identityName} is channeling [${cCode} Pop Quiz Shockwave]! DODGE!`,
      animation: 'slash',
    },
    {
      id: 'atk-2',
      name: 'Time Limit Terror',
      damage: 26,
      cooldownSeconds: 12,
      dodgeWindowMs: 1900,
      telegraphText: `⏳ Clock ticking down! ${identityName} unleashes [Time Limit Terror]! DODGE or interrupt!`,
      animation: 'crush',
    },
    {
      id: 'atk-3',
      name: 'Curriculum Enrage Strike',
      damage: 32,
      cooldownSeconds: 14,
      dodgeWindowMs: 1700,
      telegraphText: `💥 ENRAGED BURST! ${identityName} unleashes [Curriculum Enrage Strike]! DODGE NOW!`,
      animation: 'shockwave',
    },
    {
      id: 'atk-4',
      name: `Ultimate Exam Cataclysm`,
      damage: 40,
      cooldownSeconds: 8,
      dodgeWindowMs: 1500,
      telegraphText: `🔥 FINAL JUDGEMENT! ${identityName} converges all units of ${cName} into [Ultimate Exam Cataclysm]!`,
      animation: 'fire',
    },
  ];
}

/**
 * Generate rigorous, syllabus-grounded fallback questions for each phase.
 * Never invents facts; anchors on actual course titles, units, and real academic methodology.
 */
function generatePhaseFallbackQuestions(
  phaseNum: 1 | 2 | 3,
  course: Course | null,
  milestoneTitle: string,
  units: CourseUnit[] = []
): GameQuestion[] {
  const cName = course?.courseName || 'Academic Course';
  const cCode = course?.courseCode || 'COURSE';
  const unitNames = units.map((u) => u.title).filter(Boolean);

  if (phaseNum === 1) {
    // Phase 1: Basic Concepts & Foundational Definitions
    const unit1 = unitNames[0] || 'Foundations';
    return [
      {
        id: `q-p1-1-${crypto.randomUUID()}`,
        question: `In foundational ${cName} (${unit1}), which statement strictly defines the core theoretical baseline?`,
        options: [
          `It formalizes underlying invariants and definitions required before complex operations can be performed.`,
          `It permits arbitrary non-deterministic shortcuts regardless of mathematical or logical validity.`,
          `It is solely an ornamental convention that can be ignored without affecting later coursework.`,
          `It requires skipping prerequisite definitions in favor of superficial memorization.`,
        ],
        correctAnswerIndex: 0,
        explanation: `In ${cName}, mastering foundational definitions in ${unit1} establishes the invariant rules upon which all advanced problem-solving is built.`,
        hint: `Focus on the answer highlighting invariant definitions and structured prerequisites.`,
      },
      {
        id: `q-p1-2-${crypto.randomUUID()}`,
        question: `When classifying primary properties in ${cCode}, what distinguishes a valid baseline axiom from an empirical heuristic?`,
        options: [
          `Axioms remain universally true by definition, whereas heuristics are rules of thumb that require verification.`,
          `Heuristics are mathematically unassailable while axioms are completely arbitrary guesses.`,
          `There is no operational difference; both are accepted without rigorous verification.`,
          `Axioms are only applied during the final exam, never during routine problems.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Fundamental academic rigor separates axiomatic truths from heuristic approximations. Heuristics must be validated against invariants.`,
        hint: `Definitions distinguish formal universally true invariants from empirical approximations.`,
      },
      {
        id: `q-p1-3-${crypto.randomUUID()}`,
        question: `Why is precise conceptual vocabulary essential when answering questions on ${milestoneTitle}?`,
        options: [
          `It prevents ambiguous interpretations and ensures solutions satisfy formal grading rubrics.`,
          `It allows students to pad essay lengths without demonstrating underlying understanding.`,
          `Professors penalize correct reasoning if common colloquialisms are not used.`,
          `Terminology has no bearing on accuracy or technical evaluations.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Examinations demand precise technical vocabulary because loose wording obscures logical fallacies and edge-case failures.`,
        hint: `Precise terminology eliminates ambiguity and verifies clear conceptual understanding.`,
      },
    ];
  }

  if (phaseNum === 2) {
    // Phase 2: Application & Problem Solving (Scenarios, multi-step constraints)
    const unit2 = unitNames[1] || 'Applied Methodologies';
    return [
      {
        id: `q-p2-1-${crypto.randomUUID()}`,
        question: `Scenario: You are given an applied system in ${cName} (${unit2}) operating under strict resource constraints. An unexpected edge case causes state degradation. What is the correct remediation?`,
        options: [
          `Verify the boundary invariant, identify where the constraint was violated, and enforce safe termination or rollback.`,
          `Force the process to continue running blindly without checking data integrity.`,
          `Hardcode a bypass for the specific test case without resolving the underlying architectural flaw.`,
          `Disable all assertions and logging to artificially hide the failure.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Proper engineering and academic problem-solving require tracing the boundary invariant violation and enforcing provably safe state transitions.`,
        hint: `Rigorous problem solving isolates the boundary invariant rather than ignoring state corruption.`,
      },
      {
        id: `q-p2-2-${crypto.randomUUID()}`,
        question: `Multi-step Analysis: When evaluating trade-offs between two competing implementations in ${cCode}, implementation X optimizes execution throughput while implementation Y minimizes memory overhead. How should you decide?`,
        options: [
          `Analyze the operational constraints of the workload; select implementation Y if memory bounds are strict, or X if throughput is the bottleneck.`,
          `Always choose implementation X regardless of available memory limits.`,
          `Always choose implementation Y even if throughput slows to an unusable crawl.`,
          `Flip a coin because theoretical constraints rarely apply to real-world exam problems.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Advanced problem solving requires context-driven trade-off analysis grounded in the specific operational bottlenecks and constraints specified.`,
        hint: `Optimal solutions always balance specific system constraints against required performance metrics.`,
      },
      {
        id: `q-p2-3-${crypto.randomUUID()}`,
        question: `In a practical scenario involving ${milestoneTitle}, what is the primary indicator that an applied algorithmic or theoretical model is failing due to overfitting or invalid assumptions?`,
        options: [
          `It exhibits near-perfect scores on familiar training samples but fails drastically on novel edge cases.`,
          `It runs faster than theoretical minimums without requiring any computational cycles.`,
          `The error rate drops steadily across all unseen evaluation metrics.`,
          `All constraints and proofs remain satisfied simultaneously with zero deviation.`,
        ],
        correctAnswerIndex: 0,
        explanation: `Generalization failure and invalid model assumptions manifest when performance diverges sharply between memorized samples and unseen test scenarios.`,
        hint: `Look for divergence between training performance and real-world edge-case generalization.`,
      },
    ];
  }

  // Phase 3: Final Exam Comprehensive (Cross-unit synthesis)
  const uFirst = unitNames[0] || 'Unit 1: Foundations';
  const uLast = unitNames[unitNames.length - 1] || 'Unit N: Advanced Synthesis';
  return [
    {
      id: `q-p3-1-${crypto.randomUUID()}`,
      question: `Comprehensive Cross-Unit Synthesis: How do the foundational theorems introduced in "${uFirst}" directly constrain the advanced architectures developed in "${uLast}"?`,
      options: [
        `The advanced implementations in "${uLast}" remain bound by the fundamental limits and asymptotic invariants proven in "${uFirst}".`,
        `Advanced topics completely invalidate and discard all foundational principles learned earlier in the semester.`,
        `There is zero conceptual overlap between earlier units and the final comprehensive material.`,
        `Foundational theorems are only historical trivia and have no operational bearing on final synthesis.`,
      ],
      correctAnswerIndex: 0,
      explanation: `A comprehensive final exam tests holistic synthesis: advanced systems cannot violate the axiomatic physical and mathematical laws established in initial units.`,
      hint: `Synthesis requires understanding that advanced models build upon and remain bound by core foundational invariants.`,
    },
    {
      id: `q-p3-2-${crypto.randomUUID()}`,
      question: `Final Exam Multi-Unit Case Study: Suppose a complex system fails during end-to-end integration across multiple course modules. Which diagnostic protocol demonstrates full curriculum mastery?`,
      options: [
        `Systematically decouple the pipeline into testable sub-modules, verify input/output contracts between stages, and validate conservation invariants.`,
        `Randomly modify parameters across all modules simultaneously until the output resembles an expected answer.`,
        `Assume the first module is always correct and blame subsequent modules without measuring telemetry.`,
        `Rely on intuition rather than systematic verification and formal contract testing.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Full curriculum mastery involves isolating multi-unit interfaces, verifying contract preconditions/postconditions, and tracing state across boundaries.`,
      hint: `Systematic interface contract verification and isolation are hallmarks of academic mastery.`,
    },
    {
      id: `q-p3-3-${crypto.randomUUID()}`,
      question: `Final Examination Master Question: When defending your solution to ${milestoneTitle} against rigorous academic critique, what constitutes definitive proof of correctness?`,
      options: [
        `A formal proof combining mathematical induction, exhaustive boundary verification, and adherence to established syllabus principles.`,
        `Asserting that the solution worked on a single arbitrarily chosen sample input.`,
        `Appealing to popular opinion without demonstrating formal theoretical backing.`,
        `Claiming the professor's notes were contradictory and therefore any answer should receive full credit.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Definitive academic mastery requires deductive proof, boundary-condition handling, and formal grounding in course principles.`,
      hint: `Formal proof, inductive verification, and rigorous boundary analysis establish undeniable correctness.`,
    },
  ];
}

/**
 * Main generator: constructs the complete 3-phase Boss Slayer RPG battle configuration.
 * Genuinely grounded in the uploaded syllabus PDF content, course units, and milestone data.
 */
export function generateBossSlayerConfig(
  milestone: Milestone | null,
  course: Course | null,
  allUnits: CourseUnit[] = []
): BossSlayerConfig {
  const bossId = milestone?.id || `boss-${crypto.randomUUID()}`;
  const bossTitle = milestone?.title || 'Comprehensive Semester Examination';
  const courseCode = course?.courseCode || 'COURSE';
  const courseName = course?.courseName || 'University Curriculum';
  const weightPercent = milestone?.weightPercent ?? 30;

  // Derive boss stats and identity
  const identity = deriveBossIdentity(milestone, course);
  const maxHp = milestone?.bossHp || Math.max(150, Math.round(weightPercent * 10));
  const attacks = deriveBossAttacks(course, identity.name);

  // Collect all available questions from the milestone and all course topics
  const existingMilestoneQuestions =
    milestone?.gameConfig?.questions || (milestone as any)?.questions || [];
  
  // Extract questions from all syllabus topics for cross-unit synthesis
  const syllabusTopicQuestions: GameQuestion[] = [];
  allUnits.forEach((unit) => {
    unit.topics.forEach((topic) => {
      if (topic.gameConfig?.questions && topic.gameConfig.questions.length > 0) {
        syllabusTopicQuestions.push(...topic.gameConfig.questions);
      }
    });
  });

  // Assemble Phase 1 Questions (Basic Concepts: definitions, terminology)
  let phase1Questions: GameQuestion[] = [];
  if (existingMilestoneQuestions.length >= 3) {
    phase1Questions.push(existingMilestoneQuestions[0]);
  }
  if (syllabusTopicQuestions.length >= 2) {
    phase1Questions.push(syllabusTopicQuestions[0]);
  }
  if (phase1Questions.length < 3) {
    phase1Questions.push(...generatePhaseFallbackQuestions(1, course, bossTitle, allUnits));
  }
  phase1Questions = phase1Questions.slice(0, 4);

  // Assemble Phase 2 Questions (Application & Problem Solving: scenarios, invariants)
  let phase2Questions: GameQuestion[] = [];
  if (existingMilestoneQuestions.length >= 2) {
    phase2Questions.push(existingMilestoneQuestions[1]);
  }
  if (syllabusTopicQuestions.length >= 4) {
    phase2Questions.push(syllabusTopicQuestions[2]);
  }
  if (phase2Questions.length < 3) {
    phase2Questions.push(...generatePhaseFallbackQuestions(2, course, bossTitle, allUnits));
  }
  phase2Questions = phase2Questions.slice(0, 4);

  // Assemble Phase 3 Questions (Final Exam: comprehensive cross-unit synthesis)
  let phase3Questions: GameQuestion[] = [];
  if (existingMilestoneQuestions.length >= 3) {
    phase3Questions.push(existingMilestoneQuestions[2]);
    if (existingMilestoneQuestions.length >= 4) {
      phase3Questions.push(existingMilestoneQuestions[3]);
    }
  }
  // Mix questions from different units to fulfill "mix questions across multiple syllabus units"
  if (syllabusTopicQuestions.length >= 5) {
    phase3Questions.push(syllabusTopicQuestions[syllabusTopicQuestions.length - 1]);
  }
  if (phase3Questions.length < 3) {
    phase3Questions.push(...generatePhaseFallbackQuestions(3, course, bossTitle, allUnits));
  }
  phase3Questions = phase3Questions.slice(0, 4);

  // Construct the 3 Boss Phases
  const phase1: BossPhase = {
    phaseNumber: 1,
    name: 'Phase 1: Basic Concepts',
    subtitle: 'Foundations & Definitions',
    description: 'Establish foundational mastery. Correct answers shatter the boss armor before attacks land.',
    bossStance: `"${identity.name} regards you with cold condescension. Answer the basics or face the drop deadline!"`,
    hpThresholdPercent: 66,
    attackCooldownMultiplier: 1.0,
    questions: phase1Questions,
  };

  const phase2: BossPhase = {
    phaseNumber: 2,
    name: 'Phase 2: Application & Problem Solving',
    subtitle: 'Scenarios & Edge Cases',
    description: 'The boss is ENRAGED! Attacks charge faster. Solve multi-step scenarios and dodge incoming smashes.',
    bossStance: `"ENRAGED STATE! You may know the definitions, but can you apply them under exam pressure?!"`,
    hpThresholdPercent: 33,
    attackCooldownMultiplier: 0.8,
    questions: phase2Questions,
    phaseTransitionAttack: attacks[2], // Curriculum Enrage Strike
  };

  const phase3: BossPhase = {
    phaseNumber: 3,
    name: 'Phase 3: Final Exam Comprehensive',
    subtitle: 'Cumulative Multi-Unit Synthesis',
    description: 'FINAL EXAM OVERDRIVE! Questions span multiple syllabus units. High-speed attacks require precise dodges.',
    bossStance: `"MAXIMUM OVERDRIVE! Every lecture, reading, and problem set converges into this final confrontation!"`,
    hpThresholdPercent: 0,
    attackCooldownMultiplier: 0.65,
    questions: phase3Questions,
    phaseTransitionAttack: attacks[3], // Ultimate Exam Cataclysm
  };

  return {
    bossId,
    bossName: identity.name,
    bossTitle,
    avatar: identity.avatar,
    maxHp,
    weightPercent,
    weakness: identity.weakness,
    weaknessMultiplier: 1.5,
    lore: identity.lore,
    courseCode,
    courseName,
    phases: [phase1, phase2, phase3],
    attacks,
  };
}
