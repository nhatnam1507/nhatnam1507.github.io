// SVG wires between diagram boxes, re-measured on layout changes, with
// packets riding them via <animateMotion>. Negative `begin` offsets mean
// every packet is already in flight (none parks at the SVG origin).
import { $, $$ } from '../../../shared/dom.js';
import { isDesktop } from '../../../shared/env.js';

const PACKETS_PER_WIRE = 3;

/** Path from box A to box B: straight down if B sits under A, down-and-across
 *  if B is below but to the side, otherwise a horizontal S-curve. */
function route(A, B) {
  if (B.t >= A.b) {
    const l = Math.max(A.l, B.l), r = Math.min(A.r, B.r);
    if (r > l) { const x = (l + r) / 2; return `M ${x} ${A.b} L ${x} ${B.t}`; }
    const x = (A.l + A.r) / 2, y = (B.t + B.b) / 2;
    return `M ${x} ${A.b} C ${x} ${y}, ${x} ${y}, ${B.l} ${y}`;
  }
  const y1 = (A.t + A.b) / 2, y2 = (B.t + B.b) / 2, mx = (A.r + B.l) / 2;
  return `M ${A.r} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${B.l} ${y2}`;
}

export function createWires(board, svg, wires) {
  const boxEl = (id) => $(`[data-box="${id}"]`, board);
  let built = false;

  const build = () => {
    svg.innerHTML = `
      <path class="wire-drop js-drops" d=""/>
      ${wires.map(([id, , , kind]) => `<path id="${id}" class="wire wire-${kind}" pathLength="1" d=""/>`).join('')}
      <g class="packets js-packets">
        ${wires.flatMap(([id, , , kind]) => Array.from({ length: PACKETS_PER_WIRE }, (_, k) => `
          <circle class="pk pk-${kind}" r="${kind === 'flow' ? 3.2 : 2.6}">
            <animateMotion dur="${kind === 'flow' ? 1.8 : 2.6}s" begin="-${(k * (kind === 'flow' ? 0.6 : 0.87)).toFixed(2)}s" repeatCount="indefinite" rotate="auto">
              <mpath href="#${id}"/>
            </animateMotion>
          </circle>`)).join('')}
      </g>`;
    svg.pauseAnimations();
    built = true;
  };

  const layout = () => {
    if (!isDesktop()) return;
    if (!built) build();
    const b = board.getBoundingClientRect();
    const scale = b.width / board.offsetWidth || 1; // the board may be scaled to fit
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { l: (r.left - b.left) / scale, t: (r.top - b.top) / scale, r: (r.right - b.left) / scale, b: (r.bottom - b.top) / scale };
    };
    svg.setAttribute('viewBox', `0 0 ${board.offsetWidth} ${board.offsetHeight}`);
    wires.forEach(([id, from, to]) => $(`#${id}`, svg).setAttribute('d', route(rect(boxEl(from)), rect(boxEl(to)))));
    // "runs on" drops from each box above the platform band
    const P = rect(boxEl('plat'));
    $('.js-drops', svg).setAttribute('d', ['api', 'svc', 'data', 'obs']
      .map((id) => { const X = rect(boxEl(id)); const x = (X.l + X.r) / 2; return x > P.l && x < P.r ? `M ${x} ${X.b} L ${x} ${P.t}` : ''; }).join(' '));
  };

  return {
    layout,
    byKind: (kind) => $$(`.wire-${kind}`, svg),
    packets: () => $('.js-packets', svg),
    play: () => svg.unpauseAnimations(),
    pause: () => svg.pauseAnimations(),
  };
}
