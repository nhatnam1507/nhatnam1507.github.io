// 00 // hero — name decodes from glyphs, a HUD locks onto the 3D core, and
// the terminal types whoami then hands the prompt to the visitor. The whole
// block drifts away as you scroll into the page.
import { defineBehaviour, type RuntimeContext } from '@/shell/contract';
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $$, $req } from '@/shared/dom';
import { createLoop, whileVisible } from '@/shared/motion';
import { scramble, typeTerminal } from '@/shared/text';
import { formatClock } from '@/shared/time';
import { hudSlots, terminalLines } from './content';
import { createHud, type Hud } from './widgets/hud';
import { createCommands, type ShellEffect } from './shell/commands';
import { createTerminal, type Terminal } from './shell/terminal';

/** What `mount` builds and `onReady` uses. */
interface HeroState {
  hud: Hud;
  terminal: Terminal;
}

let state: HeroState | null = null;

export default defineBehaviour({
  mount(root, ctx) {
    if (!root) return;
    const { signal } = ctx;

    gsap.to([$req('.container', root), $req('.js-hud', root)], {
      yPercent: -25,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
    });

    const hud = createHud(
      $req('.js-hud', root),
      ctx.scene,
      hudSlots(ctx.profile),
      $$('.hero-name .scramble, .hero-role > *, .term-hero, .cta > *', root),
    );
    hud.place();
    addEventListener('resize', hud.place, { signal });
    ScrollTrigger.addEventListener('refresh', hud.place);

    const clock = $req('.js-hero-clock', root);
    const tickClock = () => {
      clock.textContent = formatClock(new Date()).slice(0, 5);
    };
    tickClock();

    const terminal = createTerminal(
      {
        win: $req('.term-hero', root),
        body: $req('.js-term', root),
        log: $req('.js-typer', root),
        form: $req<HTMLFormElement>('.js-term-form', root),
        input: $req<HTMLInputElement>('.js-term-input', root),
      },
      createCommands({
        profile: ctx.profile,
        roles: ctx.roles,
        stats: ctx.stats,
        targets: ctx.navTargets,
        clock: () => formatClock(new Date()),
      }),
      (effect) => runEffect(effect, ctx),
      signal,
    );
    root.addEventListener(
      'click',
      (e) => {
        const btn = e.target instanceof Element ? e.target.closest<HTMLElement>('.js-try') : null;
        if (btn?.dataset.cmd) terminal.suggest(btn.dataset.cmd);
      },
      { signal },
    );

    const live = createLoop([
      [tickClock, 1000],
      [
        () => {
          if (!hud.hidden) hud.tick();
        },
        2400,
      ],
    ]);
    whileVisible(
      root,
      {
        onShow: () => {
          live.start();
          root.classList.add('is-live');
        },
        onHide: () => {
          live.stop();
          root.classList.remove('is-live');
        },
      },
      signal,
    );

    state = { hud, terminal };
    return () => {
      ScrollTrigger.removeEventListener('refresh', hud.place);
      if (state?.hud === hud) state = null;
    };
  },

  // after the boot screen lifts
  onReady(root, ctx) {
    if (!root || !state) return;
    const { hud, terminal } = state;

    const tl = gsap.timeline();
    $$('.hero-name .scramble', root).forEach((el, i) => {
      tl.from(el, { yPercent: 110, duration: 1.1, ease: 'expo.out' }, i * 0.12);
      if (!ctx.env.reducedMotion) tl.add(scramble(el, { duration: 1.2 }), i * 0.12);
    });
    tl.from($$('.reveal-hero', root), { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.3);
    tl.call(
      () => void typeTerminal($req('.js-typer', root), terminalLines(ctx), ctx.signal).then(terminal.ready),
      undefined,
      0.8,
    );

    if (hud.hidden) return;
    const { reticle, tags, status } = hud.parts();
    tl.from(reticle, { scale: 0.7, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.5)
      .from(tags, { opacity: 0, duration: 0.5, stagger: 0.12 }, 0.9)
      .add(() => $$('.js-hud-v', root).forEach((v, i) => scramble(v, { duration: 0.8, delay: i * 0.12 })), 0.9)
      .from(status, { opacity: 0, y: 8, duration: 0.6 }, 1.4);
  },
});

/** Terminal side effects go through the shell's services, never the DOM. */
function runEffect(effect: ShellEffect, ctx: RuntimeContext): void {
  if ('goto' in effect) ctx.services.navigate(effect.goto);
  else ctx.services.exportCv();
}
