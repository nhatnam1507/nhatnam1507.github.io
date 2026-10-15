// A targeting HUD locked onto the 3D core: reticle rings around the sphere
// and callouts that cycle through the skill groups, decoding each new value.
import type { SceneHandle } from '@/shell/contract';
import { $req, $$ } from '@/shared/dom';
import { isDesktop } from '@/shared/env';
import { scramble } from '@/shared/text';
import type { HudSlot } from '../content';

const MIN_RADIUS = 110; // px; smaller than this and the callouts crowd the copy
const GAP = 26; // px between the sphere and where the callouts attach

const EDGE = 16; // px kept clear of the viewport edge

const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export interface Hud {
  /** Re-lock onto the core; hides the HUD where it doesn't fit. */
  place(): void;
  /** Advance one callout to its group's next item. */
  tick(): void;
  readonly hidden: boolean;
  parts(): { reticle: HTMLElement; tags: HTMLElement[]; status: HTMLElement };
}

/**
 * @param el     the .js-hud element
 * @param scene  the 3D scene (anchor source); null without WebGL, which keeps the HUD hidden
 * @param slots  callouts from hudSlots
 * @param avoid  copy the callouts must never cover
 */
export function createHud(
  el: HTMLElement,
  scene: SceneHandle | null,
  slots: readonly HudSlot[],
  avoid: readonly HTMLElement[] = [],
): Hud {
  const tags = $$('.hud-tag', el);
  const values = $$('.js-hud-v', el);
  const shown = slots.map(() => 0);
  let turn = 0;

  return {
    place() {
      const a = scene && isDesktop() ? scene.anchor('core') : null;
      el.hidden = !a || a.r < MIN_RADIUS;
      if (!a || el.hidden) return;
      el.style.left = `${a.x}px`;
      el.style.top = `${a.y}px`;
      el.style.setProperty('--r', `${a.r}px`);
      const R = a.r + GAP;
      tags.forEach((tag, i) => {
        const rad = (slots[i].angle * Math.PI) / 180;
        tag.style.left = `${Math.cos(rad) * R}px`;
        tag.style.top = `${Math.sin(rad) * R}px`;
        tag.classList.toggle('is-left', Math.cos(rad) < 0);
      });
      // drop any callout that would cover the copy or run off screen
      const blocked = avoid.map((node) => node.getBoundingClientRect());
      tags.forEach((tag) => {
        tag.classList.remove('is-off');
        const r = tag.getBoundingClientRect();
        const offscreen = r.left < EDGE || r.right > innerWidth - EDGE;
        tag.classList.toggle('is-off', offscreen || blocked.some((b) => overlaps(r, b)));
      });
    },
    tick() {
      const i = turn++ % slots.length;
      const items = slots[i].items;
      shown[i] = (shown[i] + 1) % items.length;
      values[i].dataset.text = items[shown[i]];
      scramble(values[i], { duration: 0.7 });
    },
    get hidden() {
      return el.hidden === true;
    },
    parts: () => ({ reticle: $req('.hud-reticle', el), tags, status: $req('.hud-status', el) }),
  };
}
