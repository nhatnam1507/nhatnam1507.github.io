// STUB (S0): replaced by the slice that ports legacy/src/sections/about/.
import { defineSection } from '@/shell/contract';
import { AboutView } from './View';

export default defineSection({
  id: 'about',
  kind: 'section',
  label: 'about',
  shape: 'helix',
  View: AboutView,
});
