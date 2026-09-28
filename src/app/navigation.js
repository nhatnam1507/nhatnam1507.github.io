// Top nav (generated from the registry) and in-page jumps.
//
// Jumps don't smooth-scroll through every pinned/scrubbed section in between
// (that replays all of them at once and stutters): a curtain wipes in, the
// page jumps underneath it, the 3D scene snaps, and the curtain wipes out.
import { gsap, ScrollTrigger } from '../shared/lib.js';
import { $, esc, pad2 } from '../shared/dom.js';
import { scrollRange } from '../shared/motion.js';

export function renderNav(el, sections) {
  el.innerHTML = sections
    .filter((s, i) => i > 0 && s.nav !== false)
    .map((s) => `<a href="#${s.id}" data-scroll-to><span>${pad2(sections.indexOf(s))}</span>${esc(s.navLabel || s.label)}</a>`)
    .join('');
}

export function attachJumps({ lenis, scene, reducedMotion }) {
  const curtain = $('.curtain');
  const cmd = $('.curtain-cmd');
  let busy = false;

  const jump = (target) => {
    const y = scrollRange(target).getBoundingClientRect().top + scrollY; // pin start for pinned sections
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
    scene?.snap();
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-scroll-to]');
    const target = a && $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (reducedMotion) { jump(target); return; }
    if (busy) return;
    busy = true;
    cmd.textContent = `cd ~/${target.id === 'hero' ? '' : target.id}`;
    gsap.timeline({ onComplete: () => { busy = false; } })
      .set(curtain, { visibility: 'visible', yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.38, ease: 'power3.in' })
      .call(() => jump(target))
      .to(curtain, { yPercent: -100, duration: 0.5, ease: 'power3.out', delay: 0.14 })
      .set(curtain, { visibility: 'hidden' });
  });
}

