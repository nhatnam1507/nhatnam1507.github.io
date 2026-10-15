// 01 // about: Nam rendered as a monitored production service (a dashboard of
// panels). Pure markup; the behaviour animates it and fills the live bits
// (clock, uptime, logs, canvas) that cannot be known at build time.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';
import { DAY, PROCESSES, slis, type Sli } from './content';
import { chartModel } from './widgets/chart';
import { sparklinePaths } from './widgets/sparkline';

function SliTile({ prefix, to, suffix, label, note }: Sli) {
  return (
    <div className="sli">
      <b>
        {prefix ? <small>{prefix}</small> : null}
        <span className="js-sli" data-to={to}>
          0
        </span>
        {suffix ? <small>{suffix}</small> : null}
      </b>
      <span>
        {label}
        <em>{note}</em>
      </span>
    </div>
  );
}

function Htop() {
  return (
    <div className="htop js-htop">
      <div className="htop-row htop-head">
        <span>PID</span>
        <span>COMMAND</span>
        <span>CPU%</span>
      </div>
      {PROCESSES.map((p) => (
        <div key={p.pid} className={`htop-row${'killed' in p ? ' is-killed' : ''}`}>
          <span className="htop-pid">{p.pid}</span>
          <span className="htop-cmd">{p.cmd}</span>
          <span className="htop-cpu">
            {'killed' in p ? (
              <b className="htop-kill">SIGKILL</b>
            ) : (
              <>
                <i className="htop-bar">
                  <i></i>
                </i>
                <b>{p.cpu}</b>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function Chart() {
  const m = chartModel(DAY);
  return (
    <svg className="chart js-chart" viewBox="0 0 320 128" aria-hidden="true">
      {m.grid.map((g) => (
        <line key={g.y} className="ch-grid" x1={g.x1} x2={g.x2} y1={g.y} y2={g.y} />
      ))}
      {m.ticks.map((t) => (
        <text key={t.label} className="ch-tick" x={t.x} y={t.y} textAnchor="middle">
          {t.label}
        </text>
      ))}
      <path className="ch-line ch-coffee" pathLength="1" d={m.coffeePath} />
      <path className="ch-line ch-bugs" pathLength="1" d={m.bugsPath} />
      <g className="ch-note">
        <circle cx={m.note.cx} cy={m.note.cy} r="3.5" />
        <text x={m.note.tx} y={m.note.ty}>
          {m.note.text}
        </text>
      </g>
    </svg>
  );
}

export function AboutView({ ctx }: { ctx: PageContext }) {
  const spark = sparklinePaths();
  return (
    <div className="container about-inner">
      <div className="dash js-dash">
        <header className="dash-top">
          <div>
            <Kicker index={ctx.index} label="about" />
            <h2 className="dash-h">
              nam-prod <span>/ observability</span>
            </h2>
          </div>
          <div className="dash-meta">
            <span className="dash-status">
              <i></i> all systems nominal
            </span>
            <span className="dash-chip">{`⏱ last ${ctx.stats.years} years`}</span>
            <span className="dash-chip js-clock">Hanoi --:--:--</span>
          </div>
        </header>

        <div className="dash-grid">
          <article className="panel p-sli">
            {slis(ctx).map((s) => (
              <SliTile key={s.label} {...s} />
            ))}
          </article>

          <article className="panel p-readme">
            <h3 className="panel-h">README.md</h3>
            <pre className="readme js-readme"></pre>
          </article>

          <article className="panel p-uptime">
            <h3 className="panel-h">career.uptime</h3>
            <div className="uptime-big js-uptime">0y 0m</div>
            <div className="uptime-sec">
              <span className="js-uptime-s">0</span> s and counting
            </div>
            <svg className="spark" viewBox="0 0 200 36" preserveAspectRatio="none" aria-hidden="true">
              <path className="spark-fill js-spark-fill" d={spark.fill} />
              <path className="spark-line js-spark" pathLength="1" d={spark.line} />
            </svg>
            <small className="panel-foot">
              0 unplanned outages<sup>*</sup> <em>*that we talk about</em>
            </small>
          </article>

          <article className="panel p-gauge">
            <h3 className="panel-h">caffeine.level</h3>
            <svg className="gauge" viewBox="0 0 160 92" aria-hidden="true">
              <path className="gauge-bg" d="M 16 80 A 64 64 0 0 1 144 80" />
              <path className="gauge-fg js-gauge-arc" pathLength="1" d="M 16 80 A 64 64 0 0 1 144 80" />
              <g className="gauge-needle js-needle">
                <line x1="80" y1="80" x2="80" y2="28" />
                <circle cx="80" cy="80" r="5" />
              </g>
            </svg>
            <div className="gauge-val">
              <b className="js-gauge-val">0</b>
              <small>%</small> <span className="js-gauge-state">booting</span>
            </div>
          </article>

          <article className="panel p-htop">
            <h3 className="panel-h">
              htop <span>— brain.processes</span>
            </h3>
            <Htop />
          </article>

          <article className="panel p-chart">
            <h3 className="panel-h">
              bugs vs coffee <span>— today</span>
            </h3>
            <Chart />
            <div className="chart-legend">
              <span className="lg-coffee">
                <i></i>coffee
              </span>
              <span className="lg-bugs">
                <i></i>open bugs
              </span>
              <span className="muted">r = −0.97 · causation: probably</span>
            </div>
          </article>

          <article className="panel p-heat">
            <h3 className="panel-h">
              git.commits <span>— last 52 weeks</span>
            </h3>
            <canvas className="heat js-heat" aria-hidden="true"></canvas>
            <div className="heat-foot">
              <span>
                less <i className="l0"></i>
                <i className="l1"></i>
                <i className="l2"></i>
                <i className="l3"></i>
                <i className="l4"></i> more
              </span>
              <span className="muted">weekends: touching grass 🌱</span>
            </div>
          </article>

          <article className="panel p-logs">
            <h3 className="panel-h">
              tail -f <span>/var/log/nam.log</span>
            </h3>
            <div className="logs js-logs"></div>
          </article>
        </div>
      </div>
    </div>
  );
}
