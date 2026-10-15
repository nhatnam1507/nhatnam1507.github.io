// STUB (S0): replaced by the slice that ports legacy/src/sections/hero/.
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
