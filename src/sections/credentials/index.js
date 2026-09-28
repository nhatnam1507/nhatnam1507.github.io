// 04 // credentials — certificate cards with a holographic 3D tilt.
import { defineSection } from '../../app/contract.js';
import { gsap } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { template } from './template.js';

const TILT_DEG = 16;

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

export default defineSection({
  id: 'credentials',
  label: 'certs',
  shape: 'knot',
  template,

  mount(root, ctx) {
    // entrance animates the wrapper so it never fights the card's tilt transform
    gsap.from($$('.cert-wrap', root), {
      opacity: 0, y: 80, rotateX: -25, duration: 1.1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: $('.cert-grid', root), start: 'top 80%' },
    });
    const edu = $('.edu', root);
    gsap.from(edu, { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: edu, start: 'top 90%' } });
    if (ctx.env.finePointer) $$('.cert', root).forEach(attachTilt);
  },
});
