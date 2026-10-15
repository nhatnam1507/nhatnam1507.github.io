// Boot screen: a few fake systemd lines, then it slides away. Click to skip.
import { gsap } from '@/shared/lib';
import { $req, esc } from '@/shared/dom';
import type { Env } from '@/shared/env';
import { onAbort } from '@/shared/abort';
import { BOOT_LINES, FINISH_DELAY, RESOLVE_DELAY, barPercent, lineDelay } from './boot-script';

/**
 * Resolves once the page underneath should start its intro. Never remove
 * #boot (React owns it): hide it. If `signal` aborts first, the timers and the
 * slide-away stop, #boot is restored, and the promise never settles: a torn
 * down page has no intro to start.
 */
export function boot({ reducedMotion }: Env, signal: AbortSignal): Promise<void> {
  const el = $req('#boot');
  if (reducedMotion) {
    el.hidden = true;
    return Promise.resolve();
  }
  el.hidden = false;
  document.body.classList.add('is-booting');
  const log = $req('.boot-log', el);
  const bar = $req('.boot-bar span', el);
  log.textContent = '';
  bar.style.width = '0';

  return new Promise((resolve) => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    let slide: gsap.core.Tween | undefined;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      slide = gsap.to(el, {
        yPercent: -100,
        duration: 0.9,
        ease: 'expo.inOut',
        onComplete: () => {
          el.hidden = true;
          document.body.classList.remove('is-booting');
        },
      });
      later(resolve, RESOLVE_DELAY);
    };

    el.addEventListener('click', finish, { signal });
    BOOT_LINES.forEach(([cls, tag, text], i) => {
      later(() => {
        log.insertAdjacentHTML('beforeend', `<span class="${cls}">${tag}</span>${esc(text)}\n`);
        bar.style.width = `${barPercent(i)}%`;
        if (i === BOOT_LINES.length - 1) later(finish, FINISH_DELAY);
      }, lineDelay(i));
    });

    onAbort(signal, () => {
      timers.forEach(clearTimeout);
      timers.clear();
      slide?.revert(); // a tween made from a timer is outside the runtime's gsap.context
      el.hidden = false;
      document.body.classList.remove('is-booting');
    });
  });
}
