// Scroll tracking → 3D scene progress, HUD and nav state.
// Section offsets are measured once per ScrollTrigger refresh (pinned
// sections via their pin-spacer), so per-frame work is arithmetic on scrollY
// with no layout reads, and the DOM is only written when a value changes.
import { gsap, ScrollTrigger } from '../shared/lib.js';
import { $, $$, pad2 } from '../shared/dom.js';
import { scrollRange } from '../shared/motion.js';

const fmtCoord = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(3);

export function startTracker({ sections, scene }) {
  const els = sections.map((s) => $(`#${s.id}`));
  const nav = $('.nav');
  const navLinks = $$('.nav-links a');
  const hud = {
    num: $('.hud-num'), label: $('.hud-label'), fill: $('.hud-fill'), pct: $('.hud-pct'),
    shape: $('.hud-shape'), coords: $('.hud-coords'), fps: $('.hud-fps'),
  };
  $('.hud-total').textContent = pad2(sections.length - 1);

  let tops = [], maxScroll = 1;
  const measure = () => {
    tops = els.map((el) => scrollRange(el).getBoundingClientRect().top + scrollY);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  };
  ScrollTrigger.addEventListener('refresh', measure);
  measure();

  let coordsDirty = false, px = 0, py = 0;
  addEventListener('pointermove', (e) => {
    px = (e.clientX / innerWidth) * 2 - 1;
    py = -(e.clientY / innerHeight) * 2 + 1;
    coordsDirty = true;
  });

  let active = -1, lastPct = -1, scrolled = null, frames = 0, last = performance.now();
  gsap.ticker.add(() => {
    const y = scrollY, vh = innerHeight;
    // s: float index into the section list; each section fades the scene
    // over the 80% of a viewport before its top reaches the top edge
    let s = 0, current = 0;
    for (let i = 0; i < tops.length; i++) {
      const top = tops[i] - y;
      if (i > 0) s += Math.min(1, Math.max(0, (vh - top) / (vh * 0.8)));
      if (top <= vh * 0.5) current = i;
    }
    scene?.setProgress(s);

    if (current !== active) {
      active = current;
      const sec = sections[active];
      hud.num.textContent = pad2(active);
      hud.label.textContent = sec.label;
      hud.shape.textContent = `mesh: ${sec.shape}`;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${sec.id}`));
    }

    const p = Math.round((y / maxScroll) * 1000) / 1000;
    if (p !== lastPct) {
      lastPct = p;
      hud.fill.style.transform = `scaleY(${p})`;
      hud.pct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
    }
    const sc = y > 40;
    if (sc !== scrolled) { scrolled = sc; nav.classList.toggle('is-scrolled', sc); }

    if (coordsDirty) { coordsDirty = false; hud.coords.textContent = `x:${fmtCoord(px)} y:${fmtCoord(py)}`; }

    frames++;
    const now = performance.now();
    if (now - last > 500) {
      hud.fps.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
      frames = 0; last = now;
    }
  });
}
