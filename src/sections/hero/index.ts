// hero: name decode, HUD locked onto the 3D core and the interactive terminal
// (markup in View.tsx, motion in behaviour.ts). Not in the nav.
import { defineSection } from '@/shell/contract';
import { HeroView } from './View';

export default defineSection({
  id: 'hero',
  kind: 'section',
  label: 'init',
  shape: 'core',
  nav: false,
  View: HeroView,
});
