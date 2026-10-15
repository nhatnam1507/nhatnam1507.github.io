// 03 // stack — markup of the architecture diagram (ported from legacy template.js).
// Pure markup, rendered at build time; behaviour.ts brings it to life.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';
import { BOXES, BOX_ORDER, STAGES, type BoxId, type ToolDef } from './content';

const cells = (n: number): ReactNode[] => Array.from({ length: n }, (_, i) => <i key={i} />);

const Node = ({ def: [name, level], k }: { def: ToolDef; k: string }) => (
  <span className={`an an-${level}`} tabIndex={0} data-k={k} data-hover="" style={{ '--i': k } as CSSProperties}>
    {name}
  </span>
);

// live widgets that sit inside some boxes
const EXTRAS: Partial<Record<BoxId, ReactNode>> = {
  plat: (
    <>
      <div className="pods js-pods">{cells(12)}</div>
      <div className="pods-label">
        <b className="js-pods-n">12/12</b> pods Running
      </div>
    </>
  ),
  obs: (
    <>
      <div className="rps js-rps">{cells(14)}</div>
      <div className="rps-label">
        p99 <b className="js-p99">42</b>ms · errors <b>0.0%</b>
      </div>
    </>
  ),
  data: (
    <div className="queue js-queue" aria-hidden="true">
      {cells(6)}
    </div>
  ),
  idp: (
    <div className="jwt" aria-hidden="true">
      <code className="js-jwt">
        <i className="jwt-h">eyJhbGciOiJSUzI1NiJ9</i>.<i className="jwt-p">eyJzdWIiOiJuYW0ifQ</i>.
        <i className="jwt-s">kX9fQ2vLr8</i>
      </code>
      <span className="jwt-ok js-jwt-ok">✓ verified</span>
    </div>
  ),
};

function Box({ id }: { id: BoxId }) {
  const b = BOXES[id];
  return (
    <div className={`ab ab-${id}`} data-box={id}>
      <div className="ab-h">
        <span>#</span> {b.title} <em>{b.sub}</em>
      </div>
      <div className="ab-nodes">
        {b.items.map((def, i) => (
          <Node key={def[0]} def={def} k={`${id}:${i}`} />
        ))}
      </div>
      {EXTRAS[id]}
    </div>
  );
}

const Pipeline = () => (
  <div className="ab ab-ci" data-box="ci">
    <div className="ab-h">
      <span>#</span> delivery{' '}
      <em>
        pipeline <b className="js-ci-run">#1507</b>
      </em>
      <span className="ci-status js-ci-status">queued</span>
    </div>
    <div className="ci">
      {STAGES.map(([stage, tool], i) => (
        <Fragment key={stage}>
          <span className="ci-stage" tabIndex={0} data-k={`ci:${i}`} data-hover="">
            <b>{stage}</b>
            <small>{tool}</small>
          </span>
          {i < STAGES.length - 1 && <i className="ci-arrow" />}
        </Fragment>
      ))}
    </div>
  </div>
);

const Clients = () => (
  <div className="ab ab-client" data-box="client">
    <div className="client-icon" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
    <div className="ab-h">clients</div>
    <small>
      web · mobile
      <br />
      services
    </small>
  </div>
);

export function StackView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container stack-inner">
      <div className="arch js-arch">
        <header className="arch-head">
          <div>
            <Kicker index={ctx.index} label="stack" />
            <h2 className="arch-title">
              The stack, <span className="grad">as a system</span>.
            </h2>
          </div>
          <div className="arch-side">
            <div className="arch-legend" aria-hidden="true">
              <span>
                <i className="lg-core" />
                core
              </span>
              <span>
                <i className="lg-used" />
                used
              </span>
              <span>
                <i className="lg-explore" />
                exploring
              </span>
            </div>
            <div className="arch-step">
              <span className="js-arch-step">$ make deploy</span>
            </div>
          </div>
        </header>
        <div className="arch-board js-arch-board">
          <Pipeline />
          <Clients />
          {BOX_ORDER.map((id) => (
            <Box key={id} id={id} />
          ))}
          <svg className="arch-wires js-wires" aria-hidden="true" />
        </div>
        <div className="arch-tip js-arch-tip" role="status" />
      </div>
    </div>
  );
}
