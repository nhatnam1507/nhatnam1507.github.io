// Text effects: decoding scramble, terminal typing, token typing, word split.
import { gsap } from './lib.js';
import { $$, esc } from './dom.js';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFxz';

/** Decode `el`'s text from random glyphs. Returns the tween. */
export function scramble(el, { duration = 1.1, delay = 0 } = {}) {
  const final = el.dataset.text || el.textContent;
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
        out += ch === ' ' || state.t >= reveal[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() { el.textContent = final; },
  });
}

/**
 * Type a terminal session. `lines` items are either a command
 * `{ p: '$ ', t: 'whoami' }` (typed) or an output `{ o: 'text' }` (printed).
 */
export function typeTerminal(el, lines) {
  let html = '';
  let li = 0, ci = 0;
  const cursor = '<span class="cur"></span>';
  return new Promise((resolve) => {
    const step = () => {
      const line = lines[li];
      if (!line) { el.innerHTML = html + cursor; resolve(); return; }
      if (line.o !== undefined) {
        html += `<span class="o">${esc(line.o)}</span>\n`;
        li++; ci = 0;
        el.innerHTML = html + cursor;
        setTimeout(step, 380);
        return;
      }
      if (ci === 0) html += `<span class="p">${esc(line.p)}</span>`;
      if (ci < line.t.length) {
        html += esc(line.t[ci++]);
        el.innerHTML = html + cursor;
        setTimeout(step, 38 + Math.random() * 60);
      } else {
        html += '\n';
        li++; ci = 0;
        setTimeout(step, 240);
      }
    };
    step();
  });
}

/**
 * Type syntax-highlighted text. `tokens` is `[className, text][]`; each
 * class gets `prefix` prepended. `cps` = characters per second.
 */
export function typeTokens(el, tokens, { prefix = '', cps = 55, instant = false } = {}) {
  const total = tokens.reduce((n, [, t]) => n + t.length, 0);
  const render = (n) => {
    let out = '', left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= part.length;
      out += cls ? `<span class="${prefix}${cls}">${esc(part)}</span>` : esc(part);
    }
    el.innerHTML = `${out}<span class="cur"></span>`;
  };
  if (instant) { render(total); return; }
  const st = { n: 0 };
  gsap.to(st, { n: total, duration: total / cps, ease: 'none', onUpdate: () => render(Math.round(st.n)) });
}

/** Wrap each word of a heading in a mask so it can slide up. Returns inner spans. */
export function splitWords(el) {
  const frag = document.createDocumentFragment();
  const wrap = (node) => {
    const w = document.createElement('span');
    w.className = 'w';
    const inner = document.createElement('span');
    inner.appendChild(node);
    w.appendChild(inner);
    return w;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) { frag.appendChild(wrap(node)); return; }
    node.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
    });
  });
  el.innerHTML = '';
  el.appendChild(frag);
  return $$('.w > span', el);
}
