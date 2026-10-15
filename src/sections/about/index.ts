// 01 // about: the dashboard section (markup in View.tsx, motion in behaviour.ts).
import { defineSection } from '@/shell/contract';
import { AboutView } from './View';

export default defineSection({
  id: 'about',
  kind: 'section',
  label: 'about',
  shape: 'helix',
  View: AboutView,
});
