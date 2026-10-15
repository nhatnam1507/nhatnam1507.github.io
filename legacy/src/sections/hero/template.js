import { esc } from '../../shared/dom.js';
import { exportButton, icon } from '../../shared/ui.js';
import { SUGGESTIONS, hudSlots } from './content.js';

const hud = (profile) => `
  <div class="hud-core js-hud" aria-hidden="true" hidden>
    <div class="hud-reticle">
      <i class="hr hr-1"></i><i class="hr hr-2"></i><i class="hr hr-3"></i>
      <b class="hc hc-tl"></b><b class="hc hc-tr"></b><b class="hc hc-bl"></b><b class="hc hc-br"></b>
    </div>
    ${hudSlots(profile).map((s) => `
      <div class="hud-tag"><i class="hud-lead"></i><span class="hud-k">${s.label}</span><span class="hud-v js-hud-v">${esc(s.items[0])}</span></div>`).join('')}
    <div class="hud-status">◎ nam.core · lock acquired</div>
  </div>`;

export const template = ({ profile }) => `
  ${hud(profile)}
  <div class="container">
    <p class="eyebrow reveal-hero">
      <span class="pulse"></span> online · Hanoi <b class="js-hero-clock">--:--</b> · UTC+7
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

    <div class="term term-hero reveal-hero">
      <div class="term-bar"><i></i><i></i><i></i><span>zsh — ~/nam · interactive</span></div>
      <div class="term-body js-term" data-lenis-prevent>
        <code class="js-typer" aria-live="polite"></code>
        <form class="term-line js-term-form" hidden>
          <label class="p" for="hero-cmd">$</label>
          <input id="hero-cmd" class="js-term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" placeholder="type help, press enter" />
        </form>
      </div>
      <div class="term-try">
        <span>try</span>
        ${SUGGESTIONS.map((c) => `<button type="button" class="js-try" data-cmd="${c}">${c}</button>`).join('')}
      </div>
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
