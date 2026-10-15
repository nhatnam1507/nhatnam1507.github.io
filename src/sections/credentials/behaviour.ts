// Credentials behaviour (was mount() in legacy/src/sections/credentials/index.js):
// each card verifies itself once it scrolls into view (scan → `$ verify <id>`
// decodes, the bar and ring fill, the stamp lands), with a holographic tilt.
// Classes drive the CSS; GSAP only animates the `.cert-wrap` wrappers so it
// never fights the card's CSS transition on transform.
import { defineBehaviour } from '@/shell/contract';
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $$, $req } from '@/shared/dom';
import { whileVisible } from '@/shared/motion';
import { scramble } from '@/shared/text';

const TILT_DEG = 16;
const VERIFY_S = 1.15; // matches the .cv-bar transition

/** Pointer position over the card → CSS variables for the CSS-driven 3D tilt and sheen. */
function attachTilt(card: HTMLElement, signal: AbortSignal): void {
  card.addEventListener(
    'pointermove',
    (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${(x - 0.5) * TILT_DEG}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * TILT_DEG}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    },
    { signal },
  );
  card.addEventListener(
    'pointerleave',
    () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    },
    { signal },
  );
}

/** Scan → `$ verify` decodes the id and the bar fills → verified. Started tweens are added to `pending`. */
function verify(card: Element, delay: number, pending: gsap.core.Tween[]): void {
  pending.push(
    gsap.delayedCall(delay, () => {
      card.classList.add('is-verifying');
      pending.push(scramble($req('.js-cert-id', card), { duration: VERIFY_S * 0.9 }));
      pending.push(gsap.delayedCall(VERIFY_S, () => card.classList.add('is-verified')));
    }),
  );
}

export default defineBehaviour({
  mount(root, ctx) {
    if (!root) return;
    const cards = $$('.js-cert', root);
    if (ctx.env.finePointer) cards.forEach((card) => attachTilt(card, ctx.signal));

    // the View's DOM outlives a StrictMode remount, so undo what the classes and scramble changed
    const reset = (): void => {
      cards.forEach((c) => c.classList.remove('is-verifying', 'is-verified'));
      $$('.js-cert-id', root).forEach((el) => (el.textContent = el.dataset.text ?? ''));
    };

    if (ctx.env.reducedMotion) {
      cards.forEach((c) => c.classList.add('is-verified'));
      return reset;
    }

    // entrance animates the wrapper so it never fights the card's tilt transform
    gsap.from($$('.cert-wrap', root), {
      opacity: 0,
      y: 80,
      rotateX: -25,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: $req('.cert-grid', root), start: 'top 80%' },
    });
    // each card verifies once it's in view; side-by-side cards go one after another
    const pending: gsap.core.Tween[] = [];
    ScrollTrigger.batch(cards, {
      start: 'top 75%',
      once: true,
      onEnter: (batch) => batch.forEach((card, i) => verify(card, 0.45 + i * 0.35, pending)),
    });

    const edu = $req('.edu', root);
    gsap.from(edu, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: edu, start: 'top 90%' },
    });
    // compile → deploy → runtime draws as you scroll
    const path = $req('.js-path', root);
    gsap.fromTo(
      path,
      { '--p': 0 },
      { '--p': 1, ease: 'none', scrollTrigger: { trigger: path, start: 'top 92%', end: 'top 45%', scrub: 0.6 } },
    );

    whileVisible(
      root,
      { onShow: () => root.classList.add('is-live'), onHide: () => root.classList.remove('is-live') },
      ctx.signal,
    );

    // tweens started from scroll callbacks fall outside the runtime's gsap.context, so kill them here
    return () => {
      pending.forEach((t) => t.kill());
      reset();
    };
  },
});
