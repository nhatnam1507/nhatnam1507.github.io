import { esc } from '../../shared/dom.js';
import { exportButton, icon, kicker } from '../../shared/ui.js';

const links = ({ email, linkedin, github }) => [
  ['email', email, `mailto:${email}`],
  ['linkedin', linkedin, `https://www.${linkedin}`],
  ['github', github, `https://${github}`],
];

const link = ([k, v, href]) =>
  `<a class="contact-link" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><small>${k} ↗</small><span>${esc(v)}</span></a>`;

export const template = (ctx) => `
  <div class="container">
    ${kicker(ctx.index, 'contact')}
    <h2 class="contact-title">
      <span class="line"><span>Let’s build</span></span>
      <span class="line"><span class="grad">something solid.</span></span>
    </h2>
    <div class="contact-links">${links(ctx.profile.contact).map(link).join('')}</div>
    <div class="cta">
      ${exportButton({ size: 'lg' })}
      <a class="btn btn-ghost" href="cv.html" target="_blank" rel="noopener">
        <span>view print template</span>
        ${icon('arrowUpRight')}
      </a>
    </div>
  </div>`;
