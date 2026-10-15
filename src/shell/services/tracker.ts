// Scroll tracking → 3D scene progress, HUD and nav state (ported from
// legacy/src/app/tracker.js).
// Section offsets are measured once per ScrollTrigger refresh (pinned
// sections via their pin-spacer), so per-frame work is arithmetic on scrollY
// with no layout reads, and the DOM is only written when a value changes.
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $$, $req, pad2 } from '@/shared/dom';
import { scrollRange } from '@/shared/motion';
import type { SceneHandle, SectionMeta } from '../contract';
import { onAbort } from './abort';
import { coordsLabel, fpsLabel, percentLabel, pointerToNdc, scrollFraction, trackScroll } from './tracker-math';

export interface TrackerOptions {
  sections: readonly SectionMeta[];
  scene: SceneHandle | null;
  signal: AbortSignal;
}

export function startTracker({ sections, scene, signal }: TrackerOptions): void {
  const els = sections.map((s) => $req(`#${s.id}`));
  const nav = $req('.nav');
  const navLinks = $$<HTMLAnchorElement>('.nav-links a');
  const hud = {
    num: $req('.hud-num'),
    label: $req('.hud-label'),
    fill: $req('.hud-fill'),
    pct: $req('.hud-pct'),
    shape: $req('.hud-shape'),
    coords: $req('.hud-coords'),
    fps: $req('.hud-fps'),
  };

  let tops: number[] = [];
  let maxScroll = 1;
  const measure = () => {
    tops = els.map((el) => scrollRange(el).getBoundingClientRect().top + scrollY);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  };
  ScrollTrigger.addEventListener('refresh', measure);
  onAbort(signal, () => ScrollTrigger.removeEventListener('refresh', measure));
  measure();

  let coordsDirty = false;
  let px = 0;
  let py = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      ({ x: px, y: py } = pointerToNdc(e.clientX, e.clientY, innerWidth, innerHeight));
      coordsDirty = true;
    },
    { signal },
  );

  let active = -1;
  let lastPct = -1;
  let scrolled: boolean | null = null;
  let frames = 0;
  let last = performance.now();
  const tick = () => {
    const y = scrollY;
    const { progress, current } = trackScroll(tops, y, innerHeight);
    scene?.setProgress(progress);

    const sec = sections[current];
    if (sec && current !== active) {
      active = current;
      hud.num.textContent = pad2(active);
      hud.label.textContent = sec.label;
      hud.shape.textContent = `mesh: ${sec.shape}`;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${sec.id}`));
    }

    const p = scrollFraction(y, maxScroll);
    if (p !== lastPct) {
      lastPct = p;
      hud.fill.style.transform = `scaleY(${p})`;
      hud.pct.textContent = percentLabel(p);
    }
    const sc = y > 40;
    if (sc !== scrolled) {
      scrolled = sc;
      nav.classList.toggle('is-scrolled', sc);
    }

    if (coordsDirty) {
      coordsDirty = false;
      hud.coords.textContent = coordsLabel(px, py);
    }

    frames++;
    const now = performance.now();
    if (now - last > 500) {
      hud.fps.textContent = fpsLabel(frames, now - last);
      frames = 0;
      last = now;
    }
  };
  gsap.ticker.add(tick);
  onAbort(signal, () => gsap.ticker.remove(tick));
}
