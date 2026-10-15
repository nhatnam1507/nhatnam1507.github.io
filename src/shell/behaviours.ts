// Client-side half of each block: id → Behaviour. Order lives only in
// registry.ts; the `satisfies` makes a missing section a type error.
import type { Behaviour, SectionId } from './contract';
import hero from '@/sections/hero/behaviour';
import about from '@/sections/about/behaviour';
import experience from '@/sections/experience/behaviour';
import stack from '@/sections/stack/behaviour';
import marquee from '@/sections/marquee/behaviour';
import credentials from '@/sections/credentials/behaviour';
import contact from '@/sections/contact/behaviour';

export const behaviours = {
  hero,
  about,
  experience,
  stack,
  marquee,
  credentials,
  contact,
} satisfies Record<SectionId, Behaviour>;
