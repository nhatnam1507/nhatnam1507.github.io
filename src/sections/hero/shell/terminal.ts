// The hero terminal as a real prompt: renders command output, keeps a history
// (↑/↓), tab-completes and can "type" a suggested command for the visitor.
import { esc } from '@/shared/dom';
import type { Commands, Line, ShellEffect } from './commands';

const HISTORY_MAX = 50;
const TYPE_MS = 45;

/** One output line as HTML: spans by token class, links open externally when absolute. */
export const renderLine = (tokens: Line): string =>
  tokens
    .map(([cls, text, href = '']) =>
      cls === 'a'
        ? `<a href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}</a>`
        : `<span class="${cls}">${esc(text)}</span>`,
    )
    .join('');

export interface TerminalElements {
  /** gets .is-active once used */
  win: HTMLElement;
  body: HTMLElement;
  log: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
}

export interface Terminal {
  /** Show the prompt once the intro has been typed. */
  ready(): void;
  /** Type `line` into the prompt like a person would, then run it. */
  suggest(line: string): void;
}

/** Everything the terminal listens to or schedules is undone when `signal` aborts. */
export function createTerminal(
  { win, body, log, form, input }: TerminalElements,
  commands: Commands,
  onEffect: (effect: ShellEffect) => void,
  signal: AbortSignal,
): Terminal {
  const history: string[] = [];
  let cursor = 0;
  let typing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  signal.addEventListener('abort', () => clearTimeout(timer), { once: true });

  const print = (html: string) => {
    log.insertAdjacentHTML('beforeend', html);
    body.scrollTop = body.scrollHeight;
  };

  function exec(line: string) {
    if (!win.classList.contains('is-active')) {
      win.classList.add('is-active'); // the window grows; keep the latest output in view once it has
      body.addEventListener(
        'transitionend',
        () => {
          body.scrollTop = body.scrollHeight;
        },
        { once: true, signal },
      );
    }
    print(`<span class="p">$ </span>${esc(line)}\n`);
    if (line.trim()) {
      history.push(line);
      if (history.length > HISTORY_MAX) history.shift();
    }
    cursor = history.length;
    const { lines, effect } = commands.run(line);
    if (effect && 'clear' in effect) {
      log.innerHTML = '';
      return;
    }
    if (lines.length) print(`${lines.map(renderLine).join('\n')}\n`);
    if (effect) onEffect(effect);
  }

  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const line = input.value;
      input.value = '';
      exec(line);
    },
    { signal },
  );

  input.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Tab' && input.value) {
        const next = commands.complete(input.value);
        if (next !== input.value) {
          e.preventDefault(); // otherwise Tab still leaves the field
          input.value = next;
        }
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
    },
    { signal },
  );

  // clicking the window focuses the prompt, unless it was a link or a text selection
  body.addEventListener(
    'click',
    (e) => {
      const onLink = e.target instanceof Element && e.target.closest('a');
      if (!form.hidden && !onLink && !String(getSelection())) input.focus({ preventScroll: true });
    },
    { signal },
  );

  return {
    ready() {
      log.querySelector('.cur')?.remove();
      form.hidden = false;
    },
    suggest(line) {
      if (typing || form.hidden) return;
      typing = true;
      input.value = '';
      let i = 0;
      const step = () => {
        if (i < line.length) {
          input.value += line[i++];
          timer = setTimeout(step, TYPE_MS);
          return;
        }
        typing = false;
        input.value = '';
        exec(line);
      };
      step();
    },
  };
}
