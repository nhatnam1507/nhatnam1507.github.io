// 00 // hero — name decodes from glyphs, a HUD locks onto the 3D core, and
// the terminal types whoami then hands the prompt to the visitor. The whole
// block drifts away as you scroll into the page.
import { defineSection } from '../../app/contract.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { createLoop, whileVisible } from '../../shared/motion.js';
import { scramble, typeTerminal } from '../../shared/text.js';
import { formatClock } from '../../shared/time.js';
import { template, terminalLines } from './template.js';
import { hudSlots } from './content.js';
import { createHud } from './widgets/hud.js';
import { createCommands } from './shell/commands.js';
import { createTerminal } from './shell/terminal.js';

let hud;
let terminal;

export default defineSection({
  id: 'hero',
  label: 'init',
  shape: 'core',
  nav: false,
  template,

  mount(root, ctx) {
    gsap.to([$('.container', root), $('.js-hud', root)], {
      yPercent: -25, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });

    hud = createHud($('.js-hud', root), ctx.scene, hudSlots(ctx.profile), $$('.hero-name .scramble, .hero-role > *, .term-hero, .cta > *', root));
    hud.place();
    addEventListener('resize', hud.place);
    ScrollTrigger.addEventListener('refresh', hud.place);

    const clock = $('.js-hero-clock', root);
    const tickClock = () => { clock.textContent = formatClock(new Date()).slice(0, 5); };
    tickClock();

    const commands = createCommands({
      ...ctx,
      targets: $$('.nav-links a[href^="#"]').map((a) => a.hash.slice(1)),
      clock: () => formatClock(new Date()),
    });
    terminal = createTerminal({
      win: $('.term-hero', root), body: $('.js-term', root), log: $('.js-typer', root), form: $('.js-term-form', root), input: $('.js-term-input', root),
    }, commands, (effect) => {
      if (effect.goto) $(`.nav-links a[href="#${effect.goto}"]`)?.click(); // the nav's curtain jump
      if (effect.export) $('.js-export')?.click();
    });
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.js-try');
      if (btn) terminal.suggest(btn.dataset.cmd);
    });

    const live = createLoop([[tickClock, 1000], [() => { if (!hud.hidden) hud.tick(); }, 2400]]);
    whileVisible(root, {
      onShow: () => { live.start(); root.classList.add('is-live'); },
      onHide: () => { live.stop(); root.classList.remove('is-live'); },
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
    tl.call(() => typeTerminal($('.js-typer', root), terminalLines(ctx)).then(terminal.ready), null, 0.8);

    if (hud.hidden) return;
    const { reticle, tags, status } = hud.parts();
    tl.from(reticle, { scale: 0.7, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.5)
      .from(tags, { opacity: 0, duration: 0.5, stagger: 0.12 }, 0.9)
      .add(() => $$('.js-hud-v', root).forEach((v, i) => scramble(v, { duration: 0.8, delay: i * 0.12 })), 0.9)
      .from(status, { opacity: 0, y: 8, duration: 0.6 }, 1.4);
  },
});
