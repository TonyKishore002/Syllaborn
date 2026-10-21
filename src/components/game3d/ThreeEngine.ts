import * as THREE from 'three';

/**
 * ThreeEngine: Shared, robust, leak-free Three.js runtime wrapper for React components.
 * Handles WebGLRenderer, ResizeObserver, DPR clamping, ToneMapping,
 * fixed-delta game loops, and complete recursive memory disposal.
 */

export interface ThreeEngineOptions {
  antialias?: boolean;
  alpha?: boolean;
  shadows?: boolean;
  fogColor?: number;
  fogNear?: number;
  fogFar?: number;
  clearColor?: number;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
}

export class ThreeEngine {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public clock: THREE.Clock;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isDisposed: boolean = false;
  private updateCallbacks: Array<(delta: number, elapsed: number) => void> = [];

  constructor(container: HTMLElement, options: ThreeEngineOptions = {}) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    const clearColor = options.clearColor !== undefined ? options.clearColor : 0x070914;
    this.scene.background = new THREE.Color(clearColor);

    if (options.fogColor !== undefined) {
      this.scene.fog = new THREE.Fog(
        options.fogColor,
        options.fogNear ?? 15,
        options.fogFar ?? 75
      );
    }

    // 2. Camera (initialized with container dimensions or fallback)
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 5, 10);

    // 3. Renderer with high performance & DPR clamping (max 2 for 60fps)
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias !== false,
      alpha: options.alpha ?? false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = options.toneMapping ?? THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = options.toneMappingExposure ?? 1.1;

    if (options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Attach canvas to container
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.outline = 'none';
    this.container.appendChild(this.renderer.domElement);

    // 4. Clock
    this.clock = new THREE.Clock();

    // 5. Setup Resize Observer
    this.initResizeObserver();

    // 6. Start Loop
    this.startLoop();
  }

  private initResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        if (this.isDisposed || !entries[0]) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          this.handleResize(width, height);
        }
      });
      this.resizeObserver.observe(this.container);
    } else {
      // Fallback
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  private onWindowResize = () => {
    if (this.isDisposed || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.handleResize(w, h);
    }
  };

  public handleResize(width: number, height: number) {
    if (this.isDisposed) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public onUpdate(callback: (delta: number, elapsed: number) => void) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private startLoop() {
    const loop = () => {
      if (this.isDisposed) return;

      // Delta time with clamp to avoid frame spikes (e.g. tab switching)
      let delta = this.clock.getDelta();
      if (delta > 0.1) delta = 0.1;
      const elapsed = this.clock.getElapsedTime();

      for (let i = 0; i < this.updateCallbacks.length; i++) {
        this.updateCallbacks[i](delta, elapsed);
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  /**
   * Complete recursive cleanup to prevent WebGL memory leaks
   */
  public dispose() {
    this.isDisposed = true;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    } else {
      window.removeEventListener('resize', this.onWindowResize);
    }

    this.updateCallbacks = [];

    // Recursively dispose scene objects
    ThreeEngine.disposeHierarchy(this.scene);

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }

    this.renderer.dispose();
  }

  public static disposeHierarchy(obj: THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => ThreeEngine.disposeMaterial(mat));
          } else {
            ThreeEngine.disposeMaterial(child.material);
          }
        }
      } else if (child instanceof THREE.Light) {
        const shadow = (child as any).shadow;
        if (shadow && shadow.map) {
          shadow.map.dispose();
        }
      }
    });

    while (obj.children.length > 0) {
      obj.remove(obj.children[0]);
    }
  }

  public static disposeMaterial(mat: THREE.Material) {
    mat.dispose();
    for (const key of Object.keys(mat)) {
      const val = (mat as any)[key];
      if (val && typeof val.dispose === 'function') {
        val.dispose();
      }
    }
  }
}
