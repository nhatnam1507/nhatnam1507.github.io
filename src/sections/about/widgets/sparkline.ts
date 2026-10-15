// Career "health" sparkline with two dips (the incidents we don't talk about).
// Pure: the View renders the paths, the behaviour only animates them.
import { seededRandom } from '@/shared/random';

const POINTS = 40;
const DIPS: readonly number[] = [14, 29];

/** [x, y] points in the 200×36 viewBox; seeded, so identical on every load. */
export function sparklinePoints(): [number, number][] {
  const rnd = seededRandom(42);
  const pts: [number, number][] = [];
  for (let i = 0; i <= POINTS; i++) {
    let v = 6 + rnd() * 4;
    if (DIPS.includes(i)) v = 22 + rnd() * 6;
    pts.push([i * 5, v]);
  }
  return pts;
}

export function sparklinePaths(): { line: string; fill: string } {
  const line = sparklinePoints()
    .map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y.toFixed(1)}`)
    .join(' ');
  return { line, fill: `${line} L 200 36 L 0 36 Z` };
}
