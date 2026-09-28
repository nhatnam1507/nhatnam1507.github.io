// 04 // credentials — certificate cards that verify themselves as they enter
// (scan, `$ verify <id>`, ring fills, stamp lands), with a holographic tilt,
// then education and career drawn on one time axis.
import { defineSection } from '../../app/contract.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { whileVisible } from '../../shared/motion.js';
import { scramble } from '../../shared/text.js';
import { template } from './template.js';

const TILT_DEG = 16;
const VERIFY_S = 1.15; // matches the .cv-bar transition

function attachTilt(card) {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', `${(x - 0.5) * TILT_DEG}deg`);
    card.style.setProperty('--rx', `${(0.5 - y) * TILT_DEG}deg`);
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}

/** Scan → `$ verify` decodes the id and the bar fills → verified. Classes drive the CSS. */
function verify(card, delay) {
  gsap.delayedCall(delay, () => {
    card.classList.add('is-verifying');
    scramble($('.js-cert-id', card), { duration: VERIFY_S * 0.9 });
    gsap.delayedCall(VERIFY_S, () => card.classList.add('is-verified'));
  });
}

export default defineSection({
  id: 'credentials',
  label: 'certs',
  shape: 'knot',
  template,

  mount(root, ctx) {
    const cards = $$('.js-cert', root);
    const path = $('.js-path', root);
    if (ctx.env.finePointer) cards.forEach(attachTilt);

    if (ctx.env.reducedMotion) {
      cards.forEach((c) => c.classList.add('is-verified'));
      return;
    }

    // entrance animates the wrapper so it never fights the card's tilt transform
    gsap.from($$('.cert-wrap', root), {
      opacity: 0, y: 80, rotateX: -25, duration: 1.1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: $('.cert-grid', root), start: 'top 80%' },
    });
    // each card verifies once it's in view; side-by-side cards go one after another
    ScrollTrigger.batch(cards, {
      start: 'top 75%',
      once: true,
      onEnter: (batch) => batch.forEach((card, i) => verify(card, 0.45 + i * 0.35)),
    });

    const edu = $('.edu', root);
    gsap.from(edu, { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: edu, start: 'top 90%' } });
    // compile → deploy → runtime draws as you scroll
    gsap.fromTo(path, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: path, start: 'top 92%', end: 'top 45%', scrub: 0.6 } });

    whileVisible(root, {
      onShow: () => root.classList.add('is-live'),
      onHide: () => root.classList.remove('is-live'),
    });
  },
});
