// Page-wide entrance effects shared by every section: kickers slide in and
// `.split` headings rise word by word.
// GSAP-only, so the runtime's gsap.context reverts every tween and
// ScrollTrigger on teardown.
import { gsap } from '@/shared/lib';
import { $$ } from '@/shared/dom';
import { splitWords } from '@/shared/text';

/** Split a heading into words once: StrictMode runs this twice, and the DOM edit outlives the context revert. */
function wordsOf(el: HTMLElement): HTMLElement[] {
  if (el.dataset.wordsSplit) return $$('.w > span', el);
  el.dataset.wordsSplit = '1';
  return splitWords(el);
}

/** Kickers slide in and `.split` headings rise word by word. */
export function attachReveals(): void {
  $$('.split').forEach((el) => {
    gsap.from(wordsOf(el), {
      yPercent: 110,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
  $$('.kicker').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      x: -20,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
}

/** Fade the fixed chrome in once the boot screen has gone. */
export function chromeIntro(): void {
  gsap
    .timeline()
    .from('.nav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
    .from('.hud', { opacity: 0, duration: 1 }, 0.6);
}
