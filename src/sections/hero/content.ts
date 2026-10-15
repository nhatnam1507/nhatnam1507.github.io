// Hero configuration: the HUD callouts and the terminal's suggested commands.
import type { CareerStats, Profile } from '@/domain/types';
import type { TerminalLine } from '@/shared/text';

export interface HudSlot {
  label: string;
  /** degrees, 0 = right, clockwise */
  angle: number;
  /** the values the callout cycles through */
  items: string[];
}

/** Callouts around the core: [label, skill group, angle° (0 = right, clockwise)]. */
const CALLOUTS = [
  ['lang', 'languages', -108],
  ['runtime', 'infra', -72],
  ['cloud', 'cloud', 72],
  ['data', 'data', 108],
] as const;

/** profile → HUD slots with the items each callout cycles through. */
export const hudSlots = (profile: Pick<Profile, 'skills'>): HudSlot[] =>
  CALLOUTS.map(([label, group, angle]) => ({
    label,
    angle,
    items: profile.skills.groups.find((g) => g.label === group)?.items ?? [],
  })).filter((s) => s.items.length);

/** One-click commands under the terminal. */
export const SUGGESTIONS = ['help', 'git log', 'skills', 'sudo hire nam'] as const;

/** The whoami session typed into the hero terminal. */
export const terminalLines = ({ stats }: { stats: CareerStats }): TerminalLine[] => [
  { p: '$ ', t: 'whoami' },
  { o: 'nam — ships Go services, Kubernetes clusters & CI/CD pipelines' },
  { p: '$ ', t: 'uptime --career' },
  { o: `${stats.years} years · ${stats.employers} companies · ${stats.roles} roles · still shipping` },
];
