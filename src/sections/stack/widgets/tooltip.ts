// Hover/focus tooltip: which roles actually used a tool (derived from the
// experience data through the domain `rolesUsing`).
import type { Role } from '@/domain/types';
import { rolesUsing } from '@/domain/career';
import { esc } from '@/shared/dom';
import { LEVELS, toolAt } from '../content';

/** Where a tool was used: the roles that mention it, else a generic line by level. */
export function usageLine(roles: readonly Role[], key: string): string {
  const { level, pattern } = toolAt(key);
  const used = rolesUsing(roles, pattern);
  if (used.length) return `used at ${used.join(', ')}`;
  return level === 'explore' ? 'side projects & learning' : 'daily driver across projects';
}

/** Tooltip body for the tool behind a `data-k` key. */
export function tooltipHtml(roles: readonly Role[], key: string): string {
  const { name, level } = toolAt(key);
  return `<b>${esc(name)}</b><span class="tip-${level}">${LEVELS[level]}</span><small>${esc(usageLine(roles, key))}</small>`;
}

interface TooltipParts {
  /** the diagram board; its pointer/focus events drive the tooltip */
  board: HTMLElement;
  tip: HTMLElement;
  /** the (possibly scaled) frame the tip is positioned in */
  frame: HTMLElement;
  roles: readonly Role[];
  signal: AbortSignal;
}

export function attachTooltip({ board, tip, frame, roles, signal }: TooltipParts): void {
  const show = (el: HTMLElement, key: string) => {
    tip.innerHTML = tooltipHtml(roles, key);
    const r = el.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    const scale = f.width / frame.offsetWidth || 1;
    tip.style.left = `${(r.left - f.left + r.width / 2) / scale}px`;
    tip.style.top = `${(r.top - f.top) / scale}px`;
    tip.classList.add('is-on');
  };
  const hide = () => tip.classList.remove('is-on');
  const target = (e: Event): HTMLElement | null => (e.target instanceof Element ? e.target.closest('[data-k]') : null);
  const showFor = (e: Event) => {
    const el = target(e);
    const key = el?.dataset.k;
    if (el && key) show(el, key);
  };

  board.addEventListener('pointerover', showFor, { signal });
  board.addEventListener(
    'pointerout',
    (e) => {
      if (target(e)) hide();
    },
    { signal },
  );
  board.addEventListener('focusin', showFor, { signal });
  board.addEventListener('focusout', hide, { signal });
}
