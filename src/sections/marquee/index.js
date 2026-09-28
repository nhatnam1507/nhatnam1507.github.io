// Decorative strip of every skill, scrolling sideways (CSS animation).
import { defineSection } from '../../app/contract.js';
import { esc } from '../../shared/dom.js';
import { allSkills } from '../../domain/career.js';

export default defineSection({
  id: 'marquee',
  kind: 'strip',
  template: ({ profile }) => {
    const row = allSkills(profile).map((s) => `<span>${esc(s)}</span><i>✦</i>`).join('');
    // the row is doubled so the -50% keyframe loops seamlessly
    return `<div class="marquee" aria-hidden="true"><div class="marquee-inner">${row}${row}</div></div>`;
  },
});
