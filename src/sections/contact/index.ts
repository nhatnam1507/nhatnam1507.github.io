// 05 // contact — registry entry; behaviour lives in ./behaviour.ts.
import { defineSection } from '@/shell/contract';
import { ContactView } from './View';

export default defineSection({
  id: 'contact',
  kind: 'section',
  label: 'contact',
  shape: 'portal',
  View: ContactView,
});
