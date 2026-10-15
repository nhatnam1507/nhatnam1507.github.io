// Renders blocks into the page and runs their lifecycle hooks in order.
import { $ } from '../shared/dom.js';
import { sections } from './registry.js';

const indexOf = (block) => sections.indexOf(block);

function wrap(block, ctx) {
  const inner = block.template(ctx);
  if (block.kind !== 'section') return inner;
  const cls = ['section', block.id, block.className].filter(Boolean).join(' ');
  return `<section id="${block.id}" class="${cls}" data-label="${block.label}">${inner}</section>`;
}

const rootOf = (block) => (block.kind === 'section' ? $(`#${block.id}`) : null);
const ctxFor = (block, ctx) => ({ ...ctx, index: indexOf(block) });

export function renderPage(container, blocks, ctx) {
  container.innerHTML = blocks.map((b) => wrap(b, ctxFor(b, ctx))).join('');
}

/** Mount behaviour top to bottom (required for correct pin spacing). */
export function mountPage(blocks, ctx) {
  blocks.forEach((b) => b.mount?.(rootOf(b), ctxFor(b, ctx)));
}

/** Run post-boot hooks (intros that should play once the page is visible). */
export function readyPage(blocks, ctx) {
  blocks.forEach((b) => b.onReady?.(rootOf(b), ctxFor(b, ctx)));
}
