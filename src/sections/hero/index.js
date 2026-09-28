// 00 // hero — name decodes from glyphs, a terminal types whoami, and the
// whole block drifts away as you scroll into the page.
import { defineSection } from '../../app/contract.js';
import { gsap } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { scramble, typeTerminal } from '../../shared/text.js';
import { template, terminalLines } from './template.js';

export default defineSection({
  id: 'hero',
  label: 'init',
  shape: 'core',
  nav: false,
  template,

  mount(root) {
    gsap.to($('.container', root), {
      yPercent: -25, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });
  },

  // after the boot screen lifts
  onReady(root, ctx) {
    const tl = gsap.timeline();
    $$('.hero-name .scramble', root).forEach((el, i) => {
      tl.from(el, { yPercent: 110, duration: 1.1, ease: 'expo.out' }, i * 0.12);
      if (!ctx.env.reducedMotion) tl.add(scramble(el, { duration: 1.2 }), i * 0.12);
    });
    tl.from($$('.reveal-hero', root), { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.3);
    tl.call(() => typeTerminal($('.js-typer', root), terminalLines(ctx)), null, 0.8);
  },
});
