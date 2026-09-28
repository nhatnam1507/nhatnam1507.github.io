// Scroll/animation building blocks shared by the pinned "scene" sections.
import { ScrollTrigger } from './lib.js';
import { isDesktop, NAV_HEIGHT } from './env.js';

/**
 * The element whose box spans a section's whole scroll range: its
 * pin-spacer when pinned (taller than the section), else the section itself.
 */
export const scrollRange = (section) =>
  section.parentElement?.classList.contains('pin-spacer') ? section.parentElement : section;

/** A group of intervals started and stopped together. */
export function createLoop(tasks) {
  let timers = [];
  return {
    get running() { return timers.length > 0; },
    start() {
      if (timers.length) return;
      timers = tasks.map(([fn, ms]) => setInterval(fn, ms));
    },
    stop() {
      timers.forEach(clearInterval);
      timers = [];
    },
  };
}

/**
 * Run `onShow` / `onHide` as the section scrolls in and out of view (and when
 * the tab is hidden). Call it after the section's pin is created so the range
 * includes the pinned scroll.
 */
export function whileVisible(section, { onShow, onHide }) {
  const range = scrollRange(section);
  ScrollTrigger.create({ trigger: range, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? onShow() : onHide()) });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onHide();
    else if (ScrollTrigger.isInViewport(range)) onShow();
  });
}

/**
 * Scale `el` (via its `--fit` custom property) so it fits one screen below the
 * nav on desktop. Optionally top-align `section` when scaled down, because the
 * scale origin is the top edge. Returns the fit function to re-run on refresh.
 */
export function fitToViewport(el, { reserve = 28, section = null } = {}) {
  return () => {
    el.style.setProperty('--fit', '1');
    if (section) section.style.alignItems = '';
    if (!isDesktop()) return;
    const scale = Math.min(1, (innerHeight - NAV_HEIGHT - reserve) / el.offsetHeight);
    el.style.setProperty('--fit', scale.toFixed(3));
    if (section && scale < 1) section.style.alignItems = 'flex-start';
  };
}
