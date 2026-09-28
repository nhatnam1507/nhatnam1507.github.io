// caffeine.level gauge: an elastic needle that occasionally drops to
// "refill needed" before bouncing back.
import { gsap } from '../../../shared/lib.js';

const stateOf = (v) => (v >= 80 ? 'nominal' : v >= 55 ? 'degraded' : 'refill needed ☕');

export function createGauge({ arc, needle, value, state }) {
  const g = { v: 0 };
  let sip = 0;
  const render = () => {
    arc.style.strokeDashoffset = String(1 - g.v / 100);
    needle.style.transform = `rotate(${-90 + g.v * 1.8}deg)`;
    value.textContent = Math.round(g.v);
    const s = stateOf(g.v);
    if (state.textContent !== s) { state.textContent = s; state.dataset.state = s.split(' ')[0]; }
  };
  return {
    tick() {
      sip++;
      const to = sip % 5 === 0 ? 38 + Math.random() * 12 : 78 + Math.random() * 19; // every 5th cup is empty
      gsap.to(g, { v: to, duration: 1.4, ease: 'elastic.out(1, 0.55)', onUpdate: render });
    },
    set(v) { g.v = v; render(); },
  };
}
