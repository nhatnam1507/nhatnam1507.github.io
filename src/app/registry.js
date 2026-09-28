// Page composition: the ordered list of blocks. This is the "include" list,
// and the single source for page order, nav numbering, the HUD and the 3D
// scene's shape sequence. Order matters: ScrollTrigger pins must be created
// top to bottom, and blocks are mounted in this order.
import hero from '../sections/hero/index.js';
import about from '../sections/about/index.js';
import experience from '../sections/experience/index.js';
import stack from '../sections/stack/index.js';
import marquee from '../sections/marquee/index.js';
import credentials from '../sections/credentials/index.js';
import contact from '../sections/contact/index.js';

export const blocks = [hero, about, experience, stack, marquee, credentials, contact];

/** Numbered sections only (strips excluded); index = position = kicker number. */
export const sections = blocks.filter((b) => b.kind === 'section');
