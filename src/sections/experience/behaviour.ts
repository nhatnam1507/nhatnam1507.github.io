// 02 // experience: pinned career timeline. Scrolling moves a playhead
// through time, bars draw in behind it and the matching role card swaps in.
// Only transforms/classes are written per update, and only when they change.
import { formatMonth } from '@/domain/career';
import { $$, $req, pad2 } from '@/shared/dom';
import { MEDIA } from '@/shared/env';
import { gsap, ScrollTrigger } from '@/shared/lib';
import { defineBehaviour, type RuntimeContext } from '@/shell/contract';
import { timelineScale } from './timeline';

/** Desktop: scroll distance per role, as a fraction of the viewport height. */
const PIN_VIEWPORTS_PER_ROLE = 0.5;

export default defineBehaviour({
  mount(root: HTMLElement | null, ctx: RuntimeContext) {
    if (!root) return;
    const { roles } = ctx;
    const N = roles.length;
    const { pct, now } = timelineScale(roles, ctx.now);
    const rows = $$('.tl-row[data-i]', root);
    const bars = rows.map((r) => $req('.tl-bar', r));
    const playhead = $req('.tl-playhead', root);
    const dateEl = $req('.tl-date', root);
    const cards = $$('.role-card', root);
    const stepEl = $req('.js-exp-step', root);
    const timeline = $req('.js-timeline', root);
    const playheadAt = (month: number) => `translate3d(${pct(month)}%,0,0)`;

    // what is currently on screen, so the DOM is only written when it changes
    let active = -1;
    let lastDate = '';
    let lastPlayhead = '';
    let lastBars: string[] = [];
    // the mobile layout writes the same elements, so forget the caches when desktop (re)starts
    const forgetRendered = () => {
      active = -1;
      lastDate = '';
      lastPlayhead = '';
      lastBars = [];
    };

    const setActive = (i: number) => {
      if (i === active) return;
      active = i;
      rows.forEach((r, k) => {
        r.classList.toggle('is-active', k === i);
        r.classList.toggle('is-past', k < i);
      });
      cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
      stepEl.textContent = pad2(i + 1);
    };

    // p (0..1) → step through roles; within a step the playhead travels from
    // this role's start to the next one's (the last one runs to now)
    const render = (p: number) => {
      const step = Math.min(N - 1, Math.floor(p * N));
      const frac = Math.min(1, p * N - step);
      const current = roles[step];
      if (!current) return;
      const next = roles[step + 1];
      const from = current.start;
      const to = next ? next.start : now;
      const t = from + (to - from) * frac;

      const head = playheadAt(t);
      if (head !== lastPlayhead) {
        playhead.style.transform = head;
        lastPlayhead = head;
      }
      const label = formatMonth(Math.round(t));
      if (label !== lastDate) {
        dateEl.textContent = label;
        lastDate = label;
      }
      roles.forEach((r, k) => {
        const bar = bars[k];
        if (!bar) return;
        const fill = `scaleX(${Math.min(1, Math.max(0, (t - r.start) / Math.max(1, r.end - r.start)))})`;
        if (fill === lastBars[k]) return;
        bar.style.transform = fill;
        lastBars[k] = fill;
      });
      setActive(step);
    };

    const mm = gsap.matchMedia();
    mm.add(MEDIA.desktop, () => {
      root.classList.remove('is-static');
      const proxy = { p: 0 };
      forgetRendered();
      render(0);
      const tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => render(proxy.p),
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${innerHeight * N * PIN_VIEWPORTS_PER_ROLE}`,
          pin: true,
          scrub: ctx.env.reducedMotion ? true : 0.5,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.kill();
    });

    // phones: no pin, fully drawn chart, every role listed, animate on enter
    mm.add(MEDIA.mobile, () => {
      root.classList.add('is-static');
      playhead.style.transform = playheadAt(now);
      dateEl.textContent = 'now';
      if (ctx.env.reducedMotion) {
        gsap.set(bars, { scaleX: 1 });
      } else {
        gsap.fromTo(
          bars,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: timeline, start: 'top 85%' },
          },
        );
      }
      // cards animate via their CSS transition when they get .is-active
      cards.forEach((c) =>
        ScrollTrigger.create({ trigger: c, start: 'top 92%', once: true, onEnter: () => c.classList.add('is-active') }),
      );
    });

    return () => mm.revert();
  },
});
