import { esc, repeat } from '../../shared/dom.js';
import { kicker } from '../../shared/ui.js';
import { BOXES, STAGES } from './content.js';

const node = ([name, level], key) =>
  `<span class="an an-${level}" tabindex="0" data-k="${key}" data-hover style="--i:${key}">${esc(name)}</span>`;

// live widgets that sit inside some boxes
const EXTRAS = {
  plat: `<div class="pods js-pods">${repeat('<i></i>', 12)}</div><div class="pods-label"><b class="js-pods-n">12/12</b> pods Running</div>`,
  obs: `<div class="rps js-rps">${repeat('<i></i>', 14)}</div><div class="rps-label">p99 <b class="js-p99">42</b>ms · errors <b>0.0%</b></div>`,
  data: `<div class="queue js-queue" aria-hidden="true">${repeat('<i></i>', 6)}</div>`,
  idp: `<div class="jwt" aria-hidden="true"><code class="js-jwt"><i class="jwt-h">eyJhbGciOiJSUzI1NiJ9</i>.<i class="jwt-p">eyJzdWIiOiJuYW0ifQ</i>.<i class="jwt-s">kX9fQ2vLr8</i></code><span class="jwt-ok js-jwt-ok">✓ verified</span></div>`,
};

// items with a row label (e.g. identity: provider vs mechanism) are grouped
const nodes = (items, id) => {
  const keyed = items.map((it, i) => [it, `${id}:${i}`]);
  const rows = [...new Set(items.map((it) => it[3]))];
  if (!rows[0]) return `<div class="ab-nodes">${keyed.map(([it, k]) => node(it, k)).join('')}</div>`;
  return rows.map((row) => `
      <div class="ab-row"><small>${row}</small><div class="ab-nodes">${keyed.filter(([it]) => it[3] === row).map(([it, k]) => node(it, k)).join('')}</div></div>`).join('');
};

const box = (id) => {
  const b = BOXES[id];
  return `
    <div class="ab ab-${id}" data-box="${id}">
      <div class="ab-h"><span>#</span> ${b.title} <em>${b.sub}</em></div>
      ${nodes(b.items, id)}
      ${EXTRAS[id] || ''}
    </div>`;
};

const pipeline = () => `
  <div class="ab ab-ci" data-box="ci">
    <div class="ab-h"><span>#</span> delivery <em>pipeline <b class="js-ci-run">#1507</b></em><span class="ci-status js-ci-status">queued</span></div>
    <div class="ci">${STAGES.map(([stage, tool], i) => `
      <span class="ci-stage" tabindex="0" data-k="ci:${i}" data-hover><b>${stage}</b><small>${esc(tool)}</small></span>${i < STAGES.length - 1 ? '<i class="ci-arrow"></i>' : ''}`).join('')}
    </div>
  </div>`;

const clients = () => `
  <div class="ab ab-client" data-box="client">
    <div class="client-icon" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ab-h">clients</div>
    <small>web · mobile · services</small>
  </div>`;

export const template = (ctx) => `
  <div class="container stack-inner">
    <div class="arch js-arch">
      <header class="arch-head">
        <div>
          ${kicker(ctx.index, 'stack')}
          <h2 class="arch-title">The stack, <span class="grad">as a system</span>.</h2>
        </div>
        <div class="arch-side">
          <div class="arch-legend" aria-hidden="true">
            <span><i class="lg-core"></i>core</span>
            <span><i class="lg-used"></i>used</span>
            <span><i class="lg-explore"></i>exploring</span>
          </div>
          <div class="arch-step"><span class="js-arch-step">$ make deploy</span></div>
        </div>
      </header>
      <div class="arch-board js-arch-board">
        ${pipeline()}${clients()}${['api', 'idp', 'svc', 'data', 'obs', 'plat'].map(box).join('')}
        <svg class="arch-wires js-wires" aria-hidden="true"></svg>
      </div>
      <div class="arch-tip js-arch-tip" role="status"></div>
    </div>
  </div>`;
