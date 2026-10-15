// The contract every page block implements: the one interface the app shell
// depends on (dependency inversion). A block is either a numbered `section`
// (in the nav, HUD and 3D scene sequence) or a decorative `strip`.
//
// A block is split in two (see docs/nextjs-migration/PLAN.md, D3):
//   - its definition (`sections/<name>/index.ts`): metadata + a View, which is
//     a Server Component rendered at build time (markup only, ships no JS);
//   - its behaviour (`sections/<name>/behaviour.ts`): the imperative mount /
//     onReady hooks, run by the client runtime in registry order.
//
// Adding a feature = create src/sections/<name>/, list it in registry.ts and
// behaviours.ts, and add its CSS to src/styles/portfolio.css (open/closed).
import type { ReactNode } from 'react';
import type { CareerStats, Profile, Role } from '@/domain/types';
import type { Env } from '@/shared/env';

export type { Env };

export type SectionId = 'hero' | 'about' | 'experience' | 'stack' | 'marquee' | 'credentials' | 'contact';
export type ShapeName = 'core' | 'helix' | 'lattice' | 'network' | 'knot' | 'portal';

export interface SceneHandle {
  /** p is a float index into the shape sequence (0 .. length - 1) */
  setProgress(p: number): void;
  /** jump straight to the current target (used behind the nav curtain) */
  snap(): void;
  /** where a shape sits on screen at rest: centre and bounding radius in CSS px */
  anchor(shape: ShapeName): { x: number; y: number; r: number };
}

/** Services the shell offers to sections, so sections never reach into shell DOM. */
export interface ShellServices {
  /** curtain jump to a section */
  navigate(id: SectionId): void;
  /** download the PDF and show the toast */
  exportCv(): void;
  /** show `html` in the page's single toast */
  toast(html: string): void;
}

/** Data only, safe for Server Components. */
export interface PageContext {
  profile: Profile;
  /** oldest first */
  roles: Role[];
  stats: CareerStats;
  /** build time (D9): Views and behaviours agree on it */
  now: Date;
  /** position among sections (hero = 0; strips get -1) */
  index: number;
}

/** What behaviours get: data + runtime environment + services. */
export interface RuntimeContext extends PageContext {
  env: Env;
  /** null without WebGL */
  scene: SceneHandle | null;
  services: ShellServices;
  /** sections shown in the nav, in order */
  navTargets: SectionId[];
  /** aborted on teardown: pass it to every addEventListener */
  signal: AbortSignal;
}

export type Cleanup = () => void;

export interface Behaviour {
  /** Runs top to bottom in registry order (ScrollTrigger pins need it). `root` is null for strips. */
  mount?(root: HTMLElement | null, ctx: RuntimeContext): Cleanup | void;
  /** Runs after the boot screen lifts. */
  onReady?(root: HTMLElement | null, ctx: RuntimeContext): void;
}

/** A View renders a block's markup from page data. */
export type View = (props: { ctx: PageContext }) => ReactNode;

export interface SectionMeta {
  id: SectionId;
  kind: 'section';
  /** HUD / kicker label */
  label: string;
  /** 3D scene shape shown for this section */
  shape: ShapeName;
  /** nav text when it differs from label */
  navLabel?: string;
  /** false to leave it out of the nav (default true) */
  nav?: boolean;
  /** extra classes on the <section> */
  className?: string;
}

export interface StripMeta {
  id: SectionId;
  kind: 'strip';
}

/** Serializable block metadata: what the client runtime and the chrome need. */
export type BlockMeta = SectionMeta | StripMeta;

export type SectionBlock = SectionMeta & { View: View };
export type StripBlock = StripMeta & { View: View };
export type Block = SectionBlock | StripBlock;

export const defineSection = <B extends Block>(block: B): Readonly<B> => Object.freeze(block);
export const defineBehaviour = (behaviour: Behaviour): Readonly<Behaviour> => Object.freeze(behaviour);

export const isSection = <B extends BlockMeta>(b: B): b is Extract<B, { kind: 'section' }> => b.kind === 'section';

/** Strip the View so a block can cross the server → client boundary. */
export function toMeta(block: Block): BlockMeta {
  const { View: _view, ...meta } = block;
  return meta;
}

/** Sections listed in the nav: everything after the hero, unless `nav: false`. */
export const navSections = <S extends SectionMeta>(sections: readonly S[]): S[] =>
  sections.filter((s, i) => i > 0 && s.nav !== false);
