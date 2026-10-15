// The hero terminal as a real prompt: renders command output, keeps a history
// (↑/↓), tab-completes and can "type" a suggested command for the visitor.
import { esc } from '../../../shared/dom.js';

const HISTORY_MAX = 50;
const TYPE_MS = 45;

const renderLine = (tokens) => tokens.map(([cls, text, href]) => (cls === 'a'
  ? `<a href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`
  : `<span class="${cls}">${esc(text)}</span>`)).join('');

/**
 * @param {object} els  { win, body, log, form, input }; `win` gets .is-active once used
 * @param {object} commands  from createCommands
 * @param {(effect: object) => void} onEffect
 */
export function createTerminal({ win, body, log, form, input }, commands, onEffect) {
  const history = [];
  let cursor = 0;
  let typing = false;

  const print = (html) => {
    log.insertAdjacentHTML('beforeend', html);
    body.scrollTop = body.scrollHeight;
  };

  function exec(line) {
    if (!win.classList.contains('is-active')) {
      win.classList.add('is-active'); // the window grows; keep the latest output in view once it has
      body.addEventListener('transitionend', () => { body.scrollTop = body.scrollHeight; }, { once: true });
    }
    print(`<span class="p">$ </span>${esc(line)}\n`);
    if (line.trim()) {
      history.push(line);
      if (history.length > HISTORY_MAX) history.shift();
    }
    cursor = history.length;
    const { lines, effect } = commands.run(line);
    if (effect?.clear) { log.innerHTML = ''; return; }
    if (lines.length) print(`${lines.map(renderLine).join('\n')}\n`);
    if (effect) onEffect(effect);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const line = input.value;
    input.value = '';
    exec(line);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && input.value) {
      const next = commands.complete(input.value);
      if (next !== input.value) { e.preventDefault(); input.value = next; } // otherwise Tab still leaves the field
    } else if (e.key === 'ArrowUp' && cursor > 0) {
      e.preventDefault();
      input.value = history[--cursor];
    } else if (e.key === 'ArrowDown' && cursor < history.length) {
      e.preventDefault();
      input.value = history[++cursor] ?? '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      log.innerHTML = '';
    }
  });

  // clicking the window focuses the prompt, unless it was a link or a text selection
  body.addEventListener('click', (e) => {
    if (!form.hidden && !e.target.closest('a') && !String(getSelection())) input.focus({ preventScroll: true });
  });

  return {
    /** Show the prompt once the intro has been typed. */
    ready() {
      log.querySelector('.cur')?.remove();
      form.hidden = false;
    },
    /** Type `line` into the prompt like a person would, then run it. */
    suggest(line) {
      if (typing || form.hidden) return;
      typing = true;
      input.value = '';
      let i = 0;
      const step = () => {
        if (i < line.length) { input.value += line[i++]; setTimeout(step, TYPE_MS); return; }
        typing = false;
        input.value = '';
        exec(line);
      };
      step();
    },
  };
}
