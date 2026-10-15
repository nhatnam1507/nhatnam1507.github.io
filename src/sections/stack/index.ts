// STUB (S0): replaced by the slice that ports legacy/src/sections/stack/.
import { defineSection } from '@/shell/contract';
import { StackView } from './View';

export default defineSection({
  id: 'stack',
  kind: 'section',
  label: 'stack',
  shape: 'network',
  View: StackView,
});
