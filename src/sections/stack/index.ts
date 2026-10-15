// stack: the toolset drawn as the system it builds (markup in View.tsx,
// pinned build-up and live widgets in behaviour.ts).
import { defineSection } from '@/shell/contract';
import { StackView } from './View';

export default defineSection({
  id: 'stack',
  kind: 'section',
  label: 'stack',
  shape: 'network',
  View: StackView,
});
