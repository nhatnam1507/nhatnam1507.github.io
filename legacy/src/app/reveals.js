// Page-wide entrance effects shared by every section: kickers slide in and
// `.split` headings rise word by word.
import { gsap } from '../shared/lib.js';
import { $$ } from '../shared/dom.js';
import { splitWords } from '../shared/text.js';

export function attachReveals() {
  $$('.split').forEach((el) => {
    gsap.from(splitWords(el), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.kicker').forEach((el) => {
    gsap.from(el, { opacity: 0, x: -20, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
}

/** Fade the fixed chrome in once the boot screen has gone. */
export function chromeIntro() {
  gsap.timeline()
    .from('.nav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
    .from('.hud', { opacity: 0, duration: 1 }, 0.6);
}
