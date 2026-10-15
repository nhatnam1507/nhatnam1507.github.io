// Hero configuration: the HUD callouts and the terminal's suggested commands.

/** Callouts around the core: [label, skill group, angle° (0 = right, clockwise)]. */
const CALLOUTS = [
  ['lang', 'languages', -108],
  ['runtime', 'infra', -72],
  ['cloud', 'cloud', 72],
  ['data', 'data', 108],
];

/** profile → HUD slots with the items each callout cycles through. */
export const hudSlots = (profile) => CALLOUTS
  .map(([label, group, angle]) => ({ label, angle, items: profile.skills.groups.find((g) => g.label === group)?.items || [] }))
  .filter((s) => s.items.length);

/** One-click commands under the terminal. */
export const SUGGESTIONS = ['help', 'git log', 'skills', 'sudo hire nam'];
