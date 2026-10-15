// Hero markup. Static only: the
// behaviour fills the clock, types the terminal and positions the HUD.
import type { PageContext } from '@/shell/contract';
import { ExportButton, Icon } from '@/shared/ui';
import { SUGGESTIONS, hudSlots } from './content';

function Hud({ ctx }: { ctx: PageContext }) {
  return (
    <div className="hud-core js-hud" aria-hidden="true" hidden>
      <div className="hud-reticle">
        <i className="hr hr-1"></i>
        <i className="hr hr-2"></i>
        <i className="hr hr-3"></i>
        <b className="hc hc-tl"></b>
        <b className="hc hc-tr"></b>
        <b className="hc hc-bl"></b>
        <b className="hc hc-br"></b>
      </div>
      {hudSlots(ctx.profile).map((s) => (
        <div className="hud-tag" key={s.label}>
          <i className="hud-lead"></i>
          <span className="hud-k">{s.label}</span>
          <span className="hud-v js-hud-v">{s.items[0]}</span>
        </div>
      ))}
      <div className="hud-status">◎ nam.core · lock acquired</div>
    </div>
  );
}

export function HeroView({ ctx }: { ctx: PageContext }) {
  const { profile } = ctx;
  return (
    <>
      <Hud ctx={ctx} />
      <div className="container">
        <p className="eyebrow reveal-hero">
          <span className="pulse"></span> online · Hanoi <b className="js-hero-clock">--:--</b> · UTC+7
        </p>
        <h1 className="hero-name">
          <span className="line">
            <span className="scramble" data-text="NAM">
              NAM
            </span>
          </span>
          <span className="line line-sm">
            <span className="scramble outline" data-text="NGUYEN NHAT">
              NGUYEN NHAT
            </span>
          </span>
        </h1>
        <p className="hero-role reveal-hero">
          <span className="tag">{profile.title}</span>
          <span className="role-sep">{'//'}</span>
          <span className="muted">{profile.tagline}</span>
        </p>

        <div className="term term-hero reveal-hero">
          <div className="term-bar">
            <i></i>
            <i></i>
            <i></i>
            <span>zsh — ~/nam · interactive</span>
          </div>
          <div className="term-body js-term" data-lenis-prevent="">
            <code className="js-typer" aria-live="polite"></code>
            <form className="term-line js-term-form" hidden>
              <label className="p" htmlFor="hero-cmd">
                $
              </label>
              <input
                id="hero-cmd"
                className="js-term-input"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="send"
                placeholder="type help, press enter"
              />
            </form>
          </div>
          <div className="term-try">
            <span>try</span>
            {SUGGESTIONS.map((c) => (
              <button type="button" className="js-try" data-cmd={c} key={c}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="cta reveal-hero">
          <ExportButton />
          <a className="btn btn-ghost" href="#experience" data-scroll-to="">
            <span>git log --graph</span>
            <Icon name="arrowRight" />
          </a>
        </div>
      </div>
      <div className="scroll-hint" aria-hidden="true">
        <span>scroll</span>
        <i></i>
      </div>
    </>
  );
}
