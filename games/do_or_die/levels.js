// Level Devil Level Definitions & Dynamic Syllabus Trap Builder
// 25 cols x 15 rows, tile size = 32px (Canvas: 800 x 480)

const TILE = {
  EMPTY: 0,
  SOLID: 1,
  SPIKE_UP: 2,
  SPIKE_DOWN: 3,
  FALLING_FLOOR: 4,
  HIDDEN_SPIKE: 5,
  DODGE_PLATFORM: 6,
  SPRING_PAD: 7,
  STUDY_ORB: 8,
  STUDY_SWITCH: 9,
  DOOR: 10,
  GRAVITY_FLIP: 11,
  BOSS_TERMINAL: 12,
  SPAWN: 13
};

class LevelManager {
  constructor() {
    this.currentLevelIndex = 0;
    this.trollDeaths = 0;
  }

  // Generate the 4 stages adapted to the current syllabus course
  getLevels(course) {
    const topics = course.topics || [
      'Unit 1: Fundamentals',
      'Unit 2: Problem Sets',
      'Unit 3: Applied Theory',
      'Unit 4: Final Exam'
    ];

    return [
      // ==========================================
      // STAGE 1: The Syllabus Pop Quiz
      // Theme: Disappearing floors & moving doors
      // ==========================================
      {
        id: 1,
        title: 'Stage 1: The Syllabus Pop Quiz',
        subtitle: `Topic: ${topics[0] || 'Course Syllabus Policies'}`,
        hint: 'Hint: "Did you read page 3 of the syllabus?"',
        spawn: { x: 2, y: 12 },
        door: { x: 22, y: 12, targetX: 22, trollOffset: -4, hasTrolled: false },
        map: this.buildStage1Map(),
        trolls: [
          { type: 'surprise_spikes', triggerX: 9, spikeX: 11, spikeY: 13, triggered: false },
          { type: 'surprise_spikes', triggerX: 14, spikeX: 16, spikeY: 13, triggered: false },
          { type: 'fake_door', triggerDist: 3.2, message: 'Classroom moved to Hall B!', triggered: false }
        ],
        requiredOrbs: 1
      },

      // ==========================================
      // STAGE 2: The Midterm Gauntlet
      // Theme: Moving hazards & dodging platforms
      // ==========================================
      {
        id: 2,
        title: 'Stage 2: The Midterm Gauntlet',
        subtitle: `Topic: ${topics[1] || 'Midterm Problem Sets'}`,
        hint: 'Hint: Late penalty sawblades move faster when you hesitate!',
        spawn: { x: 2, y: 12 },
        door: { x: 22, y: 4, targetX: 22, trollOffset: 0, hasTrolled: false },
        map: this.buildStage2Map(),
        trolls: [
          { type: 'dodging_platform', platformId: 'plat1', triggerX: 8, shiftX: 3, triggered: false },
          { type: 'surprise_spikes', triggerX: 17, spikeX: 19, spikeY: 10, triggered: false }
        ],
        movingHazards: [
          { x: 7, y: 12, startX: 7, endX: 14, speed: 2.2, dir: 1, label: 'Late Penalty' },
          { x: 16, y: 8, startX: 16, endX: 21, speed: 2.8, dir: -1, label: 'Grading Curve' }
        ],
        requiredOrbs: 2
      },

      // ==========================================
      // STAGE 3: The All-Nighter Abyss
      // Theme: Falling deadline blocks & tricky jumps
      // ==========================================
      {
        id: 3,
        title: 'Stage 3: The All-Nighter Abyss',
        subtitle: `Topic: ${topics[2] || 'Advanced Exam Preparation'}`,
        hint: 'Hint: Cramming at 3 AM makes the ground collapse beneath you.',
        spawn: { x: 2, y: 12 },
        door: { x: 22, y: 12, targetX: 22, trollOffset: 0, hasTrolled: false },
        map: this.buildStage3Map(),
        trolls: [
          { type: 'falling_crusher', triggerX: 7, crusherX: 7, startY: 1, targetY: 10, triggered: false },
          { type: 'falling_crusher', triggerX: 15, crusherX: 15, startY: 1, targetY: 10, triggered: false },
          { type: 'surprise_spikes', triggerX: 18, spikeX: 20, spikeY: 13, triggered: false }
        ],
        requiredOrbs: 3
      },

      // ==========================================
      // STAGE 4: THE FINAL EXAM BOSS ARENA
      // Real-time Combat Arena against the Boss!
      // ==========================================
      {
        id: 4,
        isBossArena: true,
        title: `Final Encounter: ${course.examTitle || 'The Semester Boss'}`,
        subtitle: `Grading Weight: ${course.weightPercent}% - Boss HP: ${course.bossHp}`,
        hint: 'Hint: Activate Study Terminals & stomp on the Boss to deplete its HP!',
        spawn: { x: 3, y: 12 },
        map: this.buildBossArenaMap(),
        boss: {
          name: course.examTitle || 'The Final Exam',
          maxHp: course.bossHp || 350,
          currentHp: course.bossHp || 350,
          x: 12 * 32,
          y: 4 * 32,
          width: 54,
          height: 54,
          vx: 1.5,
          vy: 0,
          state: 'floating',
          attackTimer: 0,
          enraged: false,
          quote: course.bossQuote || 'Prepare to be evaluated!'
        },
        terminals: [
          { id: 'termA', x: 5, y: 12, charged: true, label: 'Study Terminal A' },
          { id: 'termB', x: 12, y: 7, charged: true, label: 'Study Terminal B' },
          { id: 'termC', x: 19, y: 12, charged: true, label: 'Study Terminal C' }
        ]
      }
    ];
  }

  // Stage 1 Matrix (25 cols x 15 rows)
  buildStage1Map() {
    const grid = this.createEmptyGrid();
    // Border walls & ceiling
    for (let x = 0; x < 25; x++) {
      grid[0][x] = TILE.SOLID;
      grid[14][x] = TILE.SOLID; // Floor
    }
    for (let y = 0; y < 15; y++) {
      grid[y][0] = TILE.SOLID;
      grid[y][24] = TILE.SOLID;
    }

    // Platforms
    this.setRow(grid, 11, 5, 8, TILE.SOLID);
    this.setRow(grid, 9, 10, 13, TILE.FALLING_FLOOR);
    this.setRow(grid, 11, 15, 18, TILE.SOLID);

    // Falling floor trap over floor
    grid[13][7] = TILE.FALLING_FLOOR;
    grid[13][8] = TILE.FALLING_FLOOR;

    // Study Key Orb in the air
    grid[7][11] = TILE.STUDY_ORB;

    // Exit Door
    grid[13][22] = TILE.DOOR;

    return grid;
  }

  // Stage 2 Matrix
  buildStage2Map() {
    const grid = this.createEmptyGrid();
    for (let x = 0; x < 25; x++) {
      grid[0][x] = TILE.SOLID;
      grid[14][x] = TILE.SOLID;
    }
    for (let y = 0; y < 15; y++) {
      grid[y][0] = TILE.SOLID;
      grid[y][24] = TILE.SOLID;
    }

    // Pit with Spikes
    for (let x = 6; x <= 15; x++) {
      grid[13][x] = TILE.SPIKE_UP;
    }

    // Floating stepping platforms
    this.setRow(grid, 10, 4, 6, TILE.SOLID);
    this.setRow(grid, 8, 8, 10, TILE.DODGE_PLATFORM);
    this.setRow(grid, 6, 12, 14, TILE.SOLID);
    this.setRow(grid, 5, 17, 22, TILE.SOLID);

    // Study Orbs
    grid[6][5] = TILE.STUDY_ORB;
    grid[4][13] = TILE.STUDY_ORB;

    // Door at top right
    grid[4][22] = TILE.DOOR;

    return grid;
  }

  // Stage 3 Matrix
  buildStage3Map() {
    const grid = this.createEmptyGrid();
    for (let x = 0; x < 25; x++) {
      grid[0][x] = TILE.SOLID;
      grid[14][x] = TILE.SOLID;
    }
    for (let y = 0; y < 15; y++) {
      grid[y][0] = TILE.SOLID;
      grid[y][24] = TILE.SOLID;
    }

    // Floor gaps with spikes
    grid[13][8] = TILE.SPIKE_UP;
    grid[13][9] = TILE.SPIKE_UP;
    grid[13][16] = TILE.SPIKE_UP;
    grid[13][17] = TILE.SPIKE_UP;

    // Platforms
    this.setRow(grid, 11, 4, 6, TILE.FALLING_FLOOR);
    this.setRow(grid, 9, 9, 12, TILE.SOLID);
    this.setRow(grid, 7, 14, 17, TILE.FALLING_FLOOR);
    this.setRow(grid, 10, 19, 21, TILE.SOLID);

    // Spring pad to reach high orb
    grid[13][5] = TILE.SPRING_PAD;
    grid[4][11] = TILE.STUDY_ORB;
    grid[5][15] = TILE.STUDY_ORB;
    grid[8][20] = TILE.STUDY_ORB;

    grid[13][22] = TILE.DOOR;

    return grid;
  }

  // Stage 4: Boss Fight Arena Matrix
  buildBossArenaMap() {
    const grid = this.createEmptyGrid();
    for (let x = 0; x < 25; x++) {
      grid[0][x] = TILE.SOLID;
      grid[14][x] = TILE.SOLID; // Main ground floor
    }
    for (let y = 0; y < 15; y++) {
      grid[y][0] = TILE.SOLID;
      grid[y][24] = TILE.SOLID;
    }

    // Boss arena platforms
    this.setRow(grid, 10, 4, 7, TILE.SOLID);   // Left study platform
    this.setRow(grid, 8, 10, 14, TILE.SOLID); // Central high platform
    this.setRow(grid, 10, 17, 20, TILE.SOLID);// Right study platform

    // Spring pads to launch at Boss weak point
    grid[13][2] = TILE.SPRING_PAD;
    grid[13][22] = TILE.SPRING_PAD;

    // Boss Terminals (hit them to blast the boss)
    grid[13][5] = TILE.BOSS_TERMINAL;
    grid[7][12] = TILE.BOSS_TERMINAL;
    grid[13][19] = TILE.BOSS_TERMINAL;

    return grid;
  }

  createEmptyGrid() {
    const grid = [];
    for (let y = 0; y < 15; y++) {
      grid[y] = new Array(25).fill(TILE.EMPTY);
    }
    return grid;
  }

  setRow(grid, y, xStart, xEnd, tileType) {
    for (let x = xStart; x <= xEnd; x++) {
      if (grid[y] && x >= 0 && x < 25) {
        grid[y][x] = tileType;
      }
    }
  }
}

window.levelManager = new LevelManager();
window.TILE = TILE;
