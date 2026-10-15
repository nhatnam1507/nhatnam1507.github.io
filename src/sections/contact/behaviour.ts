// 05 // contact — the closing call to action, as an API: endpoints you can
// hit (the email one copies), a terminal that pings Nam, and a live Hanoi
// clock that says what he's probably doing right now.
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $$, $req } from '@/shared/dom';
import { createLoop, whileVisible } from '@/shared/motion';
import { typeTerminal } from '@/shared/text';
import { defineBehaviour } from '@/shell/contract';
import { handshake } from './content';
import { attachCopy } from './widgets/copy';
import { createPresenceClock } from './widgets/clock';

export default defineBehaviour({
  mount(root, ctx) {
    if (!root) return;
    const { signal } = ctx;

    $$('.js-copy', root).forEach((btn) => attachCopy(btn, ctx.services.toast, signal));

    const tick = createPresenceClock(root);
    tick();

    const hello = $req('.js-hello', root);
    hello.textContent = ''; // idempotent under StrictMode's second mount
    const lines = handshake(ctx.profile);
    if (ctx.env.reducedMotion) {
      hello.textContent = lines.map((l) => ('o' in l ? l.o : `${l.p}${l.t}`)).join('\n');
      return;
    }

    gsap.from($$('.contact-title .line > span', root), {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: $req('.contact-title', root), start: 'top 80%' },
    });
    gsap.from($$('.api, .term-contact', root), {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: $req('.contact-grid', root), start: 'top 85%' },
    });
    gsap.from($$('.ep', root), {
      opacity: 0,
      x: -24,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.1,
      delay: 0.25,
      scrollTrigger: { trigger: $req('.contact-grid', root), start: 'top 85%' },
    });
    ScrollTrigger.create({
      trigger: hello,
      start: 'top 85%',
      once: true,
      onEnter: () => void typeTerminal(hello, lines, signal),
    });

    const clock = createLoop([[tick, 1000]]);
    whileVisible(
      root,
      {
        onShow: () => {
          root.classList.add('is-live');
          clock.start();
          tick();
        },
        onHide: () => {
          root.classList.remove('is-live');
          clock.stop();
        },
      },
      signal,
    );
  },
});
