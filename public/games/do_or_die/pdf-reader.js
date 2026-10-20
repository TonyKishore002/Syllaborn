// Syllabus Data & Autonomous PDF Extraction Engine for "Do Or Die"
// Connects dynamically to Syllaborn state, uploaded PDF documents, and academic topics.

const ACADEMIC_PRESETS = [
  {
    id: 'cs101',
    courseCode: 'CS 101',
    courseName: 'Data Structures & Algorithms',
    examTitle: 'Final Exam: The NP-Complete Dragon',
    difficulty: 'final_raid',
    weightPercent: 40,
    bossHp: 400,
    topics: [
      'Arrays, Linked Lists & Pointers',
      'Recursion & Tree Traversals',
      'Graph Theory & Dijkstra Maze',
      'Dynamic Programming & NP-Hard Boss'
    ],
    tips: [
      'Page 3 Policy: Unannounced quizzes carry no makeup opportunities!',
      'Memory leaks in your pointer tree will cause instant stack overflow.',
      'Dijkstra pathfinding is blocked unless you collect all 3 Knowledge Keys.',
      'The Boss attacks with Big-O O(2^n) exponential laser projectiles!'
    ],
    bossQuote: 'You dare challenge my O(2^N) time complexity without dynamic programming?!'
  },
  {
    id: 'math240',
    courseCode: 'MATH 240',
    courseName: 'Multivariable Calculus',
    examTitle: 'Midterm 2: The Divergence Leviathan',
    difficulty: 'boss_fight',
    weightPercent: 25,
    bossHp: 250,
    topics: [
      'Partial Derivatives & Gradients',
      'Double Integrals over Polar Regions',
      'Vector Fields & Conservative Work',
      'Green’s & Stokes’ Theorem Arena'
    ],
    tips: [
      'Gradients point in the direction of steepest trap trigger!',
      'Watch out for non-conservative vector field platforms.',
      'Check the boundary curves before stepping on the contour line.',
      'The Leviathan strikes with curling flux whirlpools!'
    ],
    bossQuote: 'My flux across closed surfaces is strictly NON-ZERO!'
  },
  {
    id: 'phys201',
    courseCode: 'PHYS 201',
    courseName: 'Classical Mechanics & Waves',
    examTitle: 'Final Exam: The Entropy Overlord',
    difficulty: 'final_raid',
    weightPercent: 35,
    bossHp: 350,
    topics: [
      'Lagrangian Mechanics & Constraints',
      'Rotational Inertia & Gyroscopic Precession',
      'Harmonic Oscillators & Resonance',
      'Wave Equations & Relativistic Collisions'
    ],
    tips: [
      'Conservation of angular momentum makes spinning platforms accelerate!',
      'Do not jump at resonant frequency or the bridge collapses.',
      'Frictionless ice surfaces simulate ideal Newton systems.',
      'The Overlord fires harmonic shockwaves across the floor!'
    ],
    bossQuote: 'Entropy always increases, and your grade is approaching absolute zero!'
  },
  {
    id: 'bio110',
    courseCode: 'BIO 110',
    courseName: 'Molecular Genetics',
    examTitle: 'Major Exam: The CRISPR Chimera',
    difficulty: 'boss_fight',
    weightPercent: 30,
    bossHp: 300,
    topics: [
      'DNA Replication & Okazaki Fragments',
      'Transcription & RNA Splicing Hazards',
      'Ribosomal Translation & Codon Shifts',
      'CRISPR Cas9 Gene Editing Arena'
    ],
    tips: [
      'Frameshift mutations scramble the platform layout!',
      'Spliceosomes cut out intervening ground blocks.',
      'Avoid point mutations on the DNA double helix bridge.',
      'The Chimera unleashes double-strand breaks across the arena!'
    ],
    bossQuote: 'One base pair deletion and your entire academic sequence is ruined!'
  },
  {
    id: 'econ202',
    courseCode: 'ECON 202',
    courseName: 'Macroeconomic Principles',
    examTitle: 'Final Exam: The Inflationary Behemoth',
    difficulty: 'final_raid',
    weightPercent: 35,
    bossHp: 350,
    topics: [
      'Aggregate Demand & Supply Shocks',
      'Federal Reserve Interest Rate Traps',
      'Fiscal Policy & Multiplier Effects',
      'The Phillips Curve & Stagflation Colosseum'
    ],
    tips: [
      'Liquidity traps will freeze your jump velocity!',
      'Unchecked currency printing causes platforms to inflate out of reach.',
      'Beware sudden stagflation spikes that defy Keynesian predictions.',
      'The Behemoth fires interest rate hike shockwaves!'
    ],
    bossQuote: 'Your grades cannot outpace my 15% annual inflation rate!'
  }
];

class SyllabusEngine {
  constructor() {
    this.currentCourse = ACADEMIC_PRESETS[0];
    this.allCourses = [...ACADEMIC_PRESETS];
    this.loadFromSyllabornStorage();
  }

  // Load user courses and boss milestones from Syllaborn LocalStorage
  loadFromSyllabornStorage() {
    try {
      const raw = localStorage.getItem('syllaborn:data:v1');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.courses && data.courses.length > 0) {
          data.courses.forEach(c => {
            // Find milestones for this course
            const courseMilestones = (data.milestones || []).filter(m => m.courseId === c.id);
            const bossMilestone = courseMilestones.find(
              m => m.difficultyCategory === 'boss_fight' ||
                   m.difficultyCategory === 'final_raid' ||
                   m.milestoneType === 'midterm' ||
                   m.milestoneType === 'final_exam'
            ) || courseMilestones[0];

            // Find units/topics for this course
            const courseUnits = (data.units || []).filter(u => u.courseId === c.id);
            const topicsList = [];
            courseUnits.forEach(u => {
              if (u.topics && u.topics.length > 0) {
                u.topics.forEach(t => topicsList.push(t.title || t.questTitle));
              } else {
                topicsList.push(u.title);
              }
            });

            const weight = bossMilestone?.weightPercent || 30;
            const hp = bossMilestone?.bossHp || Math.round(weight * 10);

            const customCourse = {
              id: 'syllaborn_' + c.id,
              syllabornId: c.id,
              milestoneId: bossMilestone?.id,
              courseCode: c.courseCode || 'SYLLABUS',
              courseName: c.courseName || 'University Course',
              examTitle: bossMilestone?.title || `${c.courseCode || 'Course'} Exam Boss`,
              difficulty: bossMilestone?.difficultyCategory || 'boss_fight',
              weightPercent: weight,
              bossHp: hp,
              topics: topicsList.length > 0 ? topicsList : [
                `${c.courseName} - Core Fundamentals`,
                `${c.courseName} - Advanced Application`,
                `${c.courseName} - Midterm Mastery`,
                `${c.courseName} - Final Defense`
              ],
              tips: [
                `Course Code: ${c.courseCode} - Syllabus Grade Weight: ${weight}%`,
                'Every preparation quest you complete in Syllaborn weakens this boss!',
                'Watch out for deceptive deadline shifts and pop-quiz hazards.',
                `Defeat ${bossMilestone?.title || 'the Boss'} to claim semester victory!`
              ],
              bossQuote: `I am ${bossMilestone?.title || 'The Course Boss'}, guardian of ${weight}% of your final grade!`
            };

            // Prepend so user's real uploaded syllabus is first
            this.allCourses.unshift(customCourse);
          });

          // Set active course to first user course
          this.currentCourse = this.allCourses[0];
        }
      }
    } catch (e) {
      console.warn('Could not read Syllaborn storage:', e);
    }
  }

  // Set active syllabus/course
  selectCourse(courseId) {
    const found = this.allCourses.find(c => c.id === courseId);
    if (found) {
      this.currentCourse = found;
      return this.currentCourse;
    }
    return null;
  }

  // Generate dynamic custom topic on the fly (e.g. user typed "Organic Chemistry")
  setCustomTopic(topicName) {
    if (!topicName || !topicName.trim()) return;
    const clean = topicName.trim();
    const id = 'custom_' + Date.now();
    const weight = 35;
    const customCourse = {
      id: id,
      courseCode: clean.length <= 8 ? clean.toUpperCase() : 'TOPIC',
      courseName: clean,
      examTitle: `${clean} Examination Boss`,
      difficulty: 'final_raid',
      weightPercent: weight,
      bossHp: weight * 10,
      topics: [
        `${clean} - Fundamentals & Intro`,
        `${clean} - Complex Problem Sets`,
        `${clean} - High-Stakes Evaluation`,
        `${clean} - Final Boss Encounter`
      ],
      tips: [
        `Topic: ${clean} is now loaded into the Do Or Die arena!`,
        'Syllabus traps and academic hazards have re-calibrated to this subject.',
        'Knowledge blasts deal increased damage against this topic boss.',
        'Survive the pop quizzes to unlock the exam door!'
      ],
      bossQuote: `I represent the hardest questions in ${clean}! Prepare to be tested!`
    };

    this.allCourses.unshift(customCourse);
    this.currentCourse = customCourse;
    return customCourse;
  }

  // Parse uploaded PDF file client-side and extract course details
  async parseUploadedPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const text = this.extractTextFromRawBuffer(buffer);
          const parsed = this.analyzeSyllabusText(text, file.name);
          this.allCourses.unshift(parsed);
          this.currentCourse = parsed;
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Heuristic extraction of text streams from PDF ArrayBuffer
  extractTextFromRawBuffer(arrayBuffer) {
    const uint8 = new Uint8Array(arrayBuffer);
    let str = '';
    // Sample readable ASCII/UTF8 runs
    const len = Math.min(uint8.length, 500000);
    let chunk = [];
    for (let i = 0; i < len; i++) {
      const b = uint8[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
        chunk.push(String.fromCharCode(b));
      } else if (chunk.length > 3) {
        str += chunk.join('') + ' ';
        chunk = [];
      } else {
        chunk = [];
      }
    }
    if (chunk.length > 0) str += chunk.join('');
    return str;
  }

  // Extract Course Code, Name, Exams, and Weights from raw text
  analyzeSyllabusText(rawText, filename) {
    let courseCode = 'COURSE';
    let courseName = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    let examTitle = 'Final Examination Boss';
    let weight = 35;
    const topics = [];

    // Match patterns like CS 101, MATH 240, BIO 110, CHEM 102
    const codeMatch = rawText.match(/\b([A-Z]{2,5}\s?[-#]?\s?\d{2,4}[A-Z]?)\b/);
    if (codeMatch) {
      courseCode = codeMatch[1].replace(/[-#]/g, '').trim();
    }

    // Match course titles like "Introduction to..." or "Principles of..."
    const titleMatch = rawText.match(/(?:Course Title|Course Name|Subject):\s*([^\n\r]{4,50})/i) ||
                       rawText.match(/\b((?:Introduction to|Fundamentals of|Principles of|Advanced)\s+[A-Za-z\s]{3,35})/i);
    if (titleMatch) {
      courseName = titleMatch[1].trim();
    }

    // Match grading weights like "Final Exam: 40%" or "Midterm 25%"
    const weightMatch = rawText.match(/(?:Final Exam|Final Examination|Midterm Exam|Exam|Final Project)[^\n\d%]{0,30}(\d{1,2})\s*%/i);
    if (weightMatch) {
      const parsedWeight = parseInt(weightMatch[1], 10);
      if (parsedWeight >= 10 && parsedWeight <= 80) {
        weight = parsedWeight;
        examTitle = `Final Exam (${weight}% Weight)`;
      }
    }

    // Extract potential topics (Unit 1, Week 2, Module 3, Chapter 4)
    const topicMatches = rawText.matchAll(/(?:Unit|Week|Module|Chapter)\s*\d+[:\-]?\s*([A-Za-z0-9\s,&]{4,40})/gi);
    for (const m of topicMatches) {
      if (topics.length < 4 && m[1]) {
        topics.push(m[1].trim());
      }
    }

    if (topics.length === 0) {
      topics.push(
        `${courseName} - Core Directives`,
        `${courseName} - Problem Set Analysis`,
        `${courseName} - Synthesis & Labs`,
        `${courseName} - Comprehensive Final Raid`
      );
    }

    const hp = weight * 10;
    const id = 'pdf_' + Date.now();

    return {
      id: id,
      courseCode: courseCode,
      courseName: courseName,
      examTitle: examTitle,
      difficulty: weight >= 30 ? 'final_raid' : 'boss_fight',
      weightPercent: weight,
      bossHp: hp,
      topics: topics,
      tips: [
        `Extracted from ${filename}: Grading weight is ${weight}% (${hp} Boss HP).`,
        'Every regular quest you complete in this course weakens the exam boss.',
        'Be prepared for unannounced syllabus pop-quizzes and moving platforms!',
        'Vanquish this boss to record an A+ grade in Syllaborn!'
      ],
      bossQuote: `I have extracted myself directly from ${filename}! Prepare for the ${weight}% evaluation!`
    };
  }

  // Report boss damage/victory back to Syllaborn
  reportVictoryToSyllaborn(bossData) {
    try {
      // 1. Notify parent window if in an iframe
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'SYLLABORN_BOSS_VANQUISHED',
          courseCode: bossData.courseCode,
          courseName: bossData.courseName,
          examTitle: bossData.examTitle,
          xpEarned: Math.max(250, bossData.bossHp),
          milestoneId: bossData.milestoneId || null,
          syllabornId: bossData.syllabornId || null,
          timestamp: new Date().toISOString()
        }, '*');
      }

      // 2. Also directly update localStorage if Syllaborn data exists
      const raw = localStorage.getItem('syllaborn:data:v1');
      if (raw) {
        const data = JSON.parse(raw);
        let modified = false;

        // If this matches a milestone, mark it completed
        if (bossData.milestoneId && data.milestones) {
          const m = data.milestones.find(item => item.id === bossData.milestoneId);
          if (m && m.status !== 'completed') {
            m.status = 'completed';
            m.completedAt = new Date().toISOString();
            modified = true;
          }
        }

        // Add XP transaction
        const xpAmount = Math.max(250, bossData.bossHp);
        if (data.xpTransactions) {
          data.xpTransactions.push({
            id: 'xp_boss_' + Date.now(),
            amount: xpAmount,
            reason: `Vanquished Boss in Do Or Die: ${bossData.examTitle}`,
            category: 'boss_victory',
            createdAt: new Date().toISOString()
          });
          modified = true;
        }

        // Add Activity log
        if (data.activities) {
          data.activities.unshift({
            id: 'act_boss_' + Date.now(),
            type: 'milestone_completed',
            title: `Do Or Die Arena: ${bossData.examTitle} Vanquished!`,
            description: `Defeated the ${bossData.courseCode} syllabus boss (${bossData.weightPercent}% weight) and earned ${xpAmount} XP.`,
            xpEarned: xpAmount,
            createdAt: new Date().toISOString()
          });
          modified = true;
        }

        if (modified) {
          localStorage.setItem('syllaborn:data:v1', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('syllaborn:storage:change'));
        }
      }
    } catch (e) {
      console.warn('Could not record Syllaborn victory:', e);
    }
  }
}

window.syllabusEngine = new SyllabusEngine();
