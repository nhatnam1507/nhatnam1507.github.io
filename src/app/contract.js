// The contract every page block implements: the one interface the app shell
// depends on (dependency inversion). A block is either a numbered `section`
// (in the nav, HUD and 3D scene sequence) or a decorative `strip`.
//
// Adding a feature = create src/sections/<name>/ exporting defineSection({...})
// and list it in src/app/registry.js. Nothing else changes (open/closed).

/**
 * @typedef {object} PageContext
 * @property {object} profile          content (src/content/profile.js)
 * @property {object[]} roles          domain Role[] (oldest first)
 * @property {{years:number, roles:number, employers:number}} stats
 * @property {Date} now
 * @property {{reducedMotion:boolean, finePointer:boolean}} env
 * @property {number} index            position among sections (hero = 0)
 */

/**
 * @typedef {object} Block
 * @property {string} id                  DOM id and anchor (#id)
 * @property {'section'|'strip'} kind
 * @property {string} [label]             HUD / kicker label
 * @property {string} [navLabel]          nav text when it differs from label
 * @property {boolean} [nav]              false to leave it out of the nav (default true)
 * @property {string} [shape]             3D scene shape shown for this section
 * @property {string} [className]         extra classes on the <section>
 * @property {(ctx: PageContext) => string} template   markup (pure)
 * @property {(root: HTMLElement, ctx: PageContext) => void} [mount]   behaviour
 * @property {(root: HTMLElement, ctx: PageContext) => void} [onReady] runs after the boot screen
 */

const REQUIRED = { section: ['id', 'label', 'shape', 'template'], strip: ['id', 'template'] };

/** Validate and freeze a block definition (fails fast on a malformed section). */
export function defineSection(def) {
  const block = { kind: 'section', ...def };
  const missing = (REQUIRED[block.kind] || ['kind']).filter((k) => block[k] === undefined);
  if (missing.length) throw new Error(`Section "${block.id}" is missing: ${missing.join(', ')}`);
  return Object.freeze(block);
}
