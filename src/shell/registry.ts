// Page composition: the ordered list of blocks. This is the "include" list,
// and the single source for page order, mount order, nav numbering, the HUD
// and the 3D scene's shape sequence. Order matters: ScrollTrigger pins must be
// created top to bottom, and blocks are mounted in this order.
// Server-safe: imports definitions + Views only, never behaviours.
import hero from '@/sections/hero';
import about from '@/sections/about';
import experience from '@/sections/experience';
import stack from '@/sections/stack';
import marquee from '@/sections/marquee';
import credentials from '@/sections/credentials';
import contact from '@/sections/contact';
import { isSection, toMeta, type Block, type BlockMeta, type SectionBlock, type SectionMeta } from './contract';

export const blocks = [
  hero,
  about,
  experience,
  stack,
  marquee,
  credentials,
  contact,
] as const satisfies readonly Block[];

/** Numbered sections only (strips excluded); index = position = kicker number. */
export const sections: readonly SectionBlock[] = blocks.filter((b): b is typeof b & SectionBlock => isSection(b));

/** Serializable metadata for the client runtime and chrome, same order. */
export const blockMeta: readonly BlockMeta[] = blocks.map(toMeta);
export const sectionMeta: readonly SectionMeta[] = blockMeta.filter(isSection);
