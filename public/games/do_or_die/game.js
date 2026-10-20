// "Do Or Die" - Level Devil Syllabus Boss Fights Engine
// Pure Canvas HTML5 game with dynamic syllabus integration

class DoOrDieGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Logical dimensions
    this.width = 800;
    this.height = 480;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.currentLevelIndex = 0;
    this.levels = [];
    this.activeLevel = null;
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.score = 0;
    this.trollDeaths = 0;
    this.levelTime = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;

    // Particles & effects
    this.particles = [];
    this.floatingTexts = [];
    this.projectiles = []; // Boss attacks & knowledge rays

    // Player Object
    this.player = {
      x: 64,
      y: 384,
      vx: 0,
      vy: 0,
      width: 24,
      height: 28,
      speed: 4.2,
      jumpForce: -9.8,
      grounded: false,
      coyoteFrames: 0,
      jumpBuffered: 0,
      facing: 1, // 1: right, -1: left
      isDead: false,
      invulnerable: 0,
      collectedOrbs: 0
    };

    // Input state
    this.keys = {
      left: false,
      right: false,
      up: false
    };

    // Active course info
    this.course = window.syllabusEngine ? window.syllabusEngine.currentCourse : null;

    this.initInput();
    this.initGame();
    this.startLoop();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        this.keys.up = true;
        this.player.jumpBuffered = 6;
      }
      if (e.code === 'KeyR') this.restartLevel();
      if (e.code === 'KeyM') this.toggleSound();
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) this.keys.up = false;
    });

    // Touch controls for mobile / tablet
    const btnLeft = document.getElementById('touchLeft');
    const btnRight = document.getElementById('touchRight');
    const btnJump = document.getElementById('touchJump');

    if (btnLeft && btnRight && btnJump) {
      const addTouch = (el, key) => {
        el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; if (key === 'up') this.player.jumpBuffered = 6; }, { passive: false });
        el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; }, { passive: false });
      };
      addTouch(btnLeft, 'left');
      addTouch(btnRight, 'right');
      addTouch(btnJump, 'up');
    }
  }

  initGame() {
    this.course = window.syllabusEngine.currentCourse;
    this.levels = window.levelManager.getLevels(this.course);
    this.loadLevel(this.currentLevelIndex);
    this.updateHUD();
  }

  loadLevel(index) {
    if (index >= this.levels.length) {
      this.triggerGameVictory();
      return;
    }

    this.currentLevelIndex = index;
    // Deep clone level map
    const srcLevel = this.levels[index];
    this.activeLevel = JSON.parse(JSON.stringify(srcLevel));

    // Reset player position
    this.player.x = this.activeLevel.spawn.x * 32 + 4;
    this.player.y = this.activeLevel.spawn.y * 32;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isDead = false;
    this.player.collectedOrbs = 0;
    this.player.invulnerable = 20;
    this.isVictory = false;
    this.isGameOver = false;

    this.particles = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.levelTime = 0;

    // Reset troll flags
    if (this.activeLevel.trolls) {
      this.activeLevel.trolls.forEach(t => t.triggered = false);
    }
    if (this.activeLevel.door) {
      this.activeLevel.door.hasTrolled = false;
    }

    this.updateHUD();
    this.showAnnouncement(this.activeLevel.title, this.activeLevel.subtitle);
  }

  restartLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  restartGame() {
    this.isVictory = false;
    this.isGameOver = false;
    this.score = 0;
    this.trollDeaths = 0;
    this.currentLevelIndex = 0;
    this.initGame();
  }

  // Next level progression
  nextLevel() {
    window.soundSystem.playVictory();
    this.showAnnouncement('STAGE COMPLETE!', '+100 XP Earned');
    this.score += 100;
    setTimeout(() => {
      this.loadLevel(this.currentLevelIndex + 1);
    }, 1200);
  }

  // ========================================================
  // MAIN GAME LOOP
  // ========================================================
  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    if (this.isPaused || !this.activeLevel) return;
    this.levelTime++;

    if (this.shakeTime > 0) this.shakeTime--;

    if (!this.player.isDead) {
      this.updatePlayer();
      this.checkLevelDevilTrolls();
    }

    // Update moving hazards
    if (this.activeLevel.movingHazards) {
      this.updateHazards();
    }

    // Update Boss Arena (Stage 4)
    if (this.activeLevel.isBossArena && this.activeLevel.boss) {
      this.updateBoss();
    }

    // Update Projectiles
    this.updateProjectiles();

    // Update Particles & Floating Text
    this.updateEffects();
  }

  // ========================================================
  // PLAYER PHYSICS & MOVEMENT
  // ========================================================
  updatePlayer() {
    const p = this.player;

    // Horizontal Acceleration
    if (this.keys.left) {
      p.vx = -p.speed;
      p.facing = -1;
    } else if (this.keys.right) {
      p.vx = p.speed;
      p.facing = 1;
    } else {
      p.vx *= 0.72; // Smooth friction
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    // Gravity
    p.vy += 0.48;
    if (p.vy > 12) p.vy = 12;

    // Coyote time & Jump buffering
    if (p.grounded) {
      p.coyoteFrames = 8;
    } else if (p.coyoteFrames > 0) {
      p.coyoteFrames--;
    }

    if (p.jumpBuffered > 0) {
      p.jumpBuffered--;
      if (p.coyoteFrames > 0) {
        p.vy = p.jumpForce;
        p.coyoteFrames = 0;
        p.jumpBuffered = 0;
        p.grounded = false;
        window.soundSystem.playJump();
        this.createJumpPuff(p.x + p.width / 2, p.y + p.height);
      }
    }

    // Horizontal Movement & Collisions
    p.x += p.vx;
    this.handleHorizontalCollisions();

    // Vertical Movement & Collisions
    p.grounded = false;
    p.y += p.vy;
    this.handleVerticalCollisions();

    // Check interaction with pickups & hazards
    this.checkTileInteractions();

    // Screen bounds
    if (p.x < 32) p.x = 32;
    if (p.x + p.width > this.width - 32) p.x = this.width - 32 - p.width;
    if (p.y > this.height) {
      this.killPlayer('Fell into the Academic Abyss!');
    }
  }

  handleHorizontalCollisions() {
    const p = this.player;
    const tiles = this.getOverlappingTiles(p.x, p.y, p.width, p.height);

    for (const t of tiles) {
      if (this.isSolidTile(t.type)) {
        if (p.vx > 0) {
          p.x = t.tx * 32 - p.width;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = (t.tx + 1) * 32;
          p.vx = 0;
        }
      }
    }
  }

  handleVerticalCollisions() {
    const p = this.player;
    const tiles = this.getOverlappingTiles(p.x, p.y, p.width, p.height);

    for (const t of tiles) {
      if (this.isSolidTile(t.type)) {
        if (p.vy > 0) {
          // Landing
          p.y = t.ty * 32 - p.height;
          p.vy = 0;
          p.grounded = true;

          // Trigger falling floor collapse
          if (t.type === window.TILE.FALLING_FLOOR) {
            this.triggerFallingFloor(t.tx, t.ty);
          }
        } else if (p.vy < 0) {
          // Ceiling bump
          p.y = (t.ty + 1) * 32;
          p.vy = 0;
        }
      }
    }
  }

  isSolidTile(type) {
    return type === window.TILE.SOLID ||
           type === window.TILE.FALLING_FLOOR ||
           type === window.TILE.DODGE_PLATFORM;
  }

  getOverlappingTiles(x, y, w, h) {
    const list = [];
    const minTx = Math.max(0, Math.floor(x / 32));
    const maxTx = Math.min(24, Math.floor((x + w - 0.1) / 32));
    const minTy = Math.max(0, Math.floor(y / 32));
    const maxTy = Math.min(14, Math.floor((y + h - 0.1) / 32));

    const map = this.activeLevel.map;
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (map[ty] && map[ty][tx] !== window.TILE.EMPTY) {
          list.push({ tx, ty, type: map[ty][tx] });
        }
      }
    }
    return list;
  }

  // Falling Floor Collapse (Level Devil style)
  triggerFallingFloor(tx, ty) {
    setTimeout(() => {
      if (this.activeLevel && this.activeLevel.map[ty]) {
        this.activeLevel.map[ty][tx] = window.TILE.EMPTY;
        this.createBlockShatter(tx * 32 + 16, ty * 32 + 16);
        window.soundSystem.playTroll();
      }
    }, 180);
  }

  // ========================================================
  // LEVEL DEVIL TROLL LOGIC & SURPRISES
  // ========================================================
  checkLevelDevilTrolls() {
    const p = this.player;
    const playerTileX = p.x / 32;
    const playerTileY = p.y / 32;

    if (!this.activeLevel.trolls) return;

    this.activeLevel.trolls.forEach(troll => {
      if (troll.triggered) return;

      // Surprise Spikes thrusting from the ground
      if (troll.type === 'surprise_spikes' && Math.abs(playerTileX - troll.triggerX) < 1.4) {
        troll.triggered = true;
        this.activeLevel.map[troll.spikeY][troll.spikeX] = window.TILE.SPIKE_UP;
        window.soundSystem.playTroll();
        this.addFloatingText('POP QUIZ!', troll.spikeX * 32 + 16, troll.spikeY * 32 - 10, '#f43f5e');
        this.triggerScreenShake(8, 4);
      }

      // Fake Exit Door displacing itself
      if (troll.type === 'fake_door') {
        const door = this.activeLevel.door;
        const distToDoor = Math.hypot(playerTileX - door.x, playerTileY - door.y);
        if (distToDoor < troll.triggerDist && !door.hasTrolled) {
          door.hasTrolled = true;
          troll.triggered = true;
          door.x += door.trollOffset;
          // Relocate door tile in map
          this.activeLevel.map[13][22] = window.TILE.EMPTY;
          this.activeLevel.map[13][door.x] = window.TILE.DOOR;

          window.soundSystem.playTroll();
          this.addFloatingText('Exam Room Moved to Hall B!', door.x * 32 - 40, door.y * 32 - 20, '#fbbf24');
          this.triggerScreenShake(12, 6);
        }
      }

      // Dodging platform sliding away
      if (troll.type === 'dodging_platform' && Math.abs(playerTileX - troll.triggerX) < 1.6) {
        troll.triggered = true;
        window.soundSystem.playTroll();
        this.addFloatingText('Shifted Deadline!', troll.triggerX * 32, 6 * 32, '#a855f7');
        // Shift dodge platform
        for (let tx = 8; tx <= 10; tx++) {
          this.activeLevel.map[8][tx] = window.TILE.EMPTY;
        }
        for (let tx = 11; tx <= 13; tx++) {
          this.activeLevel.map[8][tx] = window.TILE.DODGE_PLATFORM;
        }
        this.triggerScreenShake(8, 3);
      }

      // Falling ceiling crusher boulder
      if (troll.type === 'falling_crusher' && Math.abs(playerTileX - troll.triggerX) < 1.2) {
        troll.triggered = true;
        window.soundSystem.playTroll();
        this.addFloatingText('DEADLINE DROP!', troll.crusherX * 32, 3 * 32, '#ef4444');
        this.spawnFallingCrusher(troll.crusherX, troll.startY, troll.targetY);
      }
    });
  }

  spawnFallingCrusher(tx, startY, targetY) {
    let curY = startY * 32;
    const destY = targetY * 32;
    const interval = setInterval(() => {
      curY += 14;
      // Check collision with player
      if (Math.abs(this.player.x - tx * 32) < 26 && Math.abs(this.player.y - curY) < 28) {
        this.killPlayer('Crushed by 11:59 PM Deadline!');
        clearInterval(interval);
      }
      if (curY >= destY) {
        clearInterval(interval);
        if (this.activeLevel && this.activeLevel.map) {
          const gridY = Math.min(13, Math.floor(destY / 32));
          this.activeLevel.map[gridY][tx] = window.TILE.SOLID;
          this.triggerScreenShake(14, 6);
          window.soundSystem.playLand();
        }
      }
    }, 20);
  }

  // ========================================================
  // TILE INTERACTIONS (Pickups, Spikes, Door, Pads)
  // ========================================================
  checkTileInteractions() {
    const p = this.player;
    const tiles = this.getOverlappingTiles(p.x, p.y, p.width, p.height);

    for (const t of tiles) {
      // 1. Spikes
      if (t.type === window.TILE.SPIKE_UP || t.type === window.TILE.SPIKE_DOWN) {
        this.killPlayer('Pierced by Grade Deflation Spikes!');
        return;
      }

      // 2. Study Orbs
      if (t.type === window.TILE.STUDY_ORB) {
        this.activeLevel.map[t.ty][t.tx] = window.TILE.EMPTY;
        p.collectedOrbs++;
        window.soundSystem.playCoin();
        this.score += 50;
        this.createPickupSparkles(t.tx * 32 + 16, t.ty * 32 + 16);
        this.addFloatingText('+50 Study XP', t.tx * 32 + 16, t.ty * 32 - 10, '#38bdf8');
        this.updateHUD();
      }

      // 3. Spring Pad (Super Launch)
      if (t.type === window.TILE.SPRING_PAD) {
        p.vy = -14.2;
        p.grounded = false;
        window.soundSystem.playJump();
        this.createJumpPuff(t.tx * 32 + 16, t.ty * 32);
        this.addFloatingText('CURVE BOOST!', t.tx * 32 + 16, t.ty * 32 - 14, '#10b981');
      }

      // 4. Boss Terminals (Stage 4)
      if (t.type === window.TILE.BOSS_TERMINAL) {
        const terminal = this.activeLevel.terminals?.find(tm => tm.x === t.tx && tm.y === t.ty);
        if (terminal && terminal.charged) {
          terminal.charged = false;
          this.fireKnowledgeBlast(t.tx * 32 + 16, t.ty * 32, this.activeLevel.boss);
          setTimeout(() => { terminal.charged = true; }, 4000); // Recharge in 4s
        }
      }

      // 5. Door (Exit)
      if (t.type === window.TILE.DOOR) {
        const required = this.activeLevel.requiredOrbs || 0;
        if (p.collectedOrbs >= required) {
          this.nextLevel();
          return;
        } else {
          this.addFloatingText(`Need ${required - p.collectedOrbs} more Study Orbs!`, p.x, p.y - 18, '#f59e0b');
        }
      }
    }
  }

  // ========================================================
  // MOVING HAZARDS
  // ========================================================
  updateHazards() {
    this.activeLevel.movingHazards.forEach(h => {
      h.x += (h.speed * h.dir) / 32;
      if (h.x >= h.endX) {
        h.x = h.endX;
        h.dir = -1;
      } else if (h.x <= h.startX) {
        h.x = h.startX;
        h.dir = 1;
      }

      // Collision with player
      const hx = h.x * 32;
      const hy = h.y * 32;
      if (Math.hypot((this.player.x + 12) - (hx + 16), (this.player.y + 14) - (hy + 16)) < 22) {
        this.killPlayer(`Hit by ${h.label || 'Hazard'}!`);
      }
    });
  }

  // ========================================================
  // STAGE 4: BOSS ARENA COMBAT LOGIC
  // ========================================================
  updateBoss() {
    const boss = this.activeLevel.boss;
    if (!boss || boss.currentHp <= 0) return;

    boss.attackTimer++;

    // Boss Floating Movement
    boss.x += boss.vx;
    boss.y = 4 * 32 + Math.sin(this.levelTime * 0.04) * 28;

    if (boss.x > 21 * 32) {
      boss.x = 21 * 32;
      boss.vx = -Math.abs(boss.vx);
    } else if (boss.x < 3 * 32) {
      boss.x = 3 * 32;
      boss.vx = Math.abs(boss.vx);
    }

    // Check enrage threshold (< 50% HP)
    if (!boss.enraged && boss.currentHp <= boss.maxHp * 0.5) {
      boss.enraged = true;
      boss.vx *= 1.6;
      window.soundSystem.playBossEnrage();
      this.triggerScreenShake(20, 8);
      this.showAnnouncement('BOSS ENRAGED!', 'Final Exam Cramming Mode Activated!');
    }

    // Boss Attacks
    const attackInterval = boss.enraged ? 90 : 140;
    if (boss.attackTimer >= attackInterval) {
      boss.attackTimer = 0;
      this.launchBossAttack(boss);
    }

    // Player Jump-Stomp on Boss head
    const p = this.player;
    if (p.vy > 0 &&
        p.x + p.width > boss.x &&
        p.x < boss.x + boss.width &&
        p.y + p.height >= boss.y &&
        p.y + p.height <= boss.y + 24) {
      // Stomp hit!
      p.vy = -10.5; // Bounce player up
      this.damageBoss(boss, 75, 'CRITICAL STUDY STOMP!');
      this.createBossHitSparks(boss.x + boss.width / 2, boss.y + 10);
    } else if (Math.hypot((p.x + 12) - (boss.x + boss.width / 2), (p.y + 14) - (boss.y + boss.height / 2)) < 36) {
      // Direct body collision with boss
      this.killPlayer('Obliterated by the Final Exam Boss!');
    }
  }

  launchBossAttack(boss) {
    const attackType = Math.random();
    window.soundSystem.playShoot();

    if (attackType < 0.45) {
      // 1. Pop Quiz Fireball (aimed at player)
      const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
      this.projectiles.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height / 2,
        vx: Math.cos(angle) * 4.2,
        vy: Math.sin(angle) * 4.2,
        radius: 8,
        color: '#f43f5e',
        label: '?',
        fromBoss: true
      });
    } else if (attackType < 0.8) {
      // 2. Rolling Late Penalty Sawblades across floor
      const dir = this.player.x < boss.x ? -1 : 1;
      this.projectiles.push({
        x: boss.x + boss.width / 2,
        y: 13 * 32 + 10,
        vx: dir * 5.2,
        vy: 0,
        radius: 12,
        color: '#fbbf24',
        label: '11:59',
        fromBoss: true
      });
    } else {
      // 3. Shockwave Slam
      this.triggerScreenShake(14, 5);
      this.addFloatingText('GRADING CURVE SLAM!', boss.x, boss.y - 15, '#e11d48');
      // Spawn two ground shockwaves left and right
      [-1, 1].forEach(d => {
        this.projectiles.push({
          x: boss.x + boss.width / 2,
          y: 13 * 32 + 12,
          vx: d * 6,
          vy: 0,
          radius: 10,
          color: '#a855f7',
          label: '!',
          fromBoss: true
        });
      });
    }
  }

  // Fire Knowledge Blast from Study Terminal
  fireKnowledgeBlast(fromX, fromY, boss) {
    window.soundSystem.playShoot();
    this.createJumpPuff(fromX, fromY);
    this.addFloatingText('KNOWLEDGE RAY!', fromX, fromY - 15, '#06b6d4');

    const angle = Math.atan2(boss.y + boss.height / 2 - fromY, boss.x + boss.width / 2 - fromX);
    this.projectiles.push({
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * 8.5,
      vy: Math.sin(angle) * 8.5,
      radius: 9,
      color: '#38bdf8',
      label: 'A+',
      fromBoss: false
    });
  }

  damageBoss(boss, amount, text = 'HIT!') {
    boss.currentHp = Math.max(0, boss.currentHp - amount);
    window.soundSystem.playBossHit();
    this.triggerScreenShake(12, 6);
    this.addFloatingText(`-${amount} HP`, boss.x + boss.width / 2, boss.y - 12, '#38bdf8');
    this.updateHUD();

    if (boss.currentHp <= 0) {
      this.defeatBoss(boss);
    }
  }

  defeatBoss(boss) {
    this.createBossDeathExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2);
    window.soundSystem.playVictory();
    this.triggerScreenShake(30, 10);
    this.showAnnouncement('SYLLABUS BOSS VANQUISHED!', 'Course Grade: A+ (100%)');

    // Report victory to Syllaborn state & localStorage!
    window.syllabusEngine.reportVictoryToSyllaborn(this.course);

    setTimeout(() => {
      this.triggerGameVictory();
    }, 2000);
  }

  // Update projectiles
  updateProjectiles() {
    const p = this.player;
    const boss = this.activeLevel.boss;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check collision with player
      if (proj.fromBoss) {
        if (!p.isDead && Math.hypot((p.x + 12) - proj.x, (p.y + 14) - proj.y) < proj.radius + 10) {
          this.killPlayer('Hit by Boss Exam Projectile!');
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Player's Knowledge Ray hitting Boss
        if (boss && boss.currentHp > 0 &&
            Math.hypot((boss.x + boss.width / 2) - proj.x, (boss.y + boss.height / 2) - proj.y) < proj.radius + 28) {
          this.damageBoss(boss, 55, 'KNOWLEDGE IMPACT!');
          this.createBossHitSparks(proj.x, proj.y);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Out of bounds
      if (proj.x < 0 || proj.x > this.width || proj.y < 0 || proj.y > this.height) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // ========================================================
  // PLAYER DEATH & RESPAWN
  // ========================================================
  killPlayer(reason = 'Failed the Pop Quiz!') {
    if (this.player.isDead) return;
    this.player.isDead = true;
    this.trollDeaths++;
    window.soundSystem.playDeath();
    this.triggerScreenShake(16, 7);
    this.createPlayerDeathExplosion(this.player.x + 12, this.player.y + 14);

    this.addFloatingText(reason, this.player.x + 12, this.player.y - 12, '#f43f5e');
    this.updateHUD();

    setTimeout(() => {
      this.restartLevel();
    }, 900);
  }

  triggerScreenShake(frames, intensity) {
    this.shakeTime = frames;
    this.shakeIntensity = intensity;
  }

  // ========================================================
  // RENDERING & VISUALS
  // ========================================================
  render() {
    this.ctx.save();

    // Screen Shake
    if (this.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // 1. Clear & Background Gradient (Syllaborn RPG space theme)
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0a0d1a');
    bgGrad.addColorStop(0.5, '#0f1226');
    bgGrad.addColorStop(1, '#151733');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle starfield grid
    this.renderStarfield();

    // 2. Draw Level Tile Map
    if (this.activeLevel && this.activeLevel.map) {
      this.renderTileMap();
    }

    // 3. Draw Moving Hazards
    if (this.activeLevel.movingHazards) {
      this.renderHazards();
    }

    // 4. Draw Projectiles
    this.renderProjectiles();

    // 5. Draw Boss (Stage 4)
    if (this.activeLevel.isBossArena && this.activeLevel.boss) {
      this.renderBoss(this.activeLevel.boss);
    }

    // 6. Draw Player
    if (!this.player.isDead) {
      this.renderPlayer();
    }

    // 7. Draw Particles & Effects
    this.renderEffects();

    this.ctx.restore();
  }

  renderStarfield() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + this.levelTime * 0.1) % this.width;
      const sy = (i * 47) % this.height;
      this.ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  }

  renderTileMap() {
    const map = this.activeLevel.map;
    for (let ty = 0; ty < 15; ty++) {
      for (let tx = 0; tx < 25; tx++) {
        const tile = map[ty][tx];
        const px = tx * 32;
        const py = ty * 32;

        if (tile === window.TILE.SOLID) {
          // Solid Platform Block with fantasy purple edge
          this.ctx.fillStyle = '#1e1b4b';
          this.ctx.fillRect(px, py, 32, 32);
          this.ctx.strokeStyle = '#6366f1';
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(px + 1, py + 1, 30, 30);
          this.ctx.fillStyle = '#4338ca';
          this.ctx.fillRect(px + 2, py + 2, 28, 4);
        } else if (tile === window.TILE.FALLING_FLOOR) {
          // Deceptive crumbling floor
          this.ctx.fillStyle = '#312e81';
          this.ctx.fillRect(px, py, 32, 32);
          this.ctx.strokeStyle = '#a855f7';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px + 2, py + 2, 28, 28);
          // Cracks
          this.ctx.strokeStyle = '#e879f9';
          this.ctx.beginPath();
          this.ctx.moveTo(px + 6, py + 6);
          this.ctx.lineTo(px + 26, py + 26);
          this.ctx.stroke();
        } else if (tile === window.TILE.DODGE_PLATFORM) {
          // Moving dodging platform
          this.ctx.fillStyle = '#701a75';
          this.ctx.fillRect(px, py, 32, 32);
          this.ctx.strokeStyle = '#f472b6';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(px + 1, py + 1, 30, 30);
        } else if (tile === window.TILE.SPIKE_UP) {
          // Spikes pointing up
          this.ctx.fillStyle = '#f43f5e';
          this.ctx.beginPath();
          this.ctx.moveTo(px, py + 32);
          this.ctx.lineTo(px + 8, py + 8);
          this.ctx.lineTo(px + 16, py + 32);
          this.ctx.lineTo(px + 24, py + 8);
          this.ctx.lineTo(px + 32, py + 32);
          this.ctx.closePath();
          this.ctx.fill();
        } else if (tile === window.TILE.SPRING_PAD) {
          // Spring jump pad
          this.ctx.fillStyle = '#10b981';
          this.ctx.fillRect(px + 4, py + 22, 24, 10);
          this.ctx.fillStyle = '#6ee7b7';
          this.ctx.fillRect(px + 2, py + 16, 28, 6);
        } else if (tile === window.TILE.STUDY_ORB) {
          // Floating Study Key / Orb
          const bob = Math.sin(this.levelTime * 0.08) * 4;
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.shadowColor = '#06b6d4';
          this.ctx.shadowBlur = 10;
          this.ctx.beginPath();
          this.ctx.arc(px + 16, py + 16 + bob, 9, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 9px sans-serif';
          this.ctx.fillText('A+', px + 10, py + 19 + bob);
        } else if (tile === window.TILE.BOSS_TERMINAL) {
          // Study Terminal in Boss room
          const terminal = this.activeLevel.terminals?.find(tm => tm.x === tx && tm.y === ty);
          const isCharged = terminal ? terminal.charged : true;
          this.ctx.fillStyle = isCharged ? '#06b6d4' : '#475569';
          this.ctx.fillRect(px + 4, py + 8, 24, 24);
          this.ctx.strokeStyle = '#e0f2fe';
          this.ctx.strokeRect(px + 6, py + 10, 20, 20);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 8px monospace';
          this.ctx.fillText(isCharged ? 'READY' : 'WAIT', px + 7, py + 22);
        } else if (tile === window.TILE.DOOR) {
          // Exit Door / Exam Room
          this.ctx.fillStyle = '#0f766e';
          this.ctx.fillRect(px + 4, py, 24, 32);
          this.ctx.strokeStyle = '#2dd4bf';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(px + 4, py, 24, 32);
          // Door handle & glowing portal center
          this.ctx.fillStyle = '#a7f3d0';
          this.ctx.fillRect(px + 8, py + 6, 16, 20);
        }
      }
    }
  }

  renderHazards() {
    this.activeLevel.movingHazards.forEach(h => {
      const hx = h.x * 32;
      const hy = h.y * 32;
      this.ctx.save();
      this.ctx.translate(hx + 16, hy + 16);
      this.ctx.rotate(this.levelTime * 0.15);

      // Rotating sawblade
      this.ctx.fillStyle = '#f43f5e';
      this.ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        this.ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        const a2 = a + Math.PI / 8;
        this.ctx.lineTo(Math.cos(a2) * 9, Math.sin(a2) * 9);
      }
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();

      // Label above hazard
      this.ctx.fillStyle = '#fda4af';
      this.ctx.font = 'bold 8px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(h.label || 'Hazard', hx + 16, hy - 4);
    });
  }

  renderProjectiles() {
    this.projectiles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      if (p.label) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(p.label, p.x, p.y + 3);
      }
    });
  }

  // Draw the Scholar Player
  renderPlayer() {
    const p = this.player;
    this.ctx.save();
    this.ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    if (p.facing === -1) this.ctx.scale(-1, 1);

    // Body (Robes)
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(-10, -6, 20, 20);

    // Scholar Cape
    this.ctx.fillStyle = '#1d4ed8';
    this.ctx.fillRect(-12, -4, 5, 18);

    // Head / Face
    this.ctx.fillStyle = '#fde047';
    this.ctx.fillRect(-8, -14, 16, 10);

    // Graduation Cap
    this.ctx.fillStyle = '#1e1b4b';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -22);
    this.ctx.lineTo(12, -16);
    this.ctx.lineTo(0, -10);
    this.ctx.lineTo(-12, -16);
    this.ctx.closePath();
    this.ctx.fill();

    // Cap Tassel
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -16);
    this.ctx.lineTo(10, -12);
    this.ctx.stroke();

    // Eyes
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(2, -12, 3, 3);

    this.ctx.restore();
  }

  // Draw Boss Sprite & Boss Aura (Stage 4)
  renderBoss(boss) {
    if (boss.currentHp <= 0) return;

    this.ctx.save();
    this.ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);

    // Glowing Boss Aura
    const auraColor = boss.enraged ? 'rgba(239, 68, 68, 0.35)' : 'rgba(168, 85, 247, 0.3)';
    this.ctx.fillStyle = auraColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 42, 0, Math.PI * 2);
    this.ctx.fill();

    // Boss Core
    this.ctx.fillStyle = boss.enraged ? '#b91c1c' : '#581c87';
    this.ctx.fillRect(-24, -24, 48, 48);
    this.ctx.strokeStyle = boss.enraged ? '#fca5a5' : '#c084fc';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeRect(-24, -24, 48, 48);

    // Boss Crown / Demon Horns
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.beginPath();
    this.ctx.moveTo(-20, -24);
    this.ctx.lineTo(-12, -38);
    this.ctx.lineTo(-4, -24);
    this.ctx.lineTo(4, -38);
    this.ctx.lineTo(12, -24);
    this.ctx.lineTo(20, -38);
    this.ctx.lineTo(24, -24);
    this.ctx.closePath();
    this.ctx.fill();

    // Fierce Boss Eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-14, -8, 8, 8);
    this.ctx.fillRect(6, -8, 8, 8);
    this.ctx.fillStyle = boss.enraged ? '#dc2626' : '#9333ea';
    this.ctx.fillRect(-12, -6, 5, 5);
    this.ctx.fillRect(8, -6, 5, 5);

    // Mouth / Grin
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-10, 8, 20, 5);

    this.ctx.restore();

    // Floating Boss Health Bar above Boss
    const barWidth = 80;
    const hpRatio = boss.currentHp / boss.maxHp;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(boss.x + (boss.width - barWidth) / 2, boss.y - 18, barWidth, 8);
    this.ctx.fillStyle = boss.enraged ? '#ef4444' : '#a855f7';
    this.ctx.fillRect(boss.x + (boss.width - barWidth) / 2, boss.y - 18, barWidth * hpRatio, 8);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boss.x + (boss.width - barWidth) / 2, boss.y - 18, barWidth, 8);
  }

  // Render floating text & particles
  renderEffects() {
    // Floating texts
    this.ctx.textAlign = 'center';
    this.floatingTexts.forEach(ft => {
      this.ctx.fillStyle = ft.color;
      this.ctx.font = 'bold 12px monospace';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });

    // Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  }

  updateEffects() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.8;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // Particle generators
  createJumpPuff(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        size: 3,
        color: '#93c5fd',
        life: 15
      });
    }
  }

  createPickupSparkles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4,
        color: '#38bdf8',
        life: 25
      });
    }
  }

  createBlockShatter(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 - 2,
        size: 4,
        color: '#c084fc',
        life: 20
      });
    }
  }

  createPlayerDeathExplosion(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4,
        color: i % 2 === 0 ? '#f43f5e' : '#38bdf8',
        life: 30
      });
    }
  }

  createBossHitSparks(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4,
        color: '#fbbf24',
        life: 20
      });
    }
  }

  createBossDeathExplosion(x, y) {
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 2,
        color: ['#f43f5e', '#a855f7', '#fbbf24', '#38bdf8'][Math.floor(Math.random() * 4)],
        life: 50
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({ text, x, y, color, life: 40 });
  }

  showAnnouncement(title, subtitle) {
    const el = document.getElementById('stageAnnouncement');
    if (!el) return;
    el.innerHTML = `<div class="text-xl font-bold font-fantasy text-amber-300">${title}</div><div class="text-xs text-slate-300 mt-1">${subtitle}</div>`;
    el.classList.remove('hidden');
    el.classList.add('animate-fade-in');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 2400);
  }

  // ========================================================
  // HUD & UI UPDATES
  // ========================================================
  updateHUD() {
    const course = this.course;
    if (!course) return;

    // Course Title & Code
    const courseEl = document.getElementById('hudCourse');
    if (courseEl) courseEl.textContent = `${course.courseCode}: ${course.courseName}`;

    // Stage / Topic Title
    const stageEl = document.getElementById('hudStage');
    if (stageEl && this.activeLevel) {
      stageEl.textContent = this.activeLevel.title;
    }

    // Boss Name & HP Bar
    const bossNameEl = document.getElementById('hudBossName');
    if (bossNameEl) bossNameEl.textContent = course.examTitle;

    const hpBar = document.getElementById('hudBossHpBar');
    const hpText = document.getElementById('hudBossHpText');

    let currentHp = course.bossHp;
    let maxHp = course.bossHp;

    if (this.activeLevel && this.activeLevel.isBossArena && this.activeLevel.boss) {
      currentHp = this.activeLevel.boss.currentHp;
      maxHp = this.activeLevel.boss.maxHp;
    }

    if (hpBar) {
      const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
      hpBar.style.width = `${pct}%`;
      if (pct < 30) {
        hpBar.className = 'h-full bg-rose-500 transition-all duration-200';
      } else if (pct < 60) {
        hpBar.className = 'h-full bg-amber-500 transition-all duration-200';
      } else {
        hpBar.className = 'h-full bg-purple-500 transition-all duration-200';
      }
    }

    if (hpText) {
      hpText.textContent = `${currentHp} / ${maxHp} HP (${course.weightPercent}% Course Weight)`;
    }

    // Score & Deaths
    const deathsEl = document.getElementById('hudDeaths');
    if (deathsEl) deathsEl.textContent = `${this.trollDeaths}`;

    const scoreEl = document.getElementById('hudScore');
    if (scoreEl) scoreEl.textContent = `${this.score} XP`;
  }

  toggleSound() {
    const muted = window.soundSystem.toggleMute();
    const btn = document.getElementById('btnMute');
    if (btn) {
      btn.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
    }
  }

  // Switch to a new syllabus course or custom topic
  changeCourse(courseId) {
    const newCourse = window.syllabusEngine.selectCourse(courseId);
    if (newCourse) {
      this.course = newCourse;
      this.currentLevelIndex = 0;
      this.initGame();
    }
  }

  // Victory Modal Trigger
  triggerGameVictory() {
    this.isVictory = true;

    // Notify parent Syllaborn application if inside an iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'SYLLABORN_BOSS_VANQUISHED',
        courseCode: this.course?.courseCode || 'LEVEL_DEVIL',
        examTitle: this.course?.examTitle || 'Final Examination Boss',
        xpEarned: Math.max(350, this.course?.bossHp || 400),
        milestoneId: this.course?.milestoneId
      }, '*');
    }

    const modal = document.getElementById('victoryModal');
    if (modal) {
      if (this.course) {
        const elCourse = document.getElementById('vicCourse');
        const elExam = document.getElementById('vicExam');
        const elWeight = document.getElementById('vicWeight');
        const elXp = document.getElementById('vicXp');
        if (elCourse) elCourse.textContent = `${this.course.courseCode} - ${this.course.courseName}`;
        if (elExam) elExam.textContent = this.course.examTitle;
        if (elWeight) elWeight.textContent = `${this.course.weightPercent}% Course Grade Weight`;
        if (elXp) elXp.textContent = `+${Math.max(350, this.course.bossHp)} XP Added to Syllaborn!`;
      }
      const elDeaths = document.getElementById('vicDeaths');
      if (elDeaths) elDeaths.textContent = `${this.trollDeaths} Pop Quiz Deaths Survived`;
      modal.classList.remove('hidden');
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.game = new DoOrDieGame();
});
