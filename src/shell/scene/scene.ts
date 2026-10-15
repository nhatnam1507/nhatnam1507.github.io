// Three.js particle "core" that morphs between shapes as the page scrolls.
// The shape sequence comes from the page registry (one shape per section);
// the tracker drives `setProgress` with a float index into it.
import * as THREE from 'three';
import type { SceneHandle, ShapeName } from '../contract';
import { SHAPES, type Shape } from './shapes';
import { vertex, fragment } from './shaders';

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface SceneOptions {
  /** one shape per section, in registry order */
  shapes: readonly ShapeName[];
  reducedMotion: boolean;
  /** stops the render loop and frees GPU resources on abort */
  signal: AbortSignal;
}

/** HUD rings orbiting the object. */
function createRings(material: THREE.LineBasicMaterial): { rings: THREE.Group; geometries: THREE.BufferGeometry[] } {
  const rings = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  [2.5, 2.75, 3.3].forEach((r, i) => {
    const pts: THREE.Vector3[] = [];
    const segs = 160;
    const gapStart = i === 1 ? 0.15 : 0.7;
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      if (i !== 0 && t > gapStart && t < gapStart + 0.18) continue;
      pts.push(new THREE.Vector3(Math.cos(t * TAU) * r, Math.sin(t * TAU) * r, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    geometries.push(geometry);
    const line = new THREE.Line(geometry, material);
    line.rotation.x = Math.PI / 2 + (i - 1) * 0.35;
    line.rotation.y = i * 0.5;
    rings.add(line);
  });
  return { rings, geometries };
}

/** Far dust for depth. */
function createDust(count: number): THREE.BufferGeometry {
  const dust = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    dust.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, -Math.random() * 18 - 2], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  return geometry;
}

/** Throws when WebGL is unavailable (the runtime then continues without a scene). */
export function createScene(
  canvas: HTMLCanvasElement,
  { shapes: names, reducedMotion, signal }: SceneOptions,
): SceneHandle {
  const SEQUENCE: Shape[] = names.map((n) => SHAPES[n]);
  if (SEQUENCE.length < 2) throw new Error('A scene needs at least two shapes to morph between');
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const COUNT = isMobile ? 4500 : 9000;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  });
  // Soft additive points gain nothing visible from a 2x backbuffer, so cap
  // the pixel ratio; adaptive quality below lowers it further if needed.
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  const shapes = SEQUENCE.map((s) => s.gen(COUNT));
  const rand = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) rand[i] = Math.random();

  // posA/posB hold the pair of shapes currently being morphed between
  const bufA = new Float32Array(COUNT * 3);
  const bufB = new Float32Array(COUNT * 3);
  const posA = new THREE.BufferAttribute(bufA, 3);
  const posB = new THREE.BufferAttribute(bufB, 3);
  posA.setUsage(THREE.DynamicDrawUsage);
  posB.setUsage(THREE.DynamicDrawUsage);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', posA);
  geo.setAttribute('aPosB', posB);
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: isMobile ? 34 : 42 },
    uPixelRatio: { value: dpr },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uAspect: { value: 1 },
    uOpacity: { value: 1 },
    uColorA: { value: new THREE.Color('#2ef2b0') },
    uColorB: { value: new THREE.Color('#5aa9ff') },
    uColorC: { value: new THREE.Color('#ffffff') },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  const points = new THREE.Points(geo, material);
  group.add(points);
  scene.add(group);

  const ringMat = new THREE.LineBasicMaterial({ color: 0x2ef2b0, transparent: true, opacity: 0.22 });
  const { rings, geometries: ringGeos } = createRings(ringMat);
  group.add(rings);

  const dustGeo = createDust(isMobile ? 500 : 1100);
  const dustMat = new THREE.PointsMaterial({
    color: 0x6b7c93,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  /* ---------- state ---------- */
  let target = 0; // float index into SEQUENCE, set from scroll
  let current = 0; // smoothed
  let segment = -1; // which A/B pair is loaded
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false };
  const worldHalfWidth = (): number =>
    Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;

  /** Viewport-dependent adjustments to every shape's placement. */
  function layout() {
    const half = worldHalfWidth();
    const narrow = window.innerWidth < 900;
    return {
      half,
      narrow,
      xScale: narrow ? 0 : Math.min(1, half / 5.2),
      yShift: narrow ? 0.4 : 0,
      sScale: narrow ? 0.85 : 1,
    };
  }

  function loadSegment(i: number): void {
    segment = i;
    bufA.set(shapes[i]);
    bufB.set(shapes[Math.min(i + 1, shapes.length - 1)]);
    posA.needsUpdate = true;
    posB.needsUpdate = true;
  }
  loadSegment(0);

  function resize(): void {
    const w = window.innerWidth,
      h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 760 ? 11 : 8.5;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect;
  }
  resize();
  window.addEventListener('resize', resize, { signal });

  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.active = e.pointerType === 'mouse';
    },
    { signal },
  );
  document.addEventListener('pointerleave', () => (pointer.active = false), { signal });

  const clock = new THREE.Clock();
  let running = true;
  let snapFrames = 0;
  let raf = 0;

  // Adaptive quality: if frames stay slow for ~2s, step down resolution and
  // then particle count, so weaker GPUs keep scrolling smooth.
  const quality = { level: 0, slow: 0, sampled: 0 };
  function adapt(rawDt: number): void {
    if (quality.level >= 2 || document.hidden) return;
    quality.sampled++;
    if (rawDt > 1 / 45) quality.slow++;
    if (quality.sampled < 120) return;
    if (quality.slow / quality.sampled > 0.5) {
      quality.level++;
      if (quality.level === 1) {
        dpr = 1;
        renderer.setPixelRatio(dpr);
        uniforms.uPixelRatio.value = dpr;
        resize();
      } else {
        geo.setDrawRange(0, Math.floor(COUNT * 0.6));
      }
    }
    quality.sampled = quality.slow = 0;
  }

  // at most one frame is ever queued, so visibility toggles can't fork the loop
  function schedule(): void {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame(): void {
    raf = 0;
    if (!running) return;
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    adapt(rawDt);

    if (snapFrames > 0) {
      snapFrames--;
      current = target;
    }
    current = reducedMotion ? target : lerp(current, target, 1 - Math.pow(0.001, dt));
    const max = SEQUENCE.length - 1;
    const c = Math.min(Math.max(current, 0), max);
    const i = Math.min(Math.floor(c), max - 1);
    if (i !== segment) loadSegment(i);
    const local = c - i;
    uniforms.uMix.value = local;

    // interpolate placement between shape i and i+1
    const A = SEQUENCE[i],
      B = SEQUENCE[i + 1];
    const e = local * local * (3 - 2 * local);
    const L = layout();
    group.position.x = lerp(A.x, B.x, e) * L.xScale;
    group.position.y = lerp(A.y, B.y, e) + L.yShift;
    const s = lerp(A.s, B.s, e) * L.sScale;
    group.scale.setScalar(s);
    const opacity = lerp(A.o, B.o, e) * (L.narrow ? 0.55 : 1);
    uniforms.uOpacity.value = opacity;
    ringMat.opacity = 0.22 * opacity * (1 - Math.min(1, c) * 0.6);

    // rotation: idle spin + scroll-coupled spin + tilt
    const spin = reducedMotion ? 0 : t * 0.08;
    points.rotation.y = spin + c * 0.9;
    points.rotation.x = lerp(A.tilt, B.tilt, e);
    rings.rotation.z = t * 0.12;
    rings.rotation.y = Math.sin(t * 0.2) * 0.2;

    // pointer parallax + repel
    pointer.sx = lerp(pointer.sx, pointer.x, 0.05);
    pointer.sy = lerp(pointer.sy, pointer.y, 0.05);
    camera.position.x = pointer.sx * 0.35;
    camera.position.y = pointer.sy * 0.25;
    camera.lookAt(0, 0, 0);
    const mu = uniforms.uMouse.value;
    if (pointer.active) mu.set(lerp(mu.x, pointer.x, 0.2), lerp(mu.y, pointer.y, 0.2));
    else mu.set(9, 9);

    dustPoints.rotation.y = t * 0.01;
    dustPoints.position.y = c * 0.6;

    renderer.render(scene, camera);
    schedule();
  }

  document.addEventListener(
    'visibilitychange',
    () => {
      const wasRunning = running;
      running = !document.hidden;
      if (running && !wasRunning) {
        clock.getDelta();
        schedule();
      }
    },
    { signal },
  );

  schedule();

  // Free everything on abort (the listeners above are removed by `signal`).
  // The renderer is disposed but its context is not force-lost: React StrictMode
  // re-creates the scene on the same canvas, and a lost context can't be reused.
  signal.addEventListener(
    'abort',
    () => {
      cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      [geo, dustGeo, ...ringGeos].forEach((g) => g.dispose());
      [material, ringMat, dustMat].forEach((m) => m.dispose());
      renderer.dispose();
    },
    { once: true },
  );

  return {
    setProgress(p) {
      target = p;
    },
    snap() {
      snapFrames = 3;
    },
    /**
     * Where a shape sits on screen when at rest: centre and bounding radius in
     * CSS px (radius 0 if the shape has none). Lets DOM overlays lock onto it.
     */
    anchor(name) {
      const S: Shape = SHAPES[name];
      const L = layout();
      const px = window.innerWidth / 2 / L.half; // CSS px per world unit at z = 0
      return {
        x: window.innerWidth / 2 + S.x * L.xScale * px,
        y: window.innerHeight / 2 - (S.y + L.yShift) * px,
        r: (S.r ?? 0) * S.s * L.sScale * px,
      };
    },
  };
}
