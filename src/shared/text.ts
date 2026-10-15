// Text effects: decoding scramble, terminal typing, token typing, word split.
import { gsap } from './lib';
import { $$, esc } from './dom';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFxz';

/** Decode `el`'s text from random glyphs. Returns the tween. */
export function scramble(el: HTMLElement, { duration = 1.1, delay = 0 } = {}): gsap.core.Tween {
  const final = el.dataset.text || el.textContent || '';
  const reveal = Array.from(final, () => Math.random() * 0.6 + 0.2);
  const state = { t: 0 };
  return gsap.to(state, {
    t: 1,
    duration,
    delay,
    ease: 'none',
    onUpdate() {
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += ch === ' ' || state.t >= (reveal[i] ?? 0) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() {
      el.textContent = final;
    },
  });
}

/** A typed command `{ p: '$ ', t: 'whoami' }` or a printed output `{ o: 'text' }`. */
export type TerminalLine = { p: string; t: string } | { o: string };

/**
 * Type a terminal session line by line. Resolves when done. Stops early
 * (without resolving) when `signal` aborts.
 */
export function typeTerminal(el: HTMLElement, lines: readonly TerminalLine[], signal?: AbortSignal): Promise<void> {
  let html = '';
  let li = 0,
    ci = 0;
  const cursor = '<span class="cur"></span>';
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    signal?.addEventListener('abort', () => clearTimeout(timer), { once: true });
    const later = (fn: () => void, ms: number) => {
      if (!signal?.aborted) timer = setTimeout(fn, ms);
    };
    const step = () => {
      const line = lines[li];
      if (!line) {
        el.innerHTML = html + cursor;
        resolve();
        return;
      }
      if ('o' in line) {
        html += `<span class="o">${esc(line.o)}</span>\n`;
        li++;
        ci = 0;
        el.innerHTML = html + cursor;
        later(step, 380);
        return;
      }
      if (ci === 0) html += `<span class="p">${esc(line.p)}</span>`;
      if (ci < line.t.length) {
        html += esc(line.t[ci++]);
        el.innerHTML = html + cursor;
        later(step, 38 + Math.random() * 60);
      } else {
        html += '\n';
        li++;
        ci = 0;
        later(step, 240);
      }
    };
    step();
  });
}

/** `[className, text]`; an empty class name renders plain text. */
export type Token = readonly [string, string];

/**
 * Type syntax-highlighted text. Each class gets `prefix` prepended.
 * `cps` = characters per second.
 */
export function typeTokens(
  el: HTMLElement,
  tokens: readonly Token[],
  { prefix = '', cps = 55, instant = false } = {},
): void {
  const total = tokens.reduce((n, [, t]) => n + t.length, 0);
  const render = (n: number) => {
    let out = '',
      left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= part.length;
      out += cls ? `<span class="${prefix}${cls}">${esc(part)}</span>` : esc(part);
    }
    el.innerHTML = `${out}<span class="cur"></span>`;
  };
  if (instant) {
    render(total);
    return;
  }
  const st = { n: 0 };
  gsap.to(st, { n: total, duration: total / cps, ease: 'none', onUpdate: () => render(Math.round(st.n)) });
}

/** Wrap each word of a heading in a mask so it can slide up. Returns inner spans. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const frag = document.createDocumentFragment();
  const wrap = (node: Node) => {
    const w = document.createElement('span');
    w.className = 'w';
    const inner = document.createElement('span');
    inner.appendChild(node);
    w.appendChild(inner);
    return w;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      frag.appendChild(wrap(node));
      return;
    }
    (node.nodeValue ?? '').split(/(\s+)/).forEach((part) => {
      if (!part) return;
      frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
    });
  });
  el.innerHTML = '';
  el.appendChild(frag);
  return $$('.w > span', el);
}
