// "bugs vs coffee" line chart (SVG). The View renders the geometry from
// `chartModel`; lines are drawn by animating stroke-dashoffset 1 → 0 (they
// use pathLength="1"). No library imports: safe to use from the Server View.
import { $$, $req } from '@/shared/dom';
import type { Day } from '../content';

const W = 320,
  H = 128,
  L = 26,
  R = 8,
  T = 10,
  B = 22;
const COFFEE_MAX = 5;
const BUGS_MAX = 10;

export interface ChartModel {
  /** horizontal grid lines */
  grid: { y: number; x1: number; x2: number }[];
  /** x-axis labels, every 4 hours */
  ticks: { x: number; y: number; label: string }[];
  coffeePath: string;
  bugsPath: string;
  note: { cx: number; cy: number; tx: number; ty: number; text: string };
}

export function chartModel({ startHour, coffee, bugs, note }: Day): ChartModel {
  const x = (i: number) => L + (i / (coffee.length - 1)) * (W - L - R);
  const y = (v: number, max: number) => T + (1 - v / max) * (H - T - B);
  // coffee is a step line (cups are discrete), bugs a polyline
  let coffeePath = `M ${x(0)} ${y(coffee[0], COFFEE_MAX)}`;
  coffee.forEach((v, i) => {
    if (i) coffeePath += ` H ${x(i)} V ${y(v, COFFEE_MAX)}`;
  });
  const bugsPath = bugs.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v, BUGS_MAX).toFixed(1)}`).join(' ');
  const cy = y(bugs[note.at], BUGS_MAX);
  return {
    grid: [0, 0.5, 1].map((f) => ({ y: T + f * (H - T - B), x1: L, x2: W - R })),
    ticks: [0, 4, 8, 12].map((i) => ({ x: x(i), y: H - 6, label: `${String(startHour + i).padStart(2, '0')}h` })),
    coffeePath,
    bugsPath,
    note: { cx: x(note.at), cy, tx: x(note.at) + 7, ty: cy - 7, text: note.text },
  };
}

/** The animatable parts of the rendered chart. */
export function chartParts(svg: SVGSVGElement): { lines: SVGPathElement[]; note: SVGGElement } {
  return { lines: $$<SVGPathElement>('.ch-line', svg), note: $req<SVGGElement>('.ch-note', svg) };
}
