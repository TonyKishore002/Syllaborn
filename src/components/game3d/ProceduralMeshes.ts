import * as THREE from 'three';

/**
 * ProceduralMeshes: Generates original, stylized, high-performance 3D assets
 * without relying on external 3D model downloads. Ensures instant loading,
 * zero network 404s, and 60 FPS performance on all hardware.
 */

export class ProceduralMeshes {
  // ---------------------------------------------------------------------------
  // 1. Stylized 3D Cyber / Academic Runner Character
  // ---------------------------------------------------------------------------
  public static createRunnerCharacter(themeColor: number = 0x8b5cf6): {
    root: THREE.Group;
    updateAnimation: (time: number, isMoving: boolean, isJumping: boolean) => void;
  } {
    const root = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const armorMat = new THREE.MeshStandardMaterial({
      color: themeColor,
      roughness: 0.2,
      metalness: 0.6,
      emissive: themeColor,
      emissiveIntensity: 0.25,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Pelvis / Core Center
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.0;
    root.add(pelvis);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.24, 0.65, 8);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 0.35;
    torso.castShadow = true;
    pelvis.add(torso);

    // Chestplate
    const chestGeo = new THREE.BoxGeometry(0.48, 0.35, 0.32);
    const chest = new THREE.Mesh(chestGeo, armorMat);
    chest.position.set(0, 0.42, 0.08);
    pelvis.add(chest);

    // Energy Core (Glowing Rune on chest)
    const coreGeo = new THREE.OctahedronGeometry(0.1, 0);
    const core = new THREE.Mesh(coreGeo, visorMat);
    core.position.set(0, 0.42, 0.25);
    pelvis.add(core);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.85, 0);
    pelvis.add(headGroup);

    const headGeo = new THREE.BoxGeometry(0.34, 0.36, 0.34);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.castShadow = true;
    headGroup.add(head);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.32, 0.12, 0.1);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.04, 0.16);
    headGroup.add(visor);

    // Scholar Crest / Capelet
    const crestGeo = new THREE.ConeGeometry(0.16, 0.3, 4);
    const crest = new THREE.Mesh(crestGeo, goldTrimMat);
    crest.position.set(0, 0.26, -0.05);
    crest.rotation.x = -0.3;
    headGroup.add(crest);

    // Shoulders & Arms
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.42, 0.55, 0);
    pelvis.add(leftArmGroup);

    const shoulderGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const leftShoulder = new THREE.Mesh(shoulderGeo, armorMat);
    leftArmGroup.add(leftShoulder);

    const limbGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 8);
    const leftArm = new THREE.Mesh(limbGeo, bodyMat);
    leftArm.position.y = -0.22;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.42, 0.55, 0);
    pelvis.add(rightArmGroup);

    const rightShoulder = new THREE.Mesh(shoulderGeo, armorMat);
    rightArmGroup.add(rightShoulder);

    const rightArm = new THREE.Mesh(limbGeo, bodyMat);
    rightArm.position.y = -0.22;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    // Legs
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.2, 0, 0);
    pelvis.add(leftLegGroup);

    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.55, 8);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.y = -0.32;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);

    const bootGeo = new THREE.BoxGeometry(0.16, 0.18, 0.26);
    const leftBoot = new THREE.Mesh(bootGeo, armorMat);
    leftBoot.position.set(0, -0.56, 0.04);
    leftBoot.castShadow = true;
    leftLegGroup.add(leftBoot);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.2, 0, 0);
    pelvis.add(rightLegGroup);

    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.y = -0.32;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);

    const rightBoot = new THREE.Mesh(bootGeo, armorMat);
    rightBoot.position.set(0, -0.56, 0.04);
    rightBoot.castShadow = true;
    rightLegGroup.add(rightBoot);

    // Dynamic ground shadow blob
    const shadowGeo = new THREE.CircleGeometry(0.45, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    shadowBlob.rotation.x = -Math.PI / 2;
    shadowBlob.position.y = 0.02;
    root.add(shadowBlob);

    // Animation update function
    const updateAnimation = (time: number, isMoving: boolean, isJumping: boolean) => {
      // Idle bob or run cycle
      if (isJumping) {
        // Jump pose: legs tucked slightly, arms raised
        leftLegGroup.rotation.x = -0.5;
        rightLegGroup.rotation.x = 0.3;
        leftArmGroup.rotation.x = 0.7;
        rightArmGroup.rotation.x = 0.7;
        pelvis.position.y = 1.0;
        shadowBlob.scale.set(0.65, 0.65, 0.65);
      } else if (isMoving) {
        // Fast running cycle
        const freq = time * 14;
        const swing = Math.sin(freq) * 0.75;
        leftLegGroup.rotation.x = swing;
        rightLegGroup.rotation.x = -swing;
        leftArmGroup.rotation.x = -swing * 0.8;
        rightArmGroup.rotation.x = swing * 0.8;
        pelvis.position.y = 1.0 + Math.abs(Math.sin(freq)) * 0.12;
        shadowBlob.scale.set(1, 1, 1);
      } else {
        // Idle breathing
        const idle = Math.sin(time * 3);
        pelvis.position.y = 1.0 + idle * 0.04;
        leftArmGroup.rotation.x = idle * 0.08;
        rightArmGroup.rotation.x = -idle * 0.08;
        leftLegGroup.rotation.x = 0;
        rightLegGroup.rotation.x = 0;
        shadowBlob.scale.set(1 + idle * 0.05, 1 + idle * 0.05, 1);
      }
      core.rotation.y = time * 2;
      core.rotation.x = time * 1.5;
    };

    return { root, updateAnimation };
  }

  // ---------------------------------------------------------------------------
  // 2. Stylized 3D Boss Character (Colossus / Archon inspired by Sanctuary's End)
  // ---------------------------------------------------------------------------
  public static createBossCharacter(colorHex: number = 0xdc2626): {
    root: THREE.Group;
    updateAnimation: (time: number, isAttacking: boolean, isEnraged: boolean) => void;
  } {
    const root = new THREE.Group();

    const darkMetal = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.4,
      metalness: 0.9,
    });
    const glowArmor = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.7,
    });
    const runeGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.3,
    });
    const eyeGlow = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: colorHex,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });

    const bossCenter = new THREE.Group();
    bossCenter.position.y = 2.2;
    root.add(bossCenter);

    // Torso - heavy faceted demon/mech chassis
    const torsoGeo = new THREE.DodecahedronGeometry(1.2, 0);
    torsoGeo.scale(1.1, 1.4, 0.9);
    const torso = new THREE.Mesh(torsoGeo, darkMetal);
    torso.castShadow = true;
    bossCenter.add(torso);

    // Core Crystal (Weak point)
    const coreGeo = new THREE.OctahedronGeometry(0.45, 0);
    const coreMesh = new THREE.Mesh(coreGeo, glowArmor);
    coreMesh.position.set(0, 0.2, 0.75);
    bossCenter.add(coreMesh);

    // Head / Horned Helm
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.7, 0.2);
    bossCenter.add(headGroup);

    const helmGeo = new THREE.BoxGeometry(0.85, 0.9, 0.85);
    const helm = new THREE.Mesh(helmGeo, darkMetal);
    helm.castShadow = true;
    headGroup.add(helm);

    // Visor eyes
    const eyeGeo = new THREE.BoxGeometry(0.65, 0.15, 0.2);
    const eyes = new THREE.Mesh(eyeGeo, eyeGlow);
    eyes.position.set(0, 0.08, 0.42);
    headGroup.add(eyes);

    // Horns
    const hornGeo = new THREE.ConeGeometry(0.2, 1.1, 5);
    const leftHorn = new THREE.Mesh(hornGeo, runeGold);
    leftHorn.position.set(-0.55, 0.7, 0);
    leftHorn.rotation.set(-0.3, 0, 0.55);
    headGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, runeGold);
    rightHorn.position.set(0.55, 0.7, 0);
    rightHorn.rotation.set(-0.3, 0, -0.55);
    headGroup.add(rightHorn);

    // Floating Runic Pauldrons (Shoulders)
    const pauldronGeo = new THREE.ConeGeometry(0.7, 1.1, 4);
    const leftPauldron = new THREE.Mesh(pauldronGeo, glowArmor);
    leftPauldron.position.set(-1.8, 0.7, 0);
    leftPauldron.rotation.set(0, 0, -2.4);
    bossCenter.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, glowArmor);
    rightPauldron.position.set(1.8, 0.7, 0);
    rightPauldron.rotation.set(0, 0, 2.4);
    bossCenter.add(rightPauldron);

    // Right Arm: Colossal Blade / Scythe
    const weaponArmGroup = new THREE.Group();
    weaponArmGroup.position.set(1.5, 0.2, 0);
    bossCenter.add(weaponArmGroup);

    const swordHiltGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8);
    const swordHilt = new THREE.Mesh(swordHiltGeo, darkMetal);
    swordHilt.position.set(0, -0.9, 0.5);
    swordHilt.rotation.x = Math.PI / 4;
    weaponArmGroup.add(swordHilt);

    const bladeGeo = new THREE.BoxGeometry(0.25, 2.8, 0.6);
    const blade = new THREE.Mesh(bladeGeo, glowArmor);
    blade.position.set(0, -2.2, 1.4);
    blade.rotation.x = Math.PI / 4;
    weaponArmGroup.add(blade);

    // Ground Shadow Decal
    const shadowGeo = new THREE.CircleGeometry(2.0, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    root.add(shadow);

    const updateAnimation = (time: number, isAttacking: boolean, isEnraged: boolean) => {
      const rageSpeed = isEnraged ? 2.0 : 1.0;
      const t = time * rageSpeed;

      // Floating hover movement
      bossCenter.position.y = 2.2 + Math.sin(t * 2.5) * 0.25;
      bossCenter.rotation.y = Math.sin(t * 1.2) * 0.15;

      // Pulse floating shoulders
      leftPauldron.position.y = 0.7 + Math.sin(t * 3.5) * 0.15;
      rightPauldron.position.y = 0.7 + Math.cos(t * 3.5) * 0.15;

      // Rotate crystal core
      coreMesh.rotation.y = t * 2;
      coreMesh.rotation.x = t;

      if (isAttacking) {
        // Strike windup & slash
        weaponArmGroup.rotation.x = Math.sin(time * 12) * 1.2;
        glowArmor.emissiveIntensity = 1.0 + Math.sin(time * 16) * 0.5;
      } else {
        weaponArmGroup.rotation.x = Math.sin(t * 2) * 0.2;
        glowArmor.emissiveIntensity = isEnraged ? 0.8 : 0.45;
      }
    };

    return { root, updateAnimation };
  }

  // ---------------------------------------------------------------------------
  // 3. Floating 3D Collectible Gem / Crystal
  // ---------------------------------------------------------------------------
  public static createCollectibleCrystal(colorHex: number = 0x38bdf8): {
    mesh: THREE.Group;
    update: (time: number) => void;
  } {
    const group = new THREE.Group();

    // Solid inner core
    const coreGeo = new THREE.OctahedronGeometry(0.35, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.3,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer wireframe cage
    const cageGeo = new THREE.IcosahedronGeometry(0.55, 0);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    group.add(cage);

    const update = (time: number) => {
      core.rotation.y = time * 2;
      core.rotation.x = time * 1.5;
      cage.rotation.y = -time * 1.2;
      cage.rotation.z = time * 0.8;
      group.position.y += Math.sin(time * 4) * 0.003;
    };

    return { mesh: group, update };
  }

  // ---------------------------------------------------------------------------
  // 4. Glowing 3D Knowledge Gate / Checkpoint Arch
  // ---------------------------------------------------------------------------
  public static createKnowledgeGate(colorHex: number = 0xa855f7): THREE.Group {
    const gate = new THREE.Group();

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });

    // Left & Right Pillars
    const pillarGeo = new THREE.BoxGeometry(0.6, 4.5, 0.6);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-2.4, 2.25, 0);
    gate.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(2.4, 2.25, 0);
    gate.add(rightPillar);

    // Glowing insets on pillars
    const insetGeo = new THREE.BoxGeometry(0.12, 4.0, 0.64);
    const leftInset = new THREE.Mesh(insetGeo, glowMat);
    leftInset.position.set(-2.4, 2.25, 0);
    gate.add(leftInset);

    const rightInset = new THREE.Mesh(insetGeo, glowMat);
    rightInset.position.set(2.4, 2.25, 0);
    gate.add(rightInset);

    // Top Arch Beam
    const archGeo = new THREE.BoxGeometry(5.4, 0.6, 0.6);
    const arch = new THREE.Mesh(archGeo, pillarMat);
    arch.position.set(0, 4.5, 0);
    gate.add(arch);

    // Arch Glow Strip
    const archGlowGeo = new THREE.BoxGeometry(5.2, 0.14, 0.64);
    const archGlow = new THREE.Mesh(archGlowGeo, glowMat);
    archGlow.position.set(0, 4.5, 0);
    gate.add(archGlow);

    // Central Floating Question Crest
    const crestGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crest = new THREE.Mesh(crestGeo, glowMat);
    crest.position.set(0, 4.5, 0);
    gate.add(crest);

    // Energy Curtain (Translucent energy barrier)
    const curtainGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const curtainMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const curtain = new THREE.Mesh(curtainGeo, curtainMat);
    curtain.position.set(0, 2.1, 0);
    gate.add(curtain);

    return gate;
  }

  // ---------------------------------------------------------------------------
  // 5. Boss Attack Telegraph Ring (Expands on ground before attack strikes)
  // ---------------------------------------------------------------------------
  public static createTelegraphDecal(radius: number = 3.5, colorHex: number = 0xef4444): {
    mesh: THREE.Group;
    setProgress: (progress: number) => void;
  } {
    const group = new THREE.Group();

    // Outer warning border
    const borderGeo = new THREE.RingGeometry(radius - 0.15, radius, 32);
    const borderMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.06;
    group.add(border);

    // Inner filling danger disc
    const fillGeo = new THREE.CircleGeometry(radius - 0.15, 32);
    const fillMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const fill = new THREE.Mesh(fillGeo, fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.05;
    fill.scale.set(0.001, 0.001, 0.001);
    group.add(fill);

    const setProgress = (progress: number) => {
      const p = Math.max(0, Math.min(1, progress));
      fill.scale.set(p, p, p);
      fillMat.opacity = 0.25 + p * 0.4;
    };

    return { mesh: group, setProgress };
  }

  // ---------------------------------------------------------------------------
  // 6. Runic Dungeon Altar (For Puzzle Quest)
  // ---------------------------------------------------------------------------
  public static createDungeonAltar(themeColor: number = 0x10b981): {
    root: THREE.Group;
    setActivated: (activated: boolean) => void;
    update: (time: number) => void;
  } {
    const root = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const runeMat = new THREE.MeshStandardMaterial({
      color: themeColor,
      emissive: themeColor,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    });

    // Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Column
    const colGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.2, 8);
    const col = new THREE.Mesh(colGeo, stoneMat);
    col.position.y = 1.0;
    col.castShadow = true;
    root.add(col);

    // Top Basin
    const basinGeo = new THREE.CylinderGeometry(0.85, 0.6, 0.3, 8);
    const basin = new THREE.Mesh(basinGeo, stoneMat);
    basin.position.y = 1.7;
    basin.castShadow = true;
    root.add(basin);

    // Floating Arcane Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.35, 0);
    crystalGeo.scale(1, 1.5, 1);
    const crystal = new THREE.Mesh(crystalGeo, runeMat);
    crystal.position.y = 2.4;
    root.add(crystal);

    let isLit = false;

    const setActivated = (activated: boolean) => {
      isLit = activated;
      runeMat.emissiveIntensity = activated ? 1.5 : 0.3;
    };

    const update = (time: number) => {
      crystal.rotation.y = time * (isLit ? 3.0 : 1.2);
      crystal.position.y = 2.4 + Math.sin(time * 3) * 0.1;
    };

    return { root, setActivated, update };
  }

  // ---------------------------------------------------------------------------
  // 7. Particle System Burst (For jumps, hits, spell impact, victory confetti)
  // ---------------------------------------------------------------------------
  public static createParticleSystem(count: number = 60, colorHex: number = 0x38bdf8): {
    points: THREE.Points;
    burst: (origin: THREE.Vector3, speed?: number) => void;
    update: (delta: number) => void;
  } {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      lifetimes[i] = -1; // Inactive
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);

    const burst = (origin: THREE.Vector3, speed: number = 4) => {
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(i, origin.x, origin.y, origin.z);
        // Random spherical explosion direction
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const spd = (0.5 + Math.random() * 0.8) * speed;
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
        velocities[i * 3 + 1] = Math.abs(Math.sin(phi) * Math.sin(theta) * spd) + 1.2; // slight upward bias
        velocities[i * 3 + 2] = Math.cos(phi) * spd;
        lifetimes[i] = 0.8 + Math.random() * 0.5; // lifespan
      }
      posAttr.needsUpdate = true;
    };

    const update = (delta: number) => {
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      let activeCount = 0;

      for (let i = 0; i < count; i++) {
        if (lifetimes[i] > 0) {
          lifetimes[i] -= delta;
          positions[i * 3] += velocities[i * 3] * delta;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;
          velocities[i * 3 + 1] -= 9.8 * delta; // Gravity
          activeCount++;
        } else {
          // Offscreen
          positions[i * 3 + 1] = -999;
        }
      }

      posAttr.needsUpdate = true;
      material.opacity = activeCount > 0 ? 0.9 : 0.0;
    };

    return { points, burst, update };
  }
}
