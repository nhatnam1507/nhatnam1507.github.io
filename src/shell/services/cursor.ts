// Custom cursor ring. Grows over links, buttons and anything with [data-hover]
// (ported from legacy/src/app/cursor.js).
import { gsap } from '@/shared/lib';
import { $req } from '@/shared/dom';
import type { Env } from '@/shared/env';

/** Grows over `a, button, [data-hover]`. Hidden (not removed) without a fine pointer or with reduced motion. */
export function attachCursor({ finePointer, reducedMotion }: Env, signal: AbortSignal): void {
  const c = $req('.cursor');
  c.hidden = !finePointer || reducedMotion; // React owns the node: hide, never remove
  if (c.hidden) return;

  const setX = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const setY = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener(
    'pointermove',
    (e) => {
      setX(e.clientX);
      setY(e.clientY);
      c.classList.add('is-visible');
    },
    { signal },
  );
  document.addEventListener('pointerleave', () => c.classList.remove('is-visible'), { signal });
  document.addEventListener(
    'pointerover',
    (e) => {
      c.classList.toggle('is-hover', e.target instanceof Element && !!e.target.closest('a, button, [data-hover]'));
    },
    { signal },
  );
}
