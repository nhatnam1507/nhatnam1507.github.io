// 05 // contact markup.
// Server Component: the live Hanoi clock and presence line are placeholders
// that behaviour.ts fills in (a View must not read the current time).
import type { PageContext } from '@/shell/contract';
import { ExportButton, Icon, Kicker } from '@/shared/ui';
import { endpoints, type Endpoint } from './content';

function EndpointRow({ e }: { e: Endpoint }) {
  const external = e.href.startsWith('http');
  return (
    <div className="ep" data-hover>
      <a className="ep-link" href={e.href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
        <span className={`ep-m ep-${e.method.toLowerCase()}`}>{e.method}</span>
        <span className="ep-path">{e.path}</span>
        <span className="ep-v">{e.value}</span>
        <span className="ep-s">{e.status}</span>
      </a>
      {e.copy ? (
        <button className="ep-copy js-copy" type="button" data-copy={e.value} aria-label={`Copy ${e.value}`}>
          copy
        </button>
      ) : (
        <span className="ep-go" aria-hidden="true">
          <Icon name="arrowUpRight" />
        </span>
      )}
    </div>
  );
}

export function ContactView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="contact" />
      <h2 className="contact-title">
        <span className="line">
          <span>Let’s build</span>
        </span>
        <span className="line">
          <span className="grad">something solid.</span>
        </span>
      </h2>
      <div className="contact-grid">
        <div className="api">
          <div className="api-head">
            <span>nam.api</span>
            <em>v{ctx.now.getFullYear()} · base url: Ha Noi, VN</em>
          </div>
          {endpoints(ctx.profile.contact).map((e) => (
            <EndpointRow key={e.path} e={e} />
          ))}
        </div>
        <div className="term term-contact" role="img" aria-label="Terminal: ping nam">
          <div className="term-bar">
            <i></i>
            <i></i>
            <i></i>
            <span>zsh — ~/say-hello</span>
          </div>
          <pre className="term-body">
            <code className="js-hello"></code>
          </pre>
          <div className="presence">
            <span className="presence-dot" aria-hidden="true">
              <i></i>
            </span>
            <span>
              Hanoi <b className="js-local">--:--:--</b> · UTC+7
            </span>
            <span className="presence-now">
              <span className="js-mood-i"></span> <span className="js-mood"></span>
            </span>
          </div>
        </div>
      </div>
      <div className="cta">
        <ExportButton size="lg" />
        <a className="btn btn-ghost" href="cv.html" target="_blank" rel="noopener">
          <span>view print template</span>
          <Icon name="arrowUpRight" />
        </a>
      </div>
    </div>
  );
}
