// Tiny DOM helpers shared by every layer that touches the page.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape text for safe interpolation into HTML templates. */
export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** 3 → '03' */
export const pad2 = (n) => String(n).padStart(2, '0');

/** Repeat a markup snippet n times (for grids of identical cells). */
export const repeat = (markup, n) => markup.repeat(n);
