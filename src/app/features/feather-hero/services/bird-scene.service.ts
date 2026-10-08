import { Injectable, NgZone, signal } from '@angular/core';
import type {
  DirectionalLight,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { Quaternion } from 'three';
import {
  BIRDS,
  DEFAULT_BIRD_ID,
  birdById,
  birdIndex,
  initialGlFailedState,
} from '../../../data/birds.data';
import type { BirdId } from '../../../models/bird.model';

export interface SceneFrameTargets {
  heroWidth: number;
  heroHeight: number;
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  focusMode: boolean;
}

type ThreeModule = typeof import('three');

interface BirdRig {
  pivot: Group;
  spin: Group;
  holder: Group;
  loaded: boolean;
  failed: boolean;
}

const HOME_YAW = 0.75;
const HOME_PITCH = 0.12;
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 3.4;
const TAB_MS = 780;
/** Cap DPR for sharpness on Retina without unbounded GPU cost. */
const MAX_PIXEL_RATIO = 3;

@Injectable({ providedIn: 'root' })
export class BirdSceneService {
  readonly loading = signal(false);
  readonly glFailed = signal<Record<BirdId, boolean>>(initialGlFailedState());
  readonly hintVisible = signal(true);

  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: PerspectiveCamera;
  private THREE?: ThreeModule;
  private keyLight?: DirectionalLight;
  private rimLight?: DirectionalLight;
  private envTarget: { intensity: number } = { intensity: 0.95 };

  private rigs = new Map<BirdId, BirdRig>();
  private activeId: BirdId = DEFAULT_BIRD_ID;
  private homeQuat!: Quaternion;
  private spinQuat!: Quaternion;
  private velocity = { x: 0, y: 0 };
  private zoom = 1;
  private zoomTarget = 1;
  private turnQueue = 0;
  private tabAnim = 0;
  private tabDir = 0;
  private tabFrom?: BirdId;
  private tabTo?: BirdId;
  private lastInteract = performance.now();
  private idleWeight = 0;
  private reducedMotion = false;
  private dusk = false;
  private lightT = 0;

  private cx = 0;
  private cy = 0;
  private px = 200;
  private targets: SceneFrameTargets = {
    heroWidth: 1,
    heroHeight: 1,
    stageLeft: 0,
    stageTop: 0,
    stageWidth: 1,
    stageHeight: 1,
    focusMode: false,
  };

  private raf = 0;
  private clock = 0;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private pinchStart = 0;
  private pinchZoom = 1;

  constructor(private readonly zone: NgZone) {}

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.renderer) return;
    this.canvas = canvas;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const THREE = await import('three');
    const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

    this.THREE = THREE;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.98;
    this.renderer = renderer;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw > 0 && ch > 0) {
      this.resize(cw, ch);
    }

    const scene = new THREE.Scene();
    this.scene = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTex;
    room.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 100);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    const key = new THREE.DirectionalLight(0xfff4e2, 1.6);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    this.keyLight = key;

    const rim = new THREE.DirectionalLight(0xbfd8ff, 0.5);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    this.rimLight = rim;

    this.homeQuat = new THREE.Quaternion();
    this.spinQuat = new THREE.Quaternion();
    this.setHomeQuaternion(THREE);

    for (const bird of BIRDS) {
      this.createRig(THREE, bird.id);
    }

    const needsGltf = BIRDS.some((b) => b.specimenSource === 'model');
    let gltfLoader: import('three/addons/loaders/GLTFLoader.js').GLTFLoader | undefined;
    if (needsGltf) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
      const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
      const draco = new DRACOLoader();
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      draco.setCrossOrigin('anonymous');
      gltfLoader = new GLTFLoader();
      gltfLoader.setCrossOrigin('anonymous');
      gltfLoader.setDRACOLoader(draco);
      gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }

    this.loading.set(true);
    await this.loadBird(gltfLoader, DEFAULT_BIRD_ID);
    this.loading.set(false);
    this.setActiveBird(DEFAULT_BIRD_ID, false);
    for (const bird of BIRDS) {
      if (bird.id !== DEFAULT_BIRD_ID) void this.loadBird(gltfLoader, bird.id);
    }

    this.zone.runOutsideAngular(() => {
      this.clock = performance.now();
      const tick = (t: number) => {
        this.frame(t);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.renderer?.dispose();
    this.renderer = undefined;
  }

  resize(width: number, height: number): void {
    if (!this.renderer) return;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
    );
    this.renderer.setSize(width, height, false);
    if (this.camera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  setFrameTargets(targets: SceneFrameTargets): void {
    this.targets = targets;
  }

  setActiveBird(id: BirdId, animate = true): void {
    if (id === this.activeId && animate) return;
    const old = this.activeId;
    if (!animate || this.reducedMotion) {
      this.showBird(id);
      this.activeId = id;
      this.resetView(false);
      return;
    }
    this.tabFrom = old;
    this.tabTo = id;
    this.tabAnim = 0;
    this.tabDir = Math.sign(this.indexOf(id) - this.indexOf(old));
    this.zoom = 1;
    this.zoomTarget = 1;
    this.resetOrientation(true);
    const incoming = this.rigs.get(id);
    incoming?.spin.quaternion.copy(this.homeQuat);
    if (!this.rigs.get(id)?.loaded) this.loading.set(true);
  }

  getActiveId(): BirdId {
    return this.activeId;
  }

  onPointerDown(e: PointerEvent, stage: HTMLElement): void {
    this.markInteract();
    this.dragging = true;
    stage.setPointerCapture(e.pointerId);
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.velocity = { x: 0, y: 0 };
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging || !this.THREE) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    const k = Math.PI / Math.max(260, this.px * 1.6);
    this.applySpin(this.THREE, dx * k, dy * k);
    this.velocity = { x: dx * k * 60, y: dy * k * 60 };
  }

  onPointerUp(e: PointerEvent, stage: HTMLElement): void {
    if (this.dragging) {
      stage.releasePointerCapture(e.pointerId);
      this.dragging = false;
    }
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.markInteract();
    const factor = e.ctrlKey ? 0.01 : 0.0016;
    this.zoomTarget = clamp(this.zoomTarget * Math.exp(-e.deltaY * factor), ZOOM_MIN, ZOOM_MAX);
  }

  onPinchStart(distance: number): void {
    this.pinchStart = distance;
    this.pinchZoom = this.zoomTarget;
    this.markInteract();
  }

  onPinchMove(distance: number): void {
    if (!this.pinchStart) return;
    this.zoomTarget = clamp(this.pinchZoom * (distance / this.pinchStart), ZOOM_MIN, ZOOM_MAX);
  }

  zoomIn(): void {
    this.markInteract();
    this.zoomTarget = clamp(this.zoomTarget * 1.35, ZOOM_MIN, ZOOM_MAX);
  }

  zoomOut(): void {
    this.markInteract();
    this.zoomTarget = clamp(this.zoomTarget / 1.35, ZOOM_MIN, ZOOM_MAX);
  }

  toggleCloseUp(): void {
    this.markInteract();
    this.zoomTarget = this.zoomTarget > 2.2 ? 1 : 2.6;
  }

  closeUpPressed(): boolean {
    return this.zoom > 2.2;
  }

  zoomInActive(): boolean {
    return this.zoom >= 1;
  }

  zoomOutActive(): boolean {
    return this.zoom < 1;
  }

  queueTurn(deltaRad: number): void {
    this.markInteract();
    this.turnQueue += deltaRad;
  }

  resetHome(): void {
    this.markInteract();
    this.zoomTarget = 1;
    this.homeSlerpActive = true;
  }

  rotateKeys(dx: number, dy: number): void {
    if (!this.THREE) return;
    this.markInteract();
    this.applySpin(this.THREE, dx, dy);
  }

  zoomKeys(factor: number): void {
    this.markInteract();
    this.zoomTarget = clamp(this.zoomTarget * factor, ZOOM_MIN, ZOOM_MAX);
  }

  setDusk(on: boolean): void {
    this.dusk = on;
    this.lightT = 0;
  }

  tabSwitching(): boolean {
    return this.tabTo !== undefined && this.tabAnim > 0 && this.tabAnim < 1;
  }

  private homeSlerpActive = false;

  private createRig(THREE: ThreeModule, id: BirdId): void {
    const pivot = new THREE.Group();
    const spin = new THREE.Group();
    const holder = new THREE.Group();
    pivot.add(spin);
    spin.add(holder);
    pivot.visible = false;
    this.scene?.add(pivot);
    this.rigs.set(id, { pivot, spin, holder, loaded: false, failed: false });
  }

  private async loadBird(
    loader: import('three/addons/loaders/GLTFLoader.js').GLTFLoader | undefined,
    id: BirdId,
  ): Promise<void> {
    const bird = birdById(id);
    if (bird.specimenSource === 'model') {
      await this.loadBirdGltf(loader, id, bird.modelSrc);
    } else {
      await this.loadBirdPhoto(id, bird.imageSrc);
    }
  }

  private async loadBirdPhoto(id: BirdId, imageSrc: string): Promise<void> {
    const rig = this.rigs.get(id);
    if (!rig || rig.loaded || !this.THREE) return;
    try {
      const THREE = this.THREE;
      const texLoader = new THREE.TextureLoader();
      texLoader.setCrossOrigin('anonymous');
      const texture = await texLoader.loadAsync(imageSrc);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.renderer!.capabilities.getMaxAnisotropy();

      const img = texture.image as HTMLImageElement;
      const aspect = img.width / img.height;
      const height = 1.45;
      const width = height * aspect;

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.88,
        metalness: 0.04,
        transparent: true,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
      mesh.frustumCulled = false;

      const root = new THREE.Group();
      root.add(mesh);
      this.fitHolderToUnitSphere(root, rig);
      rig.loaded = true;
      if (this.tabTo === id) this.loading.set(false);
    } catch {
      this.markSpecimenFailed(id, rig);
    }
  }

  private async loadBirdGltf(
    loader: import('three/addons/loaders/GLTFLoader.js').GLTFLoader | undefined,
    id: BirdId,
    src: string,
  ): Promise<void> {
    const rig = this.rigs.get(id);
    if (!rig || rig.loaded || !this.THREE || !loader || !src) {
      if (rig && !rig.loaded) this.markSpecimenFailed(id, rig);
      return;
    }
    try {
      const gltf = await loader.loadAsync(src);
      const root = gltf.scene;
      root.traverse((obj) => {
        const mesh = obj as import('three').Mesh;
        if (!mesh.isMesh) return;
        mesh.frustumCulled = false;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const mat of mats) {
          if (!mat || !('isMaterial' in mat)) continue;
          this.polishPbrMaterial(mat as import('three').MeshStandardMaterial);
        }
      });
      this.fitHolderToUnitSphere(root, rig);
      rig.loaded = true;
      if (this.tabTo === id) this.loading.set(false);
    } catch {
      this.markSpecimenFailed(id, rig);
    }
  }

  private polishPbrMaterial(mat: import('three').MeshStandardMaterial): void {
    if (!this.THREE || !this.renderer) return;
    const THREE = this.THREE;
    const aniso = this.renderer.capabilities.getMaxAnisotropy();
    mat.envMapIntensity = 0.88;
    const colorMaps: (import('three').Texture | null | undefined)[] = [
      mat.map,
      mat.emissiveMap,
    ];
    const dataMaps: (import('three').Texture | null | undefined)[] = [
      mat.normalMap,
      mat.roughnessMap,
      mat.metalnessMap,
      mat.aoMap,
    ];
    for (const tex of [...colorMaps, ...dataMaps]) {
      if (!tex) continue;
      tex.anisotropy = aniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (colorMaps.includes(tex)) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
    }
  }

  private fitHolderToUnitSphere(root: import('three').Group, rig: BirdRig): void {
    const box = new this.THREE!.Box3().setFromObject(root);
    const sphere = box.getBoundingSphere(new this.THREE!.Sphere());
    root.position.sub(sphere.center);
    rig.holder.add(root);
    const scale = sphere.radius > 0 ? 1 / sphere.radius : 1;
    rig.holder.scale.setScalar(scale);
  }

  private markSpecimenFailed(id: BirdId, rig: BirdRig | undefined): void {
    if (!rig) return;
    rig.failed = true;
    rig.pivot.visible = false;
    this.glFailed.update((m) => ({ ...m, [id]: true }));
    if (this.tabTo === id || this.activeId === id) this.loading.set(false);
  }

  private showBird(id: BirdId): void {
    for (const [key, rig] of this.rigs) {
      rig.pivot.visible = key === id;
    }
    this.activeId = id;
  }

  private resetView(orientationOnly: boolean): void {
    if (!orientationOnly) {
      this.zoom = 1;
      this.zoomTarget = 1;
    }
    this.spinQuat.copy(this.homeQuat);
    const rig = this.rigs.get(this.activeId);
    rig?.spin.quaternion.copy(this.homeQuat);
  }

  private resetOrientation(homeOnly: boolean): void {
    this.spinQuat.copy(this.homeQuat);
    const rig = this.rigs.get(this.activeId);
    if (rig) rig.spin.quaternion.copy(this.homeQuat);
    if (!homeOnly) {
      this.zoom = 1;
      this.zoomTarget = 1;
    }
  }

  private indexOf(id: BirdId): number {
    return birdIndex(id);
  }

  private setHomeQuaternion(THREE: ThreeModule): void {
    const e = new THREE.Euler(HOME_PITCH, HOME_YAW, 0, 'YXZ');
    this.homeQuat.setFromEuler(e);
    this.spinQuat.copy(this.homeQuat);
  }

  private applySpin(THREE: ThreeModule, dx: number, dy: number): void {
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy);
    this.spinQuat.premultiply(qy).premultiply(qx);
    const rig = this.rigs.get(this.activeId);
    if (rig) rig.spin.quaternion.copy(this.spinQuat);
  }

  private markInteract(): void {
    this.lastInteract = performance.now();
    if (this.hintVisible()) {
      this.zone.run(() => this.hintVisible.set(false));
    }
  }

  private frame(now: number): void {
    const dt = Math.min(0.05, (now - this.clock) / 1000);
    this.clock = now;
    if (!this.renderer || !this.scene || !this.camera || !this.THREE) return;

    this.updateTab(dt);
    this.updateLights(dt);
    this.updateTurn(dt);
    this.updateInertia(dt);
    this.updateHomeSlerp(dt);
    this.updateIdle(dt, now);
    this.updateFraming(dt);

    this.renderer.render(this.scene, this.camera);
  }

  private updateTab(dt: number): void {
    if (!this.tabTo || this.tabFrom === undefined) return;
    if (this.reducedMotion) {
      this.showBird(this.tabTo);
      this.tabTo = undefined;
      this.tabFrom = undefined;
      return;
    }
    this.tabAnim = Math.min(1, this.tabAnim + dt / (TAB_MS / 1000));
    const t = this.tabAnim;
    const out = this.rigs.get(this.tabFrom!);
    const inc = this.rigs.get(this.tabTo!);
    if (!out || !inc) return;

    if (t === 0) {
      this.showBird(this.tabFrom!);
      inc.pivot.visible = true;
    }

    const slide =
      (this.targets.stageWidth * 0.95) / Math.max(this.px, 1);
    const eOut = easeInCubic(Math.min(1, t / 0.6));
    const eIn = easeOutCubic(t);
    const back = outBack(t);

    out.pivot.scale.setScalar(1 - eOut);
    out.pivot.position.x = -this.tabDir * eOut * slide;
    out.pivot.rotation.y = -this.tabDir * eOut * 1.4;

    inc.pivot.scale.setScalar(back * (0.25 + 0.75 * eIn));
    inc.pivot.position.x = this.tabDir * (1 - eIn) * slide;
    inc.pivot.rotation.y = this.tabDir * (1 - eIn) * 1.6;
    inc.pivot.visible = true;

    if (t >= 1) {
      out.pivot.scale.setScalar(1);
      out.pivot.position.x = 0;
      out.pivot.rotation.y = 0;
      out.pivot.visible = false;
      inc.pivot.scale.setScalar(1);
      inc.pivot.position.x = 0;
      inc.pivot.rotation.y = 0;
      this.activeId = this.tabTo;
      this.tabTo = undefined;
      this.tabFrom = undefined;
      this.tabAnim = 0;
      this.resetOrientation(true);
    }
  }

  private updateLights(dt: number): void {
    const target = this.dusk
      ? { env: 0.26, key: 2.5, keyColor: 0xffc98a, rim: 1.75, exp: 0.95 }
      : { env: 0.82, key: 1.9, keyColor: 0xfff0dc, rim: 0.52, exp: 0.98 };
    this.lightT = 1 - Math.exp(-dt * 4);
    const k = this.lightT;
    if (this.scene) {
      this.scene.environmentIntensity =
        this.envTarget.intensity + (target.env - this.envTarget.intensity) * k;
      this.envTarget.intensity = this.scene.environmentIntensity;
    }
    if (this.keyLight) {
      this.keyLight.intensity += (target.key - this.keyLight.intensity) * k;
      this.keyLight.color.lerp(new this.THREE!.Color(target.keyColor), k);
    }
    if (this.rimLight) {
      this.rimLight.intensity += (target.rim - this.rimLight.intensity) * k;
    }
    if (this.renderer) {
      this.renderer.toneMappingExposure +=
        (target.exp - this.renderer.toneMappingExposure) * k;
    }
  }

  private updateTurn(dt: number): void {
    if (!this.THREE || Math.abs(this.turnQueue) < 1e-4) return;
    const step = this.turnQueue * (1 - Math.exp(-dt * 4.2));
    this.turnQueue -= step;
    const q = new this.THREE.Quaternion().setFromAxisAngle(
      new this.THREE.Vector3(0, 1, 0),
      step,
    );
    this.spinQuat.premultiply(q);
    const rig = this.rigs.get(this.activeId);
    if (rig) rig.spin.quaternion.copy(this.spinQuat);
  }

  private updateInertia(dt: number): void {
    if (this.dragging || !this.THREE) return;
    const decay = Math.exp(-dt * 4.5);
    if (Math.abs(this.velocity.x) > 1e-5 || Math.abs(this.velocity.y) > 1e-5) {
      this.applySpin(this.THREE, this.velocity.x * dt, this.velocity.y * dt);
      this.velocity.x *= decay;
      this.velocity.y *= decay;
    }
  }

  private updateHomeSlerp(dt: number): void {
    if (!this.homeSlerpActive || !this.THREE) return;
    const rate = 1 - Math.exp(-dt * 6);
    this.spinQuat.slerp(this.homeQuat, rate);
    const rig = this.rigs.get(this.activeId);
    if (rig) rig.spin.quaternion.copy(this.spinQuat);
    if (this.spinQuat.angleTo(this.homeQuat) < 0.002) {
      this.spinQuat.copy(this.homeQuat);
      this.homeSlerpActive = false;
    }
  }

  private updateIdle(dt: number, now: number): void {
    const rig = this.rigs.get(this.activeId);
    if (!rig || this.reducedMotion) return;
    const idleAfter = now - this.lastInteract > 1800;
    const targetW = idleAfter ? 1 : 0;
    this.idleWeight += (targetW - this.idleWeight) * (1 - Math.exp(-dt * (idleAfter ? 1 / 1.5 : 4)));
    const t = now / 1000;
    rig.pivot.rotation.y = Math.sin(t * 0.55) * 0.16 * this.idleWeight;
    rig.pivot.rotation.x = Math.sin(t * 0.9) * 0.03 * this.idleWeight;
    rig.pivot.position.y =
      Math.sin(t * 1.3 + this.indexOf(this.activeId)) * 0.028;
  }

  private updateFraming(dt: number): void {
    const { heroWidth, heroHeight, stageLeft, stageTop, stageWidth, stageHeight, focusMode } =
      this.targets;
    const stageCx = stageLeft + stageWidth / 2;
    const stageCy = stageTop + stageHeight * (focusMode ? 0.5 : 0.44);
    const targetPx =
      Math.min(stageWidth * 0.5, stageHeight * 0.6) * 1.16;
    const targetCx = focusMode ? heroWidth / 2 : stageCx;
    const targetCy = focusMode ? heroHeight / 2 : stageCy;

    const ease = 1 - Math.exp(-dt * 7);
    this.cx += (targetCx - this.cx) * ease;
    this.cy += (targetCy - this.cy) * ease;
    this.px += (targetPx - this.px) * ease;

    this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.exp(-dt * 6));

    const fovRad = (26 * Math.PI) / 180;
    const z = heroHeight / (2 * Math.tan(fovRad / 2) * this.px * this.zoom);
    this.camera!.position.z = z;
    this.camera!.setViewOffset(
      heroWidth,
      heroHeight,
      heroWidth / 2 - this.cx,
      heroHeight / 2 - this.cy,
      heroWidth,
      heroHeight,
    );
    this.camera!.updateProjectionMatrix();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function outBack(t: number): number {
  return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
}
