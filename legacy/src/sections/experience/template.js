import { esc, pad2 } from '../../shared/dom.js';
import { kicker } from '../../shared/ui.js';
import { shortHash } from '../../shared/random.js';
import { tenure } from '../../domain/career.js';
import { EMPLOYER_COLORS, colorOf } from './content.js';
import { timelineScale } from './timeline.js';

const RING = 2 * Math.PI * 30;

const row = (r, i, { pct }) => `
  <div class="tl-row" style="--c:${colorOf(r.employer)}" data-i="${i}">
    <div class="tl-label"><i></i>${esc(r.label)}</div>
    <div class="tl-lane">
      <span class="tl-ghost" style="left:${pct(r.start)}%;width:${pct(r.end) - pct(r.start)}%"></span>
      <span class="tl-bar" style="left:${pct(r.start)}%;width:${pct(r.end) - pct(r.start)}%"></span>
      <span class="tl-dot" style="left:${pct(r.start)}%"></span>
    </div>
  </div>`;

const card = (r, isHead) => `
  <article class="role-card" style="--c:${colorOf(r.employer)}">
    <div class="role-main">
      <div class="role-meta">
        <span class="role-hash">${shortHash(r.role + r.company + (r.project || '') + r.startLabel)}</span>
        <span>${esc(r.startLabel)} → ${esc(r.endLabel)}</span>
        ${isHead ? '<span class="role-head">HEAD → main</span>' : ''}
      </div>
      <h3 class="role-title">${esc(r.role)}</h3>
      <div class="role-company">@ ${esc(r.company)}${r.project ? ` · <b>${esc(r.project)}</b>` : ''}</div>
      <p class="role-hl">${esc(r.highlight)}</p>
      <div class="chips">${r.tags.map((t, k) => `<span class="chip" style="--k:${k}">${esc(t)}</span>`).join('')}</div>
    </div>
    <div class="role-side">
      <div class="ring">
        <svg viewBox="0 0 72 72"><circle class="ring-bg" cx="36" cy="36" r="30"/><circle class="ring-fg" cx="36" cy="36" r="30"
          style="stroke-dasharray:${RING};--off:${RING * (1 - Math.min(1, r.months / 24))};--full:${RING}"/></svg>
        <span>${tenure(r.months)}</span>
      </div>
      <div class="impact">
        <b>${esc(r.impact.value)}</b>
        <small>${esc(r.impact.label)}</small>
      </div>
    </div>
  </article>`;

export const template = (ctx) => {
  const { roles } = ctx;
  const scale = timelineScale(roles, ctx.now);
  return `
  <div class="container exp-inner">
    <div class="exp-head">
      <div>
        ${kicker(ctx.index, 'experience')}
        <h2 class="exp-title">git log <span class="grad">--graph</span></h2>
      </div>
      <div class="exp-side" aria-hidden="true">
        <div class="exp-legend">${Object.entries(EMPLOYER_COLORS).map(([k, c]) => `<span style="--c:${c}"><i></i>${k}</span>`).join('')}</div>
        <div class="exp-counter"><b class="js-exp-step">01</b> / <span>${pad2(roles.length)}</span></div>
      </div>
    </div>

    <div class="tl js-timeline" aria-hidden="true">
      <div class="tl-row tl-axis">
        <div class="tl-label"></div>
        <div class="tl-lane">${scale.years.map((y) => `<span class="tl-year" style="left:${scale.pct(y * 12)}%">${y}</span>`).join('')}</div>
      </div>
      ${roles.map((r, i) => row(r, i, scale)).join('')}
      <div class="tl-over"><div class="tl-playhead"><span class="tl-date"></span></div></div>
    </div>

    <div class="role js-role" aria-live="polite">${roles.map((r, i) => card(r, i === roles.length - 1)).join('')}</div>
  </div>`;
};
