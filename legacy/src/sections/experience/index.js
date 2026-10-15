// 02 // experience — pinned career timeline. Scrolling moves a playhead
// through time, bars draw in behind it and the matching role card swaps in.
// Only transforms/classes are written per update, and only when they change.
import { defineSection } from '../../app/contract.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$, pad2 } from '../../shared/dom.js';
import { MEDIA } from '../../shared/env.js';
import { formatMonth } from '../../domain/career.js';
import { template } from './template.js';
import { timelineScale } from './timeline.js';

export default defineSection({
  id: 'experience',
  label: 'experience',
  shape: 'lattice',
  template,

  mount(root, ctx) {
    const { roles } = ctx;
    const N = roles.length;
    const { pct, now } = timelineScale(roles, ctx.now);
    const rows = $$('.tl-row[data-i]', root);
    const bars = rows.map((r) => $('.tl-bar', r));
    const playhead = $('.tl-playhead', root);
    const dateEl = $('.tl-date', root);
    const cards = $$('.role-card', root);
    const stepEl = $('.js-exp-step', root);
    let active = -1;
    let lastDate = '';

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      rows.forEach((r, k) => { r.classList.toggle('is-active', k === i); r.classList.toggle('is-past', k < i); });
      cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
      stepEl.textContent = pad2(i + 1);
    };

    // p (0..1) → step through roles; within a step the playhead travels from
    // this role's start to the next one's (the last one runs to now)
    const render = (p) => {
      const step = Math.min(N - 1, Math.floor(p * N));
      const frac = Math.min(1, p * N - step);
      const from = roles[step].start;
      const to = step < N - 1 ? roles[step + 1].start : now;
      const t = from + (to - from) * frac;
      playhead.style.transform = `translate3d(${pct(t)}%,0,0)`;
      const label = formatMonth(Math.round(t));
      if (label !== lastDate) { dateEl.textContent = label; lastDate = label; }
      roles.forEach((r, k) => {
        bars[k].style.transform = `scaleX(${Math.min(1, Math.max(0, (t - r.start) / Math.max(1, r.end - r.start)))})`;
      });
      setActive(step);
    };

    const mm = gsap.matchMedia();
    mm.add(MEDIA.desktop, () => {
      root.classList.remove('is-static');
      const proxy = { p: 0 };
      render(0);
      const tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(proxy.p),
        scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${innerHeight * N * 0.5}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      });
      return () => tween.kill();
    });

    // phones: no pin — fully drawn chart, every role listed, animate on enter
    mm.add(MEDIA.mobile, () => {
      root.classList.add('is-static');
      playhead.style.transform = `translate3d(${pct(now)}%,0,0)`;
      dateEl.textContent = 'now';
      gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: $('.js-timeline', root), start: 'top 85%' } });
      // cards animate via their CSS transition when they get .is-active
      cards.forEach((c) => ScrollTrigger.create({ trigger: c, start: 'top 92%', once: true, onEnter: () => c.classList.add('is-active') }));
    });
  },
});
