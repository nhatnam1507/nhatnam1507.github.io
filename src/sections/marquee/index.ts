// STUB (S0): replaced by S8 (legacy/src/sections/marquee/index.js).
import { defineSection } from '@/shell/contract';
import { MarqueeView } from './View';

export default defineSection({
  id: 'marquee',
  kind: 'strip',
  View: MarqueeView,
});
