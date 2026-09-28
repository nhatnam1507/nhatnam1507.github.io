import { esc } from '../../shared/dom.js';
import { exportButton, icon } from '../../shared/ui.js';

export const template = ({ profile }) => `
  <div class="container">
    <p class="eyebrow reveal-hero">
      <span class="pulse"></span> online · Hanoi, VN · UTC+7
    </p>
    <h1 class="hero-name">
      <span class="line"><span class="scramble" data-text="NAM">NAM</span></span>
      <span class="line line-sm"><span class="scramble outline" data-text="NGUYEN NHAT">NGUYEN NHAT</span></span>
    </h1>
    <p class="hero-role reveal-hero">
      <span class="tag">${esc(profile.title)}</span>
      <span class="role-sep">//</span>
      <span class="muted">${esc(profile.tagline)}</span>
    </p>

    <div class="term term-hero reveal-hero" role="img" aria-label="Terminal: whoami">
      <div class="term-bar"><i></i><i></i><i></i><span>zsh — ~/nam</span></div>
      <pre class="term-body"><code class="js-typer"></code></pre>
    </div>

    <div class="cta reveal-hero">
      ${exportButton()}
      <a class="btn btn-ghost" href="#experience" data-scroll-to>
        <span>git log --graph</span>
        ${icon('arrowRight')}
      </a>
    </div>
  </div>
  <div class="scroll-hint" aria-hidden="true"><span>scroll</span><i></i></div>`;

/** The whoami session typed into the hero terminal. */
export const terminalLines = ({ stats }) => [
  { p: '$ ', t: 'whoami' },
  { o: 'nam — ships Go services, Kubernetes clusters & CI/CD pipelines' },
  { p: '$ ', t: 'uptime --career' },
  { o: `${stats.years} years · ${stats.employers} companies · ${stats.roles} roles · still shipping` },
];
