// Career "health" sparkline with two dips (the incidents we don't talk about).
import { seededRandom } from '../../../shared/random.js';

export function drawSparkline(line, fill) {
  const rnd = seededRandom(42);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    let v = 6 + rnd() * 4;
    if (i === 14 || i === 29) v = 22 + rnd() * 6;
    pts.push([i * 5, v]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y.toFixed(1)}`).join(' ');
  line.setAttribute('d', d);
  fill.setAttribute('d', `${d} L 200 36 L 0 36 Z`);
}
