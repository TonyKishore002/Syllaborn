import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ProceduralMeshes } from '../../src/components/game3d/ProceduralMeshes';
import { ThreeEngine } from '../../src/components/game3d/ThreeEngine';

describe('3D Games Procedural Engine & Meshes - Unit Tests', () => {
  it('creates runner character with articulated hierarchy and animation controller', () => {
    const runner = ProceduralMeshes.createRunnerCharacter(0x8b5cf6);

    expect(runner.root).toBeInstanceOf(THREE.Group);
    expect(runner.root.children.length).toBeGreaterThan(0);
    expect(typeof runner.updateAnimation).toBe('function');

    // Run animation step in moving state
    expect(() => runner.updateAnimation(0.5, true, false)).not.toThrow();

    // Run animation step in jumping state
    expect(() => runner.updateAnimation(1.0, false, true)).not.toThrow();

    // Run animation step in idle state
    expect(() => runner.updateAnimation(1.5, false, false)).not.toThrow();
  });

  it('creates 3D boss character with multi-phase rage animations', () => {
    const boss = ProceduralMeshes.createBossCharacter(0xdc2626);

    expect(boss.root).toBeInstanceOf(THREE.Group);
    expect(boss.root.children.length).toBeGreaterThan(0);

    // Normal state
    expect(() => boss.updateAnimation(0.2, false, false)).not.toThrow();

    // Attacking state
    expect(() => boss.updateAnimation(0.4, true, false)).not.toThrow();

    // Enraged state (Phase 2 & 3)
    expect(() => boss.updateAnimation(0.6, true, true)).not.toThrow();
  });

  it('creates floating collectible crystal with dual-shell rotation', () => {
    const crystal = ProceduralMeshes.createCollectibleCrystal(0x38bdf8);

    expect(crystal.mesh).toBeInstanceOf(THREE.Group);
    expect(crystal.mesh.children.length).toBe(2); // inner core & outer cage

    expect(() => crystal.update(0.1)).not.toThrow();
  });

  it('creates glowing syllabus knowledge gate with energy threshold', () => {
    const gate = ProceduralMeshes.createKnowledgeGate(0xa855f7);

    expect(gate).toBeInstanceOf(THREE.Group);
    expect(gate.children.length).toBeGreaterThanOrEqual(6); // pillars, arch, insets, curtain
  });

  it('creates attack telegraph ground decal with bounded progress', () => {
    const decal = ProceduralMeshes.createTelegraphDecal(3.8, 0xef4444);

    expect(decal.mesh).toBeInstanceOf(THREE.Group);
    expect(typeof decal.setProgress).toBe('function');

    // Test clamped progress
    expect(() => decal.setProgress(-0.5)).not.toThrow();
    expect(() => decal.setProgress(0.5)).not.toThrow();
    expect(() => decal.setProgress(1.5)).not.toThrow();
  });

  it('creates runic dungeon altar with interactive crystal activation', () => {
    const altar = ProceduralMeshes.createDungeonAltar(0x10b981);

    expect(altar.root).toBeInstanceOf(THREE.Group);
    expect(() => altar.setActivated(true)).not.toThrow();
    expect(() => altar.setActivated(false)).not.toThrow();
    expect(() => altar.update(0.5)).not.toThrow();
  });

  it('creates particle burst system with physics updates', () => {
    const particles = ProceduralMeshes.createParticleSystem(50, 0x38bdf8);

    expect(particles.points).toBeInstanceOf(THREE.Points);
    expect(particles.points.geometry.attributes.position).toBeDefined();

    // Trigger burst
    expect(() => particles.burst(new THREE.Vector3(0, 1, 0), 5)).not.toThrow();

    // Update step
    expect(() => particles.update(0.016)).not.toThrow();
  });

  it('ThreeEngine clean disposal frees scene geometries and materials without throwing', () => {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    group.add(mesh);

    expect(() => ThreeEngine.disposeHierarchy(group)).not.toThrow();
    expect(group.children.length).toBe(0);
  });
});
