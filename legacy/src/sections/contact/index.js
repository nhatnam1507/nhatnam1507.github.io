// 05 // contact — the closing call to action, as an API: endpoints you can
// hit (the email one copies), a terminal that pings Nam, and a live Hanoi
// clock that says what he's probably doing right now.
import { defineSection } from '../../app/contract.js';
import { showToast } from '../../app/toast.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { createLoop, whileVisible } from '../../shared/motion.js';
import { typeTerminal } from '../../shared/text.js';
import { formatClock, hourIn } from '../../shared/time.js';
import { template } from './template.js';
import { handshake, presence } from './content.js';

const COPIED_MS = 1600;

function attachCopy(btn) {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'copied ✓';
      btn.classList.add('is-done');
      showToast(`<b>✓</b> ${btn.dataset.copy} copied`);
      setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('is-done'); }, COPIED_MS);
    } catch {
      location.href = `mailto:${btn.dataset.copy}`; // no clipboard access: fall back to the mail client
    }
  });
}

export default defineSection({
  id: 'contact',
  label: 'contact',
  shape: 'portal',
  template,

  mount(root, ctx) {
    $$('.js-copy', root).forEach(attachCopy);

    const local = $('.js-local', root);
    const moodIcon = $('.js-mood-i', root);
    const mood = $('.js-mood', root);
    let hour = -1;
    const tick = () => {
      const now = new Date();
      local.textContent = formatClock(now);
      const h = hourIn(now);
      if (h === hour) return;
      hour = h;
      const p = presence(h);
      moodIcon.textContent = p.icon;
      mood.textContent = p.text;
    };
    tick();

    const hello = $('.js-hello', root);
    const lines = handshake(ctx.profile);
    if (ctx.env.reducedMotion) {
      hello.innerHTML = lines.map((l) => (l.o !== undefined ? l.o : `${l.p}${l.t}`)).join('\n');
      return;
    }

    gsap.from($$('.contact-title .line > span', root), {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: $('.contact-title', root), start: 'top 80%' },
    });
    gsap.from($$('.api, .term-contact', root), {
      opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: $('.contact-grid', root), start: 'top 85%' },
    });
    gsap.from($$('.ep', root), {
      opacity: 0, x: -24, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.25,
      scrollTrigger: { trigger: $('.contact-grid', root), start: 'top 85%' },
    });
    ScrollTrigger.create({ trigger: hello, start: 'top 85%', once: true, onEnter: () => typeTerminal(hello, lines) });

    const clock = createLoop([[tick, 1000]]);
    whileVisible(root, {
      onShow: () => { root.classList.add('is-live'); clock.start(); tick(); },
      onHide: () => { root.classList.remove('is-live'); clock.stop(); },
    });
  },
});
