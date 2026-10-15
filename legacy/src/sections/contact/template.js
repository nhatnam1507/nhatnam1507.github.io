import { esc } from '../../shared/dom.js';
import { exportButton, icon, kicker } from '../../shared/ui.js';
import { endpoints } from './content.js';

const endpoint = (e) => `
  <div class="ep" data-hover>
    <a class="ep-link" href="${e.href}" ${e.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
      <span class="ep-m ep-${e.method.toLowerCase()}">${e.method}</span>
      <span class="ep-path">${e.path}</span>
      <span class="ep-v">${esc(e.value)}</span>
      <span class="ep-s">${e.status}</span>
    </a>
    ${e.copy ? `<button class="ep-copy js-copy" type="button" data-copy="${esc(e.value)}" aria-label="Copy ${esc(e.value)}">copy</button>` : `<span class="ep-go" aria-hidden="true">${icon('arrowUpRight')}</span>`}
  </div>`;

export const template = (ctx) => `
  <div class="container">
    ${kicker(ctx.index, 'contact')}
    <h2 class="contact-title">
      <span class="line"><span>Let’s build</span></span>
      <span class="line"><span class="grad">something solid.</span></span>
    </h2>
    <div class="contact-grid">
      <div class="api">
        <div class="api-head"><span>nam.api</span><em>v${ctx.now.getFullYear()} · base url: Ha Noi, VN</em></div>
        ${endpoints(ctx.profile.contact).map(endpoint).join('')}
      </div>
      <div class="term term-contact" role="img" aria-label="Terminal: ping nam">
        <div class="term-bar"><i></i><i></i><i></i><span>zsh — ~/say-hello</span></div>
        <pre class="term-body"><code class="js-hello"></code></pre>
        <div class="presence">
          <span class="presence-dot" aria-hidden="true"><i></i></span>
          <span>Hanoi <b class="js-local">--:--:--</b> · UTC+7</span>
          <span class="presence-now"><span class="js-mood-i"></span> <span class="js-mood"></span></span>
        </div>
      </div>
    </div>
    <div class="cta">
      ${exportButton({ size: 'lg' })}
      <a class="btn btn-ghost" href="cv.html" target="_blank" rel="noopener">
        <span>view print template</span>
        ${icon('arrowUpRight')}
      </a>
    </div>
  </div>`;
