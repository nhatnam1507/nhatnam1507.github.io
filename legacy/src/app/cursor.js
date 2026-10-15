// Custom cursor ring. Grows over links, buttons and anything with [data-hover].
import { gsap } from '../shared/lib.js';
import { $ } from '../shared/dom.js';

export function attachCursor({ finePointer, reducedMotion }) {
  const c = $('.cursor');
  if (!finePointer || reducedMotion) { c.remove(); return; }
  const setX = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const setY = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    setX(e.clientX); setY(e.clientY);
    c.classList.add('is-visible');
  });
  document.addEventListener('pointerleave', () => c.classList.remove('is-visible'));
  document.addEventListener('pointerover', (e) => {
    c.classList.toggle('is-hover', !!e.target.closest('a, button, [data-hover]'));
  });
}
