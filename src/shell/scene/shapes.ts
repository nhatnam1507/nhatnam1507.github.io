// Particle shape library for the 3D scene. Each generator returns
// Float32Array(count * 3) positions; each Shape also says where it sits on
// screen (x/y offset in world units, scale, tilt, opacity) so the object never
// fights the copy of the section it belongs to.
import * as THREE from 'three';
import { seededRandom } from '@/shared/random';
import type { ShapeName } from '../contract';

const TAU = Math.PI * 2;

export interface Shape {
  name: ShapeName;
  /** fills a Float32Array(count * 3) with particle positions */
  gen: (count: number) => Float32Array;
  /** x/y offset in world units at z = 0 */
  x: number;
  y: number;
  /** scale */
  s: number;
  tilt: number;
  /** overall opacity */
  o: number;
  /** bounding radius (world units, before scale), for shapes that HUD overlays lock onto */
  r?: number;
}

/* ---------- shape generators: each returns Float32Array(count * 3) ---------- */

const CORE_RADIUS = 1.9;

function sphere(n: number, r = CORE_RADIUS): Float32Array {
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

function helix(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const turns = 3.2,
    h = 5.2,
    r = 1.05;
  for (let i = 0; i < n; i++) {
    const kind = Math.random();
    const u = Math.random();
    if (kind < 0.8) {
      // two strands
      const a = u * turns * TAU;
      const off = kind < 0.4 ? 0 : Math.PI;
      const s = 0.07;
      const x = Math.cos(a + off) * r + (Math.random() - 0.5) * s;
      const z = Math.sin(a + off) * r + (Math.random() - 0.5) * s;
      out.set([x, (u - 0.5) * h, z], i * 3);
    } else {
      // rungs between strands, snapped to discrete steps
      const step = Math.round(u * 34) / 34;
      const aa = step * turns * TAU;
      const k = Math.random() * 2 - 1;
      out.set([Math.cos(aa) * r * k, (step - 0.5) * h, Math.sin(aa) * r * k], i * 3);
    }
  }
  return out;
}

// 3x3x3 lattice of cube wireframes: "infrastructure"
function lattice(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const size = 0.62,
    gap = 0.34,
    g = 3;
  const span = g * size + (g - 1) * gap;
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(Math.random() * g),
      cy = Math.floor(Math.random() * g),
      cz = Math.floor(Math.random() * g);
    const ox = -span / 2 + cx * (size + gap);
    const oy = -span / 2 + cy * (size + gap);
    const oz = -span / 2 + cz * (size + gap);
    // pick one of 12 edges of the small cube
    const e = Math.floor(Math.random() * 12);
    const axis = Math.floor(e / 4);
    const a = (e & 1) * size,
      b = ((e >> 1) & 1) * size;
    const t = Math.random() * size;
    const p: [number, number, number] = axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t];
    out.set([ox + p[0], oy + p[1], oz + p[2]], i * 3);
  }
  return out;
}

// microservice graph: clustered nodes + particles streaming along edges
function network(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const nodes: THREE.Vector3[] = [];
  const rng = seededRandom(7);
  for (let i = 0; i < 14; i++) {
    const v = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize().multiplyScalar(1.1 + rng() * 1.3);
    nodes.push(v);
  }
  nodes.push(new THREE.Vector3());
  const edges: [number, number][] = [];
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

function torusKnot(n: number, p = 2, q = 3): Float32Array {
  const out = new Float32Array(n * 3);
  const knot = (t: number): THREE.Vector3 => {
    const r = 1.25 + 0.55 * Math.cos(q * t);
    return new THREE.Vector3(r * Math.cos(p * t), r * Math.sin(p * t), 0.55 * Math.sin(q * t));
  };
  for (let i = 0; i < n; i++) {
    const u = Math.random() * TAU;
    const tube = 0.26 * Math.sqrt(Math.random());
    const c = knot(u);
    const tangent = knot(u + 0.001)
      .sub(c)
      .normalize();
    const normal = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
    const bin = tangent.clone().cross(normal);
    const a = Math.random() * TAU;
    c.addScaledVector(normal, Math.cos(a) * tube).addScaledVector(bin, Math.sin(a) * tube);
    out.set([c.x, c.y, c.z], i * 3);
  }
  return out;
}

// concentric rings: a portal
function portal(n: number): Float32Array {
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

/* ---------- per-shape placement so the object never fights the copy ---------- */
// x/y offset (in world units at z=0), scale, tilt and overall opacity per section;
// r = bounding radius, for shapes that HUD overlays lock onto
export const SHAPES = {
  core: { name: 'core', gen: sphere, x: 2.5, y: 0, s: 1.0, tilt: 0.25, o: 1.0, r: CORE_RADIUS },
  helix: { name: 'helix', gen: helix, x: 0, y: 0, s: 1.1, tilt: 0.45, o: 0.35 }, // behind the dashboard
  lattice: { name: 'lattice', gen: lattice, x: 0, y: 0, s: 1.0, tilt: 0.55, o: 0.4 },
  network: { name: 'network', gen: network, x: 2.4, y: 0, s: 1.0, tilt: 0.3, o: 0.95 },
  knot: { name: 'knot', gen: torusKnot, x: -2.4, y: 0, s: 0.95, tilt: 0.2, o: 0.9 },
  portal: { name: 'portal', gen: portal, x: 0, y: 0.1, s: 1.25, tilt: 0.0, o: 0.85 },
} satisfies Record<ShapeName, Shape>;
