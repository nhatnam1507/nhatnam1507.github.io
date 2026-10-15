// 02 // experience: pinned career timeline (View = markup, behaviour = scroll scene).
import { defineSection } from '@/shell/contract';
import { ExperienceView } from './View';

export default defineSection({
  id: 'experience',
  kind: 'section',
  label: 'experience',
  shape: 'lattice',
  View: ExperienceView,
});
