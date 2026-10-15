// Markup ported from legacy/src/sections/credentials/template.js: certificate
// cards that the behaviour later verifies, then education and career on one
// time axis. Pure and deterministic (build-time `ctx.now`).
import type { Certificate, Education } from '@/domain/types';
import { tenure } from '@/domain/career';
import type { PageContext } from '@/shell/contract';
import { Kicker, cssVars } from '@/shared/ui';
import { identicon, lifePath, sealFill, verifyResult } from './content';

function Seal({ cert }: { cert: Certificate }) {
  return (
    <div className="seal" style={cssVars({ '--fill': sealFill(cert).toFixed(3) })}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="seal-orbit" cx="50" cy="50" r="49" />
        <circle className="seal-track" cx="50" cy="50" r="44" />
        <circle className="seal-ring" cx="50" cy="50" r="44" pathLength="1" />
        <circle className="seal-ticks" cx="50" cy="50" r="36" />
      </svg>
      <b>{cert.badge}</b>
    </div>
  );
}

function Fingerprint({ id }: { id: string }) {
  return (
    <div className="fp" aria-hidden="true">
      {identicon(id).map((on, i) => (
        <i key={i} className={on ? 'on' : undefined} style={cssVars({ '--i': String(i) })} />
      ))}
    </div>
  );
}

function Cert({ cert }: { cert: Certificate }) {
  return (
    <div className="cert-wrap">
      <article className="cert js-cert" data-hover="">
        <div className="cert-top">
          <span>{cert.issuer}</span>
          <span>{cert.date}</span>
        </div>
        <div className="cert-mid">
          <Seal cert={cert} />
          <span className="cert-stamp" aria-hidden="true">
            verified
          </span>
          <Fingerprint id={cert.id} />
        </div>
        <h3>{cert.short}</h3>
        <div className="cert-issuer">{cert.name}</div>
        <div className="cert-verify">
          <div className="cv-cmd">
            <span className="p">$</span> verify{' '}
            <b className="js-cert-id" data-text={cert.id}>
              {cert.id}
            </b>
          </div>
          <div className="cv-bar">
            <i />
          </div>
          <div className="cv-out">
            <span className="cv-wait">awaiting check…</span>
            <span className="cv-ok">✓ {verifyResult(cert)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

function EducationPath({ ctx, edu }: { ctx: PageContext; edu: Education }) {
  const path = lifePath(ctx.profile, ctx.now);
  const { graduated, deployed } = path.stops;
  return (
    <>
      <div className="edu-head">
        <div>
          <div className="edu-k">education · the build that started it</div>
          <h3>{edu.school}</h3>
          <p>{edu.degree}</p>
        </div>
        <div className="edu-date">
          {edu.start} — {edu.end}
        </div>
      </div>
      <div
        className="path js-path"
        style={cssVars({ '--g': `${graduated.toFixed(2)}%`, '--d': `${deployed.toFixed(2)}%` })}
      >
        <div className="path-years" aria-hidden="true">
          {path.years.map((y) => (
            <span key={y.year} style={{ left: `${y.at.toFixed(2)}%` }}>
              {y.year}
            </span>
          ))}
        </div>
        <div className="path-track">
          <div className="path-reveal js-path-reveal">
            <i className="seg seg-study" />
            <i className="seg seg-gap" />
            <i className="seg seg-career" />
            <span className="stop" style={{ left: 0 }} />
            <span className="stop" style={{ left: 'var(--g)' }} />
            <span className="stop" style={{ left: 'var(--d)' }} />
          </div>
          <span className="path-head" aria-hidden="true" />
        </div>
        <ol className="path-legend">
          <li className="lg-study">
            <b>compile</b> <span>degree · {tenure(path.months.study)} · 0 warnings</span>
          </li>
          <li className="lg-gap">
            <b>deploy</b> <span>first job in {tenure(path.months.gap)}</span>
          </li>
          <li className="lg-career">
            <b>runtime</b> <span>{tenure(path.months.career)} in production · still up</span>
          </li>
        </ol>
      </div>
    </>
  );
}

export function CredentialsView({ ctx }: { ctx: PageContext }) {
  const [edu] = ctx.profile.education;
  return (
    <div className="container">
      <Kicker index={ctx.index} label="credentials" />
      <h2 className="h2 split">
        Verified <span className="grad">&amp; certified</span>.
      </h2>
      <div className="cert-grid">
        {ctx.profile.certificates.map((cert) => (
          <Cert key={cert.id} cert={cert} />
        ))}
      </div>
      <div className="edu">{edu && <EducationPath ctx={ctx} edu={edu} />}</div>
    </div>
  );
}
