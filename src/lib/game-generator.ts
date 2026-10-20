import { GameMode, GameQuestion, PuzzleData, QuestGameConfig } from '../types';

/**
 * Intelligently select a game mode according to syllabus topic characteristics
 * (Rule: Procedures/algorithms/ordered workflows -> puzzle-quest;
 * Rapid factual, vocabulary, definition, syntax -> do-or-die;
 * Conceptual, analytical, comprehensive topics -> quiz-battle)
 */
export function selectIntelligentGameMode(
  topicTitle: string,
  description?: string
): GameMode {
  const text = `${topicTitle} ${description || ''}`.toLowerCase();

  const puzzleKeywords = [
    'step',
    'algorithm',
    'process',
    'workflow',
    'pipeline',
    'lifecycle',
    'order',
    'sort',
    'matching',
    'hierarchy',
    'procedure',
    'methodology',
    'cycle',
    'phase',
    'phases',
    'binary search tree traversal',
    'traversal steps',
    'normalization',
  ];

  const survivalKeywords = [
    'vocabulary',
    'terminology',
    'drill',
    'syntax',
    'operator',
    'date',
    'formula',
    'naming convention',
    'anatomy',
    'pointer',
    'memory',
    'deadlock',
    'concurrency',
    'recursion',
    'hazard',
    'stack',
    'queue',
    'heap',
    'quick',
  ];

  if (puzzleKeywords.some((k) => text.includes(k))) {
    return 'puzzle-quest';
  }

  if (survivalKeywords.some((k) => text.includes(k))) {
    return 'do-or-die';
  }

  // Default to quiz-battle for conceptual, analytical, or comprehensive topics
  return 'quiz-battle';
}

/**
 * Validate that a game config has valid topic, questions, options, and bounds-checked answer indices.
 * Returns boolean for direct test assertions.
 */
export function validateGameConfig(config: any): boolean {
  if (!config || typeof config !== 'object') return false;

  const topic = config.topicTitle || config.topic;
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(config.questions) || config.questions.length === 0) {
    return false;
  }

  for (const q of config.questions) {
    if (!q || typeof q !== 'object') return false;
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
      return false;
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return false;
    }
    if (
      typeof q.correctAnswerIndex !== 'number' ||
      !Number.isInteger(q.correctAnswerIndex) ||
      q.correctAnswerIndex < 0 ||
      q.correctAnswerIndex >= q.options.length
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize and validate questions and options, fixing out-of-bounds indices and providing fallbacks.
 */
export function sanitizeGameConfig(config: QuestGameConfig): {
  valid: boolean;
  errors: string[];
  sanitizedConfig: QuestGameConfig;
} {
  const errors: string[] = [];
  const topic = (config.topicTitle || config.topic || '').trim();

  const sanitized: QuestGameConfig = {
    ...config,
    topic: topic || 'Course Topic',
    topicTitle: topic || 'Course Topic',
    gameMode: ['do-or-die', 'quiz-battle', 'puzzle-quest', 'boss-slayer'].includes(config.gameMode)
      ? config.gameMode
      : 'quiz-battle',
    difficulty: config.difficulty || 'easy',
    questions: [],
    puzzleData: config.puzzleData || null,
  };

  if (!topic) {
    errors.push('Game topic cannot be empty.');
  }

  if (!Array.isArray(config.questions) || config.questions.length === 0) {
    errors.push('Game content must contain at least one question.');
    sanitized.questions = generateFallbackQuestions(sanitized.topic);
  } else {
    sanitized.questions = config.questions.map((q, idx) => {
      const sanitizedQ: GameQuestion = {
        id: q.id || `q-${idx}-${crypto.randomUUID()}`,
        question: q.question?.trim() || `Question on ${sanitized.topic}`,
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? [...q.options]
            : ['Option A', 'Option B'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation?.trim() || 'This is the verified correct answer from the syllabus.',
        hint: q.hint?.trim() || 'Review the core definition in your syllabus.',
        sourceReference: q.sourceReference,
      };

      if (
        sanitizedQ.correctAnswerIndex < 0 ||
        sanitizedQ.correctAnswerIndex >= sanitizedQ.options.length
      ) {
        errors.push(
          `Question "${sanitizedQ.question.slice(0, 30)}..." had out-of-range answer index. Normalized to 0.`
        );
        sanitizedQ.correctAnswerIndex = 0;
      }

      return sanitizedQ;
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedConfig: sanitized,
  };
}

/**
 * Generate fallback questions grounded in the topic title for offline or manual quests
 */
export function generateFallbackQuestions(topicTitle?: string, courseName?: string): GameQuestion[] {
  const cleanTitle = (topicTitle && topicTitle.trim()) ? topicTitle.trim() : 'Course Topic';
  const courseStr = courseName ? ` in ${courseName}` : '';

  return [
    {
      id: crypto.randomUUID(),
      question: `Which statement accurately characterizes the primary function of ${cleanTitle}${courseStr}?`,
      options: [
        `It provides a foundational mechanism for structured problem-solving in ${cleanTitle}.`,
        `It has been completely superseded by non-standard arbitrary procedures.`,
        `It operates exclusively as an untracked aesthetic syntax ornament.`,
        `It has no relevance to academic evaluations or practical implementations.`,
      ],
      correctAnswerIndex: 0,
      explanation: `${cleanTitle} is a core academic topic required for understanding the principles and applications taught in this course.`,
      hint: `Look for the option describing foundational, structured principles.`,
    },
    {
      id: crypto.randomUUID(),
      question: `When analyzing trade-offs involving ${cleanTitle}, what is a critical consideration?`,
      options: [
        `Ignoring efficiency constraints and resource limitations entirely`,
        `Balancing precision, execution overhead, and structural correctness`,
        `Assuming all edge cases will resolve automatically without verification`,
        `Prioritizing guesswork over formal methodology`,
      ],
      correctAnswerIndex: 1,
      explanation: `Mastering ${cleanTitle} requires evaluating practical trade-offs between precision, resource utilization, and correct implementation.`,
      hint: `Proper academic methodology balances correctness and efficiency.`,
    },
    {
      id: crypto.randomUUID(),
      question: `What is the most effective approach to mastering ${cleanTitle}?`,
      options: [
        `Systematically practicing problem sets and verifying against foundational definitions`,
        `Cramming five minutes before the examination without reviewing notes`,
        `Skipping core prerequisites and hoping the questions are trivial`,
        `Memorizing keywords without comprehending their contextual meaning`,
      ],
      correctAnswerIndex: 0,
      explanation: `Rigorous conceptual mastery and hands-on application ensure long-term retention and high exam performance.`,
      hint: `Active verification and conceptual understanding yield the best results.`,
    },
  ];
}

/**
 * Generate syllabus-grounded matching pairs and step ordering sequences
 */
export function generateTopicGroundedPuzzle(topicTitle: string, _courseName?: string): PuzzleData {
  const t = topicTitle.toLowerCase();

  if (t.includes('sort') || t.includes('bubble') || t.includes('merge') || t.includes('quick')) {
    const pairs = [
      {
        id: 'p1',
        left: 'Partitioning Pivot',
        right: 'Selected benchmark element around which lesser and greater values are partitioned',
        term: 'Partitioning Pivot',
        definition: 'Selected benchmark element around which lesser and greater values are partitioned',
        explanation: 'In QuickSort, the pivot establishes sub-arrays for divide-and-conquer processing.',
        hint: 'This element acts as the dividing boundary between smaller and larger values.',
      },
      {
        id: 'p2',
        left: 'Divide and Conquer',
        right: 'Recursively splitting an unsorted array into singletons before merging in order',
        term: 'Divide and Conquer',
        definition: 'Recursively splitting an unsorted array into singletons before merging in order',
        explanation: 'MergeSort guarantees O(N log N) time complexity by dividing until base cases remain.',
        hint: 'A paradigm that breaks large problems into identical subproblems.',
      },
      {
        id: 'p3',
        left: 'Sorting Invariant',
        right: 'Formal condition ensuring a designated subsegment remains monotonically ordered',
        term: 'Sorting Invariant',
        definition: 'Formal condition ensuring a designated subsegment remains monotonically ordered',
        explanation: 'Invariants provide mathematical verification that loops progress toward a sorted output.',
        hint: 'A property that holds true before and after each iteration of the sorting loop.',
      },
      {
        id: 'p4',
        left: 'Sorting Stability',
        right: 'Preserves the original relative order of records possessing equal comparison keys',
        term: 'Sorting Stability',
        definition: 'Preserves the original relative order of records possessing equal comparison keys',
        explanation: 'Stable sorts prevent reordering of equivalent items across multi-key operations.',
        hint: 'Ensures equal elements keep their original order.',
      },
    ];

    const orderedSteps = [
      { id: 's1', order: 1, text: 'Select initial pivot or divide sequence into subsegments', explanation: 'Initialize the subproblem boundaries.' },
      { id: 's2', order: 2, text: 'Scan elements and compare adjacent or boundary keys', explanation: 'Evaluate elements according to the ordering predicate.' },
      { id: 's3', order: 3, text: 'Swap misplaced elements or sort recursive partitions', explanation: 'Enforce the sub-array order.' },
      { id: 's4', order: 4, text: 'Merge subsegments and verify monotonic sorted order', explanation: 'Combine sorted partitions into the final array.' },
    ];

    return {
      type: 'concept-matching',
      prompt: `Match the sorting concepts or arrange the algorithm steps for "${topicTitle}":`,
      hint: 'Think about how comparison-based algorithms divide, sort, and merge elements.',
      explanation: 'Sorting algorithms organize data structures to optimize lookup and processing efficiency.',
      pairs,
      steps: orderedSteps,
      orderedSteps,
      scrambledSteps: [orderedSteps[1], orderedSteps[3], orderedSteps[0], orderedSteps[2]],
    };
  }

  if (t.includes('tree') || t.includes('traversal') || t.includes('search') || t.includes('bst') || t.includes('graph')) {
    const pairs = [
      {
        id: 'p1',
        left: 'In-Order Traversal',
        right: 'Visits left subtree, root node, then right subtree in ascending sorted order',
        term: 'In-Order Traversal',
        definition: 'Visits left subtree, root node, then right subtree in ascending sorted order',
        explanation: 'In a BST, in-order traversal yields values in non-decreasing order.',
        hint: 'Left -> Root -> Right.',
      },
      {
        id: 'p2',
        left: 'BST Invariant',
        right: 'All keys in left subtree are strictly less than root, right subtree keys are greater',
        term: 'BST Invariant',
        definition: 'All keys in left subtree are strictly less than root, right subtree keys are greater',
        explanation: 'This invariant permits binary search logic in logarithmic time.',
        hint: 'Smaller keys go left, larger keys go right.',
      },
      {
        id: 'p3',
        left: 'Tree Balancing',
        right: 'Restructuring tree height to O(log N) to prevent degenerate linear search chains',
        term: 'Tree Balancing',
        definition: 'Restructuring tree height to O(log N) to prevent degenerate linear search chains',
        explanation: 'Self-balancing trees like AVL or Red-Black trees perform rotations to maintain balance.',
        hint: 'Keeps tree depth shallow for fast lookups.',
      },
      {
        id: 'p4',
        left: 'Leaf Node',
        right: 'A tree node possessing zero children, acting as the base case for recursive descent',
        term: 'Leaf Node',
        definition: 'A tree node possessing zero children, acting as the base case for recursive descent',
        explanation: 'Leaf nodes mark the bottom-most boundary of tree paths.',
        hint: 'The terminal endpoints of a tree hierarchy.',
      },
    ];

    const orderedSteps = [
      { id: 's1', order: 1, text: 'Inspect the root node and test for null base termination', explanation: 'Base case evaluation for recursive traversal.' },
      { id: 's2', order: 2, text: 'Recursively descend and process the left subtree', explanation: 'Visits all smaller elements first.' },
      { id: 's3', order: 3, text: 'Visit and evaluate the current node data value', explanation: 'Processes current node payload.' },
      { id: 's4', order: 4, text: 'Recursively traverse the right subtree and return sequence', explanation: 'Processes all larger elements.' },
    ];

    return {
      type: 'concept-matching',
      prompt: `Match the tree principles or order the traversal steps for "${topicTitle}":`,
      hint: 'Recall the relationship between root, left child, and right child in hierarchical structures.',
      explanation: 'Hierarchical tree traversals establish systematic visit orders for data evaluation.',
      pairs,
      steps: orderedSteps,
      orderedSteps,
      scrambledSteps: [orderedSteps[2], orderedSteps[0], orderedSteps[3], orderedSteps[1]],
    };
  }

  if (t.includes('process') || t.includes('operating') || t.includes('schedul') || t.includes('thread') || t.includes('deadlock')) {
    const pairs = [
      {
        id: 'p1',
        left: 'Process Control Block',
        right: 'Kernel repository tracking program counter, registers, memory state, and PID',
        term: 'Process Control Block',
        definition: 'Kernel repository tracking program counter, registers, memory state, and PID',
        explanation: 'The PCB allows operating systems to suspend and resume task execution cleanly.',
        hint: 'The OS passport and identity block for an active process.',
      },
      {
        id: 'p2',
        left: 'Preemptive Context Switch',
        right: 'Scheduler forcibly reclaims CPU when timer quantum expires or higher priority arrives',
        term: 'Preemptive Context Switch',
        definition: 'Scheduler forcibly reclaims CPU when timer quantum expires or higher priority arrives',
        explanation: 'Preemption maintains system responsiveness and fairness across concurrent threads.',
        hint: 'Switching CPU ownership before the current task voluntarily finishes.',
      },
      {
        id: 'p3',
        left: 'Mutual Exclusion',
        right: 'Concurrency mechanism guaranteeing only one thread occupies a critical section',
        term: 'Mutual Exclusion',
        definition: 'Concurrency mechanism guaranteeing only one thread occupies a critical section',
        explanation: 'Mutexes and semaphores prevent non-deterministic race conditions on shared memory.',
        hint: 'Ensuring exclusive access to critical resources.',
      },
      {
        id: 'p4',
        left: 'Deadlock Circular Wait',
        right: 'Deadlock condition where each waiting process holds a resource demanded by the next',
        term: 'Deadlock Circular Wait',
        definition: 'Deadlock condition where each waiting process holds a resource demanded by the next',
        explanation: 'Breaking circular wait is a primary strategy for deadlock prevention.',
        hint: 'A closed loop of threads all waiting on each other indefinitely.',
      },
    ];

    const orderedSteps = [
      { id: 's1', order: 1, text: 'Allocate address space and initialize the Process Control Block', explanation: 'Process creation and state initialization.' },
      { id: 's2', order: 2, text: 'Enqueue process into the Ready Queue awaiting scheduler dispatch', explanation: 'Admission into the kernel ready pool.' },
      { id: 's3', order: 3, text: 'Context switch process state onto the CPU core for execution', explanation: 'Dispatching instructions to CPU.' },
      { id: 's4', order: 4, text: 'Yield CPU on I/O wait or deallocate resources upon termination', explanation: 'Lifecycle conclusion and cleanup.' },
    ];

    return {
      type: 'concept-matching',
      prompt: `Match the system concepts or sequence the lifecycle steps for "${topicTitle}":`,
      hint: 'Trace how tasks move from creation in memory to the ready queue and CPU dispatch.',
      explanation: 'Operating system scheduling and concurrency balance processor throughput with isolation.',
      pairs,
      steps: orderedSteps,
      orderedSteps,
      scrambledSteps: [orderedSteps[1], orderedSteps[3], orderedSteps[0], orderedSteps[2]],
    };
  }

  // Default syllabus-grounded academic puzzle
  const pairs = [
    {
      id: 'p1',
      left: `${topicTitle} (Definition)`,
      right: 'Primary theoretical formulation, formal scope, and core academic model',
      term: `${topicTitle} (Definition)`,
      definition: 'Primary theoretical formulation, formal scope, and core academic model',
      explanation: `Establishes the core academic definition of ${topicTitle} from the syllabus.`,
      hint: 'The foundational definition defining the boundaries of this subject.',
    },
    {
      id: 'p2',
      left: 'Core Invariant',
      right: 'Fundamental operational rule that must remain preserved across all state transitions',
      term: 'Core Invariant',
      definition: 'Fundamental operational rule that must remain preserved across all state transitions',
      explanation: 'Invariants guarantee that transformations do not corrupt the foundational requirements.',
      hint: 'The unwavering rule that never changes during execution.',
    },
    {
      id: 'p3',
      left: 'Practical Application',
      right: 'Concrete implementation in coursework problem sets, labs, and real-world systems',
      term: 'Practical Application',
      definition: 'Concrete implementation in coursework problem sets, labs, and real-world systems',
      explanation: 'Demonstrates how theoretical syllabus concepts map into practical execution.',
      hint: 'How this theory is put to work in actual implementations.',
    },
    {
      id: 'p4',
      left: 'Analytical Verification',
      right: 'Systematic testing of edge cases, boundary parameters, and output validity',
      term: 'Analytical Verification',
      definition: 'Systematic testing of edge cases, boundary parameters, and output validity',
      explanation: 'Verification confirms the solution satisfies all academic grading rubrics.',
      hint: 'The final quality check ensuring correctness under all conditions.',
    },
  ];

  const orderedSteps = [
    { id: 's1', order: 1, text: `Review the foundational definitions and prerequisites of ${topicTitle}`, explanation: 'Initial preparation and prerequisites.' },
    { id: 's2', order: 2, text: `Construct the initial model or setup input parameters`, explanation: 'Problem formulation.' },
    { id: 's3', order: 3, text: `Apply the core transformation while preserving boundary invariants`, explanation: 'Core execution.' },
    { id: 's4', order: 4, text: `Evaluate final correctness against expected academic constraints`, explanation: 'Verification and validation.' },
  ];

  return {
    type: 'concept-matching',
    prompt: `Match the academic concepts or sequence the workflow steps for "${topicTitle}":`,
    hint: 'Review foundational principles before tracing the procedural steps.',
    explanation: `Mastery of ${topicTitle} requires understanding both its definitions and workflow execution.`,
    pairs,
    steps: orderedSteps,
    orderedSteps,
    scrambledSteps: [orderedSteps[1], orderedSteps[3], orderedSteps[0], orderedSteps[2]],
  };
}

/**
 * Generate complete fallback game configuration
 */
export function generateFallbackGameConfig(
  topicTitle: string,
  courseName?: string,
  preferredMode?: GameMode
): QuestGameConfig {
  const mode = preferredMode || selectIntelligentGameMode(topicTitle);
  const questions = generateFallbackQuestions(topicTitle, courseName);

  let puzzleData: PuzzleData | null = null;
  if (mode === 'puzzle-quest') {
    puzzleData = generateTopicGroundedPuzzle(topicTitle, courseName);
  }

  return {
    questId: crypto.randomUUID(),
    topic: topicTitle,
    topicTitle,
    gameMode: mode,
    difficulty: 'easy',
    questions,
    puzzleData,
  };
}
