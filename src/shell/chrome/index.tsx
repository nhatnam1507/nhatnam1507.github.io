// STUB (S0): the legacy chrome markup (legacy/index.html) in one component.
// S1 splits it into Nav, Hud, Boot, Curtain, Cursor, Backdrop, Footer, Toast.
// Ids and classes are the hooks the shell services select; keep them.
import type { ReactNode } from 'react';
import { navSections, type SectionMeta } from '../contract';
import { pad2 } from '@/shared/dom';
import { CV_PDF_NAME, CV_PDF_PATH } from '@/shared/site';
import { Icon } from '@/shared/ui';

interface ChromeProps {
  sections: readonly SectionMeta[];
  now: Date;
  children: ReactNode;
}

export function Chrome({ sections, now, children }: ChromeProps) {
  return (
    <>
      <div id="boot" aria-hidden="true">
        <pre className="boot-log"></pre>
        <div className="boot-bar">
          <span></span>
        </div>
      </div>

      <canvas id="webgl" aria-hidden="true"></canvas>
      <div className="fx-grid" aria-hidden="true"></div>
      <div className="fx-vignette" aria-hidden="true"></div>
      <div className="fx-noise" aria-hidden="true"></div>
      <div className="cursor" aria-hidden="true">
        <span></span>
      </div>
      <div className="curtain" aria-hidden="true">
        <span className="curtain-cmd"></span>
      </div>

      <header className="nav">
        <a className="logo" href="#hero" data-scroll-to>
          <span className="logo-prompt">nam@dev</span>
          <span className="logo-path">:~$</span>
          <span className="caret"></span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          {navSections(sections).map((s) => (
            <a key={s.id} href={`#${s.id}`} data-scroll-to>
              <span>{pad2(sections.indexOf(s))}</span>
              {s.navLabel || s.label}
            </a>
          ))}
        </nav>
        <a className="btn btn-primary btn-sm js-export" href={CV_PDF_PATH} download={CV_PDF_NAME}>
          <Icon name="download" />
          <span>Export CV</span>
        </a>
      </header>

      <div className="hud hud-left" aria-hidden="true">
        <div className="hud-index">
          <span className="hud-num">00</span>
          <span className="hud-sep">/</span>
          <span className="hud-total">{pad2(sections.length - 1)}</span>
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

      {children}

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {now.getFullYear()} Nam Nguyen Nhat</span>
          <span className="muted">three.js · gsap · github pages</span>
          <span className="eof">[EOF]</span>
        </div>
      </footer>

      <div className="toast" role="status" aria-live="polite"></div>
    </>
  );
}
