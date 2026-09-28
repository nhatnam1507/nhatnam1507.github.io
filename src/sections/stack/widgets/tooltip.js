// Hover/focus tooltip: which roles actually used a tool (derived from the
// experience data through the domain `rolesUsing`).
import { esc } from '../../../shared/dom.js';
import { rolesUsing } from '../../../domain/career.js';
import { LEVELS, toolAt } from '../content.js';

export function attachTooltip({ board, tip, frame, roles }) {
  const show = (el) => {
    const { name, level, pattern } = toolAt(el.dataset.k);
    const used = rolesUsing(roles, pattern);
    const where = used.length ? `used at ${used.join(', ')}` : level === 'explore' ? 'side projects & learning' : 'daily driver across projects';
    tip.innerHTML = `<b>${esc(name)}</b><span class="tip-${level}">${LEVELS[level]}</span><small>${esc(where)}</small>`;
    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const scale = f.width / frame.offsetWidth || 1;
    tip.style.left = `${(r.left - f.left + r.width / 2) / scale}px`;
    tip.style.top = `${(r.top - f.top) / scale}px`;
    tip.classList.add('is-on');
  };
  const hide = () => tip.classList.remove('is-on');
  const target = (e) => e.target.closest('[data-k]');

  board.addEventListener('pointerover', (e) => { const el = target(e); if (el) show(el); });
  board.addEventListener('pointerout', (e) => { if (target(e)) hide(); });
  board.addEventListener('focusin', (e) => { const el = target(e); if (el) show(el); });
  board.addEventListener('focusout', hide);
}
