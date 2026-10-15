// Fixed HUD: section index, scroll progress and live readouts.
// services/tracker writes the dynamic parts; this is only their initial markup.
import type { SectionMeta } from '../contract';
import { hudTotal } from './model';

export function Hud({ sections }: { sections: readonly SectionMeta[] }) {
  return (
    <>
      <div className="hud hud-left" aria-hidden="true">
        <div className="hud-index">
          <span className="hud-num">00</span>
          <span className="hud-sep">/</span>
          <span className="hud-total">{hudTotal(sections)}</span>
        </div>
        <div className="hud-label">init</div>
      </div>
      <div className="hud hud-right" aria-hidden="true">
        <div className="hud-track">
          <span className="hud-fill"></span>
        </div>
        <div className="hud-pct">000%</div>
      </div>
      <div className="hud hud-bottom" aria-hidden="true">
        <span className="hud-coords">x:+0.000 y:+0.000</span>
        <span className="hud-shape">mesh: core</span>
        <span className="hud-fps">-- fps</span>
      </div>
    </>
  );
}
