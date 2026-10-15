// 52×7 contribution grid drawn on a canvas (cheap to redraw, no 364 DOM
// nodes). `setReveal(0..1)` drives a diagonal wave; `twinkle()` bumps a few
// random cells for the live effect.
import { seededRandom } from '../../../shared/random.js';

const COLS = 52, ROWS = 7;
const COLORS = ['rgba(255,255,255,0.05)', 'rgba(46,242,176,0.22)', 'rgba(46,242,176,0.45)', 'rgba(46,242,176,0.7)', '#2ef2b0'];

function commitLevels() {
  const rnd = seededRandom(1507);
  const level = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const weekend = r === 0 || r === 6;
      let v = rnd() * (weekend ? 0.45 : 1) * (0.55 + (c / COLS) * 0.6);
      if (!weekend && rnd() < 0.08) v = 1; // release weeks
      level.push(v < 0.18 ? 0 : v < 0.4 ? 1 : v < 0.62 ? 2 : v < 0.82 ? 3 : 4);
    }
  }
  return level;
}

export function createHeatmap(canvas) {
  const level = commitLevels();
  const boost = new Float32Array(COLS * ROWS);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, cell = 0, gap = 0, reveal = 0;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const k = c * ROWS + r;
        const t = Math.min(1, Math.max(0, (reveal * 1.25 - c / COLS - r * 0.012) * 6));
        if (t <= 0) continue;
        ctx.globalAlpha = t;
        ctx.fillStyle = COLORS[Math.min(4, level[k] + (boost[k] > 0.5 ? 1 : 0))];
        const s = cell * (0.6 + 0.4 * t);
        const o = (cell - s) / 2;
        ctx.fillRect(c * (cell + gap) + o, r * (cell + gap) + o, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    gap = w < 420 ? 2 : 3;
    cell = (w - gap * (COLS - 1)) / COLS;
    h = Math.ceil(cell * ROWS + gap * (ROWS - 1));
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  return {
    size,
    setReveal(v) { if (v !== reveal) { reveal = v; draw(); } },
    twinkle() {
      for (let i = 0; i < boost.length; i++) boost[i] *= 0.6;
      for (let n = 0; n < 4; n++) boost[(Math.random() * boost.length) | 0] = 1;
      draw();
    },
  };
}
