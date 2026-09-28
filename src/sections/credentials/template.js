import { esc } from '../../shared/dom.js';
import { kicker } from '../../shared/ui.js';

const cert = (c) => `
  <div class="cert-wrap"><article class="cert" data-hover>
    <div class="cert-top"><span>${esc(c.issuer)}</span><span>${esc(c.date)}</span></div>
    <div class="cert-badge" style="margin-top:22px">${esc(c.badge)}</div>
    <h3>${esc(c.short)}</h3>
    <div class="cert-issuer">${esc(c.name)}</div>
    <div class="cert-id"><span>${c.issuer.startsWith('Amazon') ? 'validation' : 'score'}</span><b>${esc(c.id)}</b></div>
  </article></div>`;

const education = (e) => `
  <div>
    <div class="edu-k">education</div>
    <h3>${esc(e.school)}</h3>
    <p>${esc(e.degree)}</p>
  </div>
  <div class="edu-date">${esc(e.start)} — ${esc(e.end)}</div>`;

export const template = (ctx) => `
  <div class="container">
    ${kicker(ctx.index, 'credentials')}
    <h2 class="h2 split">Verified <span class="grad">&amp; certified</span>.</h2>
    <div class="cert-grid">${ctx.profile.certificates.map(cert).join('')}</div>
    <div class="edu">${education(ctx.profile.education[0])}</div>
  </div>`;
