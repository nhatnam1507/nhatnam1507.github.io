// "bugs vs coffee" line chart (SVG). Lines are drawn by animating
// stroke-dashoffset 1 → 0 (they use pathLength="1").
import { $, $$ } from '../../../shared/dom.js';

const W = 320, H = 128, L = 26, R = 8, T = 10, B = 22;

export function createChart(svg, { startHour, coffee, bugs, note }) {
  const x = (i) => L + (i / (coffee.length - 1)) * (W - L - R);
  const y = (v, max) => T + (1 - v / max) * (H - T - B);
  // coffee is a step line (cups are discrete), bugs a polyline
  let dCoffee = `M ${x(0)} ${y(coffee[0], 5)}`;
  coffee.forEach((v, i) => { if (i) dCoffee += ` H ${x(i)} V ${y(v, 5)}`; });
  const dBugs = bugs.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v, 10).toFixed(1)}`).join(' ');
  const grid = [0, 0.5, 1].map((f) => `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${T + f * (H - T - B)}" y2="${T + f * (H - T - B)}"/>`).join('');
  const ticks = [0, 4, 8, 12].map((i) => `<text class="ch-tick" x="${x(i)}" y="${H - 6}" text-anchor="middle">${String(startHour + i).padStart(2, '0')}h</text>`).join('');

  svg.innerHTML = `
    ${grid}${ticks}
    <path class="ch-line ch-coffee" pathLength="1" d="${dCoffee}"/>
    <path class="ch-line ch-bugs" pathLength="1" d="${dBugs}"/>
    <g class="ch-note">
      <circle cx="${x(note.at)}" cy="${y(bugs[note.at], 10)}" r="3.5"/>
      <text x="${x(note.at) + 7}" y="${y(bugs[note.at], 10) - 7}">${note.text}</text>
    </g>`;
  return { lines: $$('.ch-line', svg), note: $('.ch-note', svg) };
}
