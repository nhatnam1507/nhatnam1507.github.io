// Three.js particle "core" that morphs between shapes as the page scrolls.
// Each section of the page maps to one shape; main.js drives `setProgress`.
import * as THREE from '../vendor/three.module.min.js';

const TAU = Math.PI * 2;

/* ---------- shape generators: each returns Float32Array(count * 3) ---------- */

function sphere(n, r = 1.9) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const t = golden * i;
    const jitter = r * (1 + (Math.random() - 0.5) * 0.04);
    out.set([Math.cos(t) * rad * jitter, y * jitter, Math.sin(t) * rad * jitter], i * 3);
  }
  return out;
}

function helix(n) {
  const out = new Float32Array(n * 3);
  const turns = 3.2, h = 5.2, r = 1.05;
  for (let i = 0; i < n; i++) {
    const kind = Math.random();
    const u = Math.random();
    const a = u * turns * TAU;
    const y = (u - 0.5) * h;
    let x, z;
    if (kind < 0.8) {
      // two strands
      const off = kind < 0.4 ? 0 : Math.PI;
      const s = 0.07;
      x = Math.cos(a + off) * r + (Math.random() - 0.5) * s;
      z = Math.sin(a + off) * r + (Math.random() - 0.5) * s;
    } else {
      // rungs between strands, snapped to discrete steps
      const step = Math.round(u * 34) / 34;
      const aa = step * turns * TAU;
      const k = Math.random() * 2 - 1;
      x = Math.cos(aa) * r * k;
      z = Math.sin(aa) * r * k;
      out.set([x, (step - 0.5) * h, z], i * 3);
      continue;
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

function galaxy(n) {
  const out = new Float32Array(n * 3);
  const arms = 4;
  for (let i = 0; i < n; i++) {
    const r = Math.pow(Math.random(), 1.6) * 3.2;
    const arm = (i % arms) / arms * TAU;
    const spin = r * 1.25;
    const spread = 0.35 * (1 - r / 4);
    const rx = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * r;
    const ry = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * 0.6;
    const rz = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * spread * r;
    out.set([Math.cos(arm + spin) * r + rx, ry, Math.sin(arm + spin) * r + rz], i * 3);
  }
  return out;
}

// 3x3x3 lattice of cube wireframes — "infrastructure"
function lattice(n) {
  const out = new Float32Array(n * 3);
  const size = 0.62, gap = 0.34, g = 3;
  const span = g * size + (g - 1) * gap;
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(Math.random() * g), cy = Math.floor(Math.random() * g), cz = Math.floor(Math.random() * g);
    const ox = -span / 2 + cx * (size + gap);
    const oy = -span / 2 + cy * (size + gap);
    const oz = -span / 2 + cz * (size + gap);
    // pick one of 12 edges of the small cube
    const e = Math.floor(Math.random() * 12);
    const axis = Math.floor(e / 4);
    const a = (e & 1) * size, b = ((e >> 1) & 1) * size;
    const t = Math.random() * size;
    let p;
    if (axis === 0) p = [t, a, b];
    else if (axis === 1) p = [a, t, b];
    else p = [a, b, t];
    out.set([ox + p[0], oy + p[1], oz + p[2]], i * 3);
  }
  return out;
}

// microservice graph: clustered nodes + particles streaming along edges
function network(n) {
  const out = new Float32Array(n * 3);
  const nodes = [];
  const rng = mulberry32(7);
  for (let i = 0; i < 14; i++) {
    const v = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize().multiplyScalar(1.1 + rng() * 1.3);
    nodes.push(v);
  }
  nodes.push(new THREE.Vector3());
  const edges = [];
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => ({ j, d: a.distanceTo(b) }))
      .filter((o) => o.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 3);
    near.forEach((o) => edges.push([i, o.j]));
  });
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.55) {
      const c = nodes[Math.floor(Math.random() * nodes.length)];
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const r = 0.2 * Math.cbrt(Math.random());
      out.set([c.x + d.x * r, c.y + d.y * r, c.z + d.z * r], i * 3);
    } else {
      const [ia, ib] = edges[Math.floor(Math.random() * edges.length)];
      const t = Math.random();
      const p = nodes[ia].clone().lerp(nodes[ib], t);
      out.set([p.x, p.y, p.z], i * 3);
    }
  }
  return out;
}

function torusKnot(n, p = 2, q = 3) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * TAU;
    const tube = 0.26 * Math.sqrt(Math.random());
    const knot = (t) => {
      const r = 1.25 + 0.55 * Math.cos(q * t);
      return new THREE.Vector3(r * Math.cos(p * t), r * Math.sin(p * t), 0.55 * Math.sin(q * t));
    };
    const c = knot(u);
    const tangent = knot(u + 0.001).sub(c).normalize();
    const normal = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
    const bin = tangent.clone().cross(normal);
    const a = Math.random() * TAU;
    c.addScaledVector(normal, Math.cos(a) * tube).addScaledVector(bin, Math.sin(a) * tube);
    out.set([c.x, c.y, c.z], i * 3);
  }
  return out;
}

// concentric rings: a portal
function portal(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const ring = Math.floor(Math.random() * 6);
    const r = 0.6 + ring * 0.42 + (Math.random() - 0.5) * 0.05;
    const a = Math.random() * TAU;
    const z = (Math.random() - 0.5) * 0.08 - ring * 0.05;
    out.set([Math.cos(a) * r, Math.sin(a) * r, z], i * 3);
  }
  return out;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- per-shape placement so the object never fights the copy ---------- */
// x/y offset (in world units at z=0), scale, tilt and overall opacity per section
export const SHAPES = [
  { name: 'core',    gen: sphere,    x: 2.5,  y: 0,    s: 1.0,  tilt: 0.25, o: 1.0 },
  { name: 'helix',   gen: helix,     x: 2.6,  y: 0,    s: 0.95, tilt: 0.45, o: 0.9 },
  { name: 'galaxy',  gen: galaxy,    x: 0,    y: -0.2, s: 1.05, tilt: 1.05, o: 0.75 },
  { name: 'lattice', gen: lattice,   x: 0,    y: 0,    s: 1.0,  tilt: 0.55, o: 0.4 },
  { name: 'network', gen: network,   x: 2.4,  y: 0,    s: 1.0,  tilt: 0.3,  o: 0.95 },
  { name: 'knot',    gen: torusKnot, x: -2.4, y: 0,    s: 0.95, tilt: 0.2,  o: 0.9 },
  { name: 'portal',  gen: portal,    x: 0,    y: 0.1,  s: 1.25, tilt: 0.0,  o: 0.85 },
];

const vertex = /* glsl */ `
  attribute vec3 aPosB;
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uAspect;
  varying float vAlpha;
  varying float vRand;
  varying float vDepth;

  void main() {
    float delay = aRand * 0.4;
    float m = smoothstep(delay, delay + 0.6, uMix);
    vec3 p = mix(position, aPosB, m);

    // explode outward mid-transition, then settle
    float burst = sin(m * 3.14159265);
    p += normalize(p + vec3(0.0001)) * burst * (0.25 + aRand * 0.9);

    // idle shimmer
    p += 0.025 * vec3(
      sin(uTime * 1.3 + aRand * 40.0),
      cos(uTime * 1.1 + aRand * 31.0),
      sin(uTime * 0.9 + aRand * 23.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // push particles away from the pointer (screen space)
    vec2 ndc = clip.xy / clip.w;
    vec2 dir = (ndc - uMouse) * vec2(uAspect, 1.0);
    float d = length(dir);
    float f = smoothstep(0.32, 0.0, d);
    mv.xy += normalize(dir + 0.0001) * f * 0.55;
    clip = projectionMatrix * mv;

    gl_Position = clip;
    gl_PointSize = uSize * uPixelRatio * (0.45 + aRand * 0.9) * (1.0 + f * 1.5) / -mv.z;
    vAlpha = 0.35 + 0.65 * aRand + f;
    vRand = aRand;
    vDepth = clamp((-mv.z - 3.0) / 6.0, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vRand;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float disc = smoothstep(0.5, 0.0, d);
    disc = pow(disc, 1.6);
    vec3 col = mix(uColorA, uColorB, smoothstep(0.2, 0.9, vRand));
    col = mix(col, uColorC, step(0.965, vRand));
    float a = disc * vAlpha * uOpacity * (1.0 - vDepth * 0.65);
    gl_FragColor = vec4(col, a);
  }
`;

export function createScene(canvas, { reducedMotion = false } = {}) {
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const COUNT = isMobile ? 5500 : 11000;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  const shapes = SHAPES.map((s) => s.gen(COUNT));
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
  let target = 0; // float index into SHAPES, set from scroll
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

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;

    current = reducedMotion ? target : lerp(current, target, 1 - Math.pow(0.001, dt));
    const max = SHAPES.length - 1;
    const c = Math.min(Math.max(current, 0), max);
    let i = Math.min(Math.floor(c), max - 1);
    if (i !== segment) loadSegment(i);
    const local = c - i;
    uniforms.uMix.value = local;

    // interpolate placement between shape i and i+1
    const A = SHAPES[i], B = SHAPES[i + 1];
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
    /** p is a float index into SHAPES (0 .. SHAPES.length - 1) */
    setProgress(p) { target = p; },
    count: SHAPES.length,
  };
}
