import { esc } from '../../shared/dom.js';
import { kicker } from '../../shared/ui.js';
import { tenure } from '../../domain/career.js';
import { identicon, lifePath, sealFill, verifyResult } from './content.js';

const seal = (c) => `
  <div class="seal" style="--fill:${sealFill(c).toFixed(3)}">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="seal-orbit" cx="50" cy="50" r="49" />
      <circle class="seal-track" cx="50" cy="50" r="44" />
      <circle class="seal-ring" cx="50" cy="50" r="44" pathLength="1" />
      <circle class="seal-ticks" cx="50" cy="50" r="36" />
    </svg>
    <b>${esc(c.badge)}</b>
  </div>`;

const fingerprint = (id) =>
  `<div class="fp" aria-hidden="true">${identicon(id).map((on, i) => `<i${on ? ' class="on"' : ''} style="--i:${i}"></i>`).join('')}</div>`;

const cert = (c) => `
  <div class="cert-wrap"><article class="cert js-cert" data-hover>
    <div class="cert-top"><span>${esc(c.issuer)}</span><span>${esc(c.date)}</span></div>
    <div class="cert-mid">${seal(c)}<span class="cert-stamp" aria-hidden="true">verified</span>${fingerprint(c.id)}</div>
    <h3>${esc(c.short)}</h3>
    <div class="cert-issuer">${esc(c.name)}</div>
    <div class="cert-verify">
      <div class="cv-cmd"><span class="p">$</span> verify <b class="js-cert-id" data-text="${esc(c.id)}">${esc(c.id)}</b></div>
      <div class="cv-bar"><i></i></div>
      <div class="cv-out"><span class="cv-wait">awaiting check…</span><span class="cv-ok">✓ ${esc(verifyResult(c))}</span></div>
    </div>
  </article></div>`;

const education = (ctx) => {
  const e = ctx.profile.education[0];
  const path = lifePath(ctx.profile, ctx.now);
  const { graduated, deployed } = path.stops;
  return `
    <div class="edu-head">
      <div>
        <div class="edu-k">education · the build that started it</div>
        <h3>${esc(e.school)}</h3>
        <p>${esc(e.degree)}</p>
      </div>
      <div class="edu-date">${esc(e.start)} — ${esc(e.end)}</div>
    </div>
    <div class="path js-path" style="--g:${graduated.toFixed(2)}%;--d:${deployed.toFixed(2)}%">
      <div class="path-years" aria-hidden="true">${path.years.map((y) => `<span style="left:${y.at.toFixed(2)}%">${y.year}</span>`).join('')}</div>
      <div class="path-track">
        <div class="path-reveal js-path-reveal">
          <i class="seg seg-study"></i><i class="seg seg-gap"></i><i class="seg seg-career"></i>
          <span class="stop" style="left:0"></span><span class="stop" style="left:var(--g)"></span><span class="stop" style="left:var(--d)"></span>
        </div>
        <span class="path-head" aria-hidden="true"></span>
      </div>
      <ol class="path-legend">
        <li class="lg-study"><b>compile</b> <span>degree · ${tenure(path.months.study)} · 0 warnings</span></li>
        <li class="lg-gap"><b>deploy</b> <span>first job in ${tenure(path.months.gap)}</span></li>
        <li class="lg-career"><b>runtime</b> <span>${tenure(path.months.career)} in production · still up</span></li>
      </ol>
    </div>`;
};

export const template = (ctx) => `
  <div class="container">
    ${kicker(ctx.index, 'credentials')}
    <h2 class="h2 split">Verified <span class="grad">&amp; certified</span>.</h2>
    <div class="cert-grid">${ctx.profile.certificates.map(cert).join('')}</div>
    <div class="edu">${education(ctx)}</div>
  </div>`;
