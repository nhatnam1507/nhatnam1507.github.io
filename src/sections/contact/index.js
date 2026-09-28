// 05 // contact — closing call to action.
import { defineSection } from '../../app/contract.js';
import { gsap } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { template } from './template.js';

export default defineSection({
  id: 'contact',
  label: 'contact',
  shape: 'portal',
  template,

  mount(root) {
    gsap.from($$('.contact-title .line > span', root), {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: $('.contact-title', root), start: 'top 80%' },
    });
    gsap.from($$('.contact-link', root), {
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: $('.contact-links', root), start: 'top 88%' },
    });
  },
});
