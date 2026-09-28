// Three.js particle "core" that morphs between shapes as the page scrolls.
// The shape sequence comes from the page registry (one shape per section);
// the tracker drives `setProgress` with a float index into it.
import * as THREE from '../../../assets/vendor/three.module.min.js';
import { SHAPES } from './shapes.js';
import { vertex, fragment } from './shaders.js';

const TAU = Math.PI * 2;

export function createScene(canvas, { shapes: names, reducedMotion = false }) {
  const SEQUENCE = names.map((n) => {
    if (!SHAPES[n]) throw new Error(`Unknown scene shape "${n}"`);
    return SHAPES[n];
  });
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const COUNT = isMobile ? 4500 : 9000;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
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

  const geo = new THREE.BufferGeometry();
  const posA = new THREE.BufferAttribute(shapes[0].slice(), 3);
  const posB = new THREE.BufferAttribute(shapes[1].slice(), 3);
  posA.setUsage(THREE.DynamicDrawUsage);
  posB.setUsage(THREE.DynamicDrawUsage);
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

  // HUD rings orbiting the object
  const rings = new THREE.Group();
  const ringMat = new THREE.LineBasicMaterial({ color: 0x2ef2b0, transparent: true, opacity: 0.22 });
  [2.5, 2.75, 3.3].forEach((r, i) => {
    const pts = [];
    const segs = 160;
    const gapStart = i === 1 ? 0.15 : 0.7;
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      if (i !== 0 && t > gapStart && t < gapStart + 0.18) continue;
      pts.push(new THREE.Vector3(Math.cos(t * TAU) * r, Math.sin(t * TAU) * r, 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    line.rotation.x = Math.PI / 2 + (i - 1) * 0.35;
    line.rotation.y = i * 0.5;
    rings.add(line);
  });
  group.add(rings);

  // far dust for depth
  const dustCount = isMobile ? 500 : 1100;
  const dust = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dust.set([(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20, -Math.random() * 18 - 2], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0x6b7c93, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  /* ---------- state ---------- */
  let target = 0; // float index into SEQUENCE, set from scroll
  let current = 0; // smoothed
  let segment = 0; // which A/B pair is loaded
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false };
  const worldHalfWidth = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;

  function loadSegment(i) {
    segment = i;
    posA.array.set(shapes[i]);
    posB.array.set(shapes[Math.min(i + 1, shapes.length - 1)]);
    posA.needsUpdate = true;
    posB.needsUpdate = true;
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 760 ? 11 : 8.5;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointer.active = e.pointerType === 'mouse';
  });
  document.addEventListener('pointerleave', () => (pointer.active = false));

  const lerp = (a, b, t) => a + (b - a) * t;
  const clock = new THREE.Clock();
  let running = true;
  let snapFrames = 0;

  // Adaptive quality: if frames stay slow for ~2s, step down resolution and
  // then particle count, so weaker GPUs keep scrolling smooth.
  const quality = { level: 0, slow: 0, sampled: 0 };
  function adapt(rawDt) {
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

  function frame() {
    if (!running) return;
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;
    adapt(rawDt);

    if (snapFrames > 0) { snapFrames--; current = target; }
    current = reducedMotion ? target : lerp(current, target, 1 - Math.pow(0.001, dt));
    const max = SEQUENCE.length - 1;
    const c = Math.min(Math.max(current, 0), max);
    let i = Math.min(Math.floor(c), max - 1);
    if (i !== segment) loadSegment(i);
    const local = c - i;
    uniforms.uMix.value = local;

    // interpolate placement between shape i and i+1
    const A = SEQUENCE[i], B = SEQUENCE[i + 1];
    const e = local * local * (3 - 2 * local);
    const half = worldHalfWidth();
    const narrow = window.innerWidth < 900;
    const xScale = narrow ? 0 : Math.min(1, half / 5.2);
    group.position.x = lerp(A.x, B.x, e) * xScale;
    group.position.y = lerp(A.y, B.y, e) + (narrow ? 0.4 : 0);
    const s = lerp(A.s, B.s, e) * (narrow ? 0.85 : 1);
    group.scale.setScalar(s);
    const opacity = lerp(A.o, B.o, e) * (narrow ? 0.55 : 1);
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
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    const wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning) { clock.getDelta(); requestAnimationFrame(frame); }
  });

  requestAnimationFrame(frame);

  return {
    /** p is a float index into the shape sequence (0 .. length - 1) */
    setProgress(p) { target = p; },
    /** jump straight to the current target (used behind the nav curtain) */
    snap() { snapFrames = 3; },
  };
}
