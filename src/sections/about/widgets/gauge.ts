// caffeine.level gauge: an elastic needle that occasionally drops to
// "refill needed" before bouncing back.
import { gsap } from '@/shared/lib';

export const stateOf = (v: number): string => (v >= 80 ? 'nominal' : v >= 55 ? 'degraded' : 'refill needed ☕');

/** The level the needle settles on for the nth sip. `rand` is in 0‥1. */
export const nextLevel = (sip: number, rand: number): number => (sip % 5 === 0 ? 38 + rand * 12 : 78 + rand * 19); // every 5th cup is empty

export interface GaugeParts {
  arc: SVGElement;
  needle: SVGElement;
  value: HTMLElement;
  state: HTMLElement;
}

export interface Gauge {
  tick(): void;
  set(v: number): void;
  /** stop any in-flight tween (teardown) */
  kill(): void;
}

export function createGauge({ arc, needle, value, state }: GaugeParts): Gauge {
  const g = { v: 0 };
  let sip = 0;
  const render = () => {
    arc.style.strokeDashoffset = String(1 - g.v / 100);
    needle.style.transform = `rotate(${-90 + g.v * 1.8}deg)`;
    value.textContent = String(Math.round(g.v));
    const s = stateOf(g.v);
    if (state.textContent !== s) {
      state.textContent = s;
      state.dataset.state = s.split(' ')[0];
    }
  };
  return {
    tick() {
      sip++;
      gsap.to(g, { v: nextLevel(sip, Math.random()), duration: 1.4, ease: 'elastic.out(1, 0.55)', onUpdate: render });
    },
    set(v) {
      g.v = v;
      render();
    },
    kill() {
      gsap.killTweensOf(g);
    },
  };
}
