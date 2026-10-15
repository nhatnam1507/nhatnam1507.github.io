// tail -f log stream: appends a line per tick and keeps the last few.
import { esc } from '@/shared/dom';
import type { LogLine } from '../content';

export const KEEP = 8;

/** One log row's inner markup. */
export const logMarkup = (level: string, message: string, time: string): string =>
  `<span class="log-t">${esc(time)}</span><span class="log-l">${level}</span><span class="log-m">${esc(message)}</span>`;

export interface LogStream {
  push(): void;
}

export function createLogStream(
  el: HTMLElement,
  lines: readonly LogLine[],
  formatTime: (d: Date) => string,
): LogStream {
  el.replaceChildren(); // idempotent under StrictMode's double mount
  let i = 0;
  return {
    push() {
      const [level, message] = lines[i++ % lines.length];
      const row = document.createElement('div');
      row.className = `log log-${level.toLowerCase()}`;
      row.innerHTML = logMarkup(level, message, formatTime(new Date()));
      el.appendChild(row);
      while (el.children.length > KEEP) el.firstElementChild?.remove();
    },
  };
}
