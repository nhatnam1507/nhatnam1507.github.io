// Pure view-model helpers for the chrome (what the markup shows), kept apart
// from the components so they can be unit-tested.
import { pad2 } from '@/shared/dom';
import { navSections, type SectionId, type SectionMeta } from '../contract';

export interface NavItem {
  id: SectionId;
  /** two-digit position among all sections (hero = 00), the same as the kicker number */
  number: string;
  text: string;
}

/** Nav links: every section after the hero, unless it opted out with `nav: false`. */
export function navItems(sections: readonly SectionMeta[]): NavItem[] {
  return navSections(sections).map((s) => ({
    id: s.id,
    number: pad2(sections.indexOf(s)),
    text: s.navLabel || s.label,
  }));
}

/** The HUD's section total: the hero is index 0 and not counted. */
export const hudTotal = (sections: readonly SectionMeta[]): string => pad2(sections.length - 1);
