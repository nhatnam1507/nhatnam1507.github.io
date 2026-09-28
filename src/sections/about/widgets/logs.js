// tail -f log stream: appends a line per tick and keeps the last few.
import { esc } from '../../../shared/dom.js';

const KEEP = 8;

export function createLogStream(el, lines, formatTime) {
  let i = 0;
  return {
    push() {
      const [level, msg] = lines[i++ % lines.length];
      const row = document.createElement('div');
      row.className = `log log-${level.toLowerCase()}`;
      row.innerHTML = `<span class="log-t">${formatTime(new Date())}</span><span class="log-l">${level}</span><span class="log-m">${esc(msg)}</span>`;
      el.appendChild(row);
      while (el.children.length > KEEP) el.firstElementChild.remove();
    },
  };
}
