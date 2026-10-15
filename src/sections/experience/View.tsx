// Experience markup (was legacy template.js): a git-log style timeline chart
// plus one role card per job, all built from ctx.roles. Server Component:
// the behaviour moves the playhead, fills the bars and activates the cards.
import type { CSSProperties } from 'react';
import type { Role } from '@/domain/types';
import { tenure } from '@/domain/career';
import { pad2 } from '@/shared/dom';
import { shortHash } from '@/shared/random';
import { Kicker } from '@/shared/ui';
import type { PageContext } from '@/shell/contract';
import { EMPLOYER_COLORS, colorOf } from './content';
import { timelineScale, type TimelineScale } from './timeline';

const RING = 2 * Math.PI * 30;
/** tenure that fills the ring completely */
const RING_FULL_MONTHS = 24;

/** Inline style carrying CSS custom properties (React's style type doesn't know them). */
const vars = (v: Record<string, string | number>): CSSProperties => v;

function TimelineRow({ role, index, pct }: { role: Role; index: number; pct: TimelineScale['pct'] }) {
  const left = `${pct(role.start)}%`;
  const width = `${pct(role.end) - pct(role.start)}%`;
  return (
    <div className="tl-row" style={vars({ '--c': colorOf(role.employer) })} data-i={index}>
      <div className="tl-label">
        <i></i>
        {role.label}
      </div>
      <div className="tl-lane">
        <span className="tl-ghost" style={{ left, width }}></span>
        <span className="tl-bar" style={{ left, width }}></span>
        <span className="tl-dot" style={{ left }}></span>
      </div>
    </div>
  );
}

function RoleCard({ role, isHead }: { role: Role; isHead: boolean }) {
  return (
    <article className="role-card" style={vars({ '--c': colorOf(role.employer) })}>
      <div className="role-main">
        <div className="role-meta">
          <span className="role-hash">
            {shortHash(role.role + role.company + (role.project || '') + role.startLabel)}
          </span>
          <span>{`${role.startLabel} → ${role.endLabel}`}</span>
          {isHead && <span className="role-head">HEAD → main</span>}
        </div>
        <h3 className="role-title">{role.role}</h3>
        <div className="role-company">
          {`@ ${role.company}${role.project ? ' · ' : ''}`}
          {role.project && <b>{role.project}</b>}
        </div>
        <p className="role-hl">{role.highlight}</p>
        <div className="chips">
          {role.tags.map((tag, k) => (
            <span className="chip" style={vars({ '--k': k })} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="role-side">
        <div className="ring">
          <svg viewBox="0 0 72 72">
            <circle className="ring-bg" cx="36" cy="36" r="30" />
            <circle
              className="ring-fg"
              cx="36"
              cy="36"
              r="30"
              style={vars({
                strokeDasharray: RING,
                '--off': RING * (1 - Math.min(1, role.months / RING_FULL_MONTHS)),
                '--full': RING,
              })}
            />
          </svg>
          <span>{tenure(role.months)}</span>
        </div>
        <div className="impact">
          <b>{role.impact.value}</b>
          <small>{role.impact.label}</small>
        </div>
      </div>
    </article>
  );
}

export function ExperienceView({ ctx }: { ctx: PageContext }) {
  const { roles } = ctx;
  const scale = timelineScale(roles, ctx.now);
  return (
    <div className="container exp-inner">
      <div className="exp-head">
        <div>
          <Kicker index={ctx.index} label="experience" />
          <h2 className="exp-title">
            git log <span className="grad">--graph</span>
          </h2>
        </div>
        <div className="exp-side" aria-hidden="true">
          <div className="exp-legend">
            {Object.entries(EMPLOYER_COLORS).map(([name, color]) => (
              <span style={vars({ '--c': color })} key={name}>
                <i></i>
                {name}
              </span>
            ))}
          </div>
          <div className="exp-counter">
            <b className="js-exp-step">01</b> / <span>{pad2(roles.length)}</span>
          </div>
        </div>
      </div>

      <div className="tl js-timeline" aria-hidden="true">
        <div className="tl-row tl-axis">
          <div className="tl-label"></div>
          <div className="tl-lane">
            {scale.years.map((year) => (
              <span className="tl-year" style={{ left: `${scale.pct(year * 12)}%` }} key={year}>
                {year}
              </span>
            ))}
          </div>
        </div>
        {roles.map((role, i) => (
          <TimelineRow role={role} index={i} pct={scale.pct} key={i} />
        ))}
        <div className="tl-over">
          <div className="tl-playhead">
            <span className="tl-date"></span>
          </div>
        </div>
      </div>

      <div className="role js-role" aria-live="polite">
        {roles.map((role, i) => (
          <RoleCard role={role} isHead={i === roles.length - 1} key={i} />
        ))}
      </div>
    </div>
  );
}
