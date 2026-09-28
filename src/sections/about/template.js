import { esc } from '../../shared/dom.js';
import { kicker } from '../../shared/ui.js';
import { slis } from './content.js';

const sli = ({ prefix = '', to, suffix = '', label, note }) => `
  <div class="sli"><b>${prefix ? `<small>${prefix}</small>` : ''}<span class="js-sli" data-to="${to}">0</span>${suffix ? `<small>${suffix}</small>` : ''}</b><span>${esc(label)}<em>${esc(note)}</em></span></div>`;

export const template = (ctx) => `
  <div class="container about-inner">
    <div class="dash js-dash">
      <header class="dash-top">
        <div>
          ${kicker(ctx.index, 'about')}
          <h2 class="dash-h">nam-prod <span>/ observability</span></h2>
        </div>
        <div class="dash-meta">
          <span class="dash-status"><i></i> all systems nominal</span>
          <span class="dash-chip">⏱ last ${ctx.stats.years} years</span>
          <span class="dash-chip js-clock">Hanoi --:--:--</span>
        </div>
      </header>

      <div class="dash-grid">
        <article class="panel p-sli">${slis(ctx).map(sli).join('')}</article>

        <article class="panel p-readme">
          <h3 class="panel-h">README.md</h3>
          <pre class="readme js-readme"></pre>
        </article>

        <article class="panel p-uptime">
          <h3 class="panel-h">career.uptime</h3>
          <div class="uptime-big js-uptime">0y 0m</div>
          <div class="uptime-sec"><span class="js-uptime-s">0</span> s and counting</div>
          <svg class="spark" viewBox="0 0 200 36" preserveAspectRatio="none" aria-hidden="true">
            <path class="spark-fill js-spark-fill" d="" />
            <path class="spark-line js-spark" pathLength="1" d="" />
          </svg>
          <small class="panel-foot">0 unplanned outages<sup>*</sup> <em>*that we talk about</em></small>
        </article>

        <article class="panel p-gauge">
          <h3 class="panel-h">caffeine.level</h3>
          <svg class="gauge" viewBox="0 0 160 92" aria-hidden="true">
            <path class="gauge-bg" d="M 16 80 A 64 64 0 0 1 144 80" />
            <path class="gauge-fg js-gauge-arc" pathLength="1" d="M 16 80 A 64 64 0 0 1 144 80" />
            <g class="gauge-needle js-needle"><line x1="80" y1="80" x2="80" y2="28" /><circle cx="80" cy="80" r="5" /></g>
          </svg>
          <div class="gauge-val"><b class="js-gauge-val">0</b><small>%</small> <span class="js-gauge-state">booting</span></div>
        </article>

        <article class="panel p-htop">
          <h3 class="panel-h">htop <span>— brain.processes</span></h3>
          <div class="htop js-htop"></div>
        </article>

        <article class="panel p-chart">
          <h3 class="panel-h">bugs vs coffee <span>— today</span></h3>
          <svg class="chart js-chart" viewBox="0 0 320 128" aria-hidden="true"></svg>
          <div class="chart-legend">
            <span class="lg-coffee"><i></i>coffee</span>
            <span class="lg-bugs"><i></i>open bugs</span>
            <span class="muted">r = −0.97 · causation: probably</span>
          </div>
        </article>

        <article class="panel p-heat">
          <h3 class="panel-h">git.commits <span>— last 52 weeks</span></h3>
          <canvas class="heat js-heat" aria-hidden="true"></canvas>
          <div class="heat-foot">
            <span>less <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</span>
            <span class="muted">weekends: touching grass 🌱</span>
          </div>
        </article>

        <article class="panel p-logs">
          <h3 class="panel-h">tail -f <span>/var/log/nam.log</span></h3>
          <div class="logs js-logs"></div>
        </article>
      </div>
    </div>
  </div>`;
