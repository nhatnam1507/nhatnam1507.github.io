// Tiny DOM helpers shared by every layer that touches the page.

export const $ = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E | null =>
  root.querySelector<E>(selector);

export const $$ = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E[] => [
  ...root.querySelectorAll<E>(selector),
];

/** Like `$`, but the element is required: throws a descriptive error instead of returning null. */
export function $req<E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E {
  const el = root.querySelector<E>(selector);
  if (!el) throw new Error(`Required element "${selector}" not found`);
  return el;
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape text for safe interpolation into HTML strings (behaviours only; JSX escapes on its own). */
export const esc = (value: unknown): string => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

/** 3 → '03' */
export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Repeat a markup snippet n times (for grids of identical cells). */
export const repeat = (markup: string, n: number): string => markup.repeat(n);
