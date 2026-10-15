// STUB (S0): replaced by the slice that ports legacy/src/sections/experience/.
import { defineSection } from '@/shell/contract';
import { ExperienceView } from './View';

export default defineSection({
  id: 'experience',
  kind: 'section',
  label: 'experience',
  shape: 'lattice',
  View: ExperienceView,
});
