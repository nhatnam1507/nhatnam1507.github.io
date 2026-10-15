// STUB (S0): replaced by the slice that ports legacy/src/sections/contact/.
import { defineSection } from '@/shell/contract';
import { ContactView } from './View';

export default defineSection({
  id: 'contact',
  kind: 'section',
  label: 'contact',
  shape: 'portal',
  View: ContactView,
});
