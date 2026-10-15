// Decorative strip (kind: strip): not numbered, not tracked, no behaviour.
import { defineSection } from '@/shell/contract';
import { MarqueeView } from './View';

export default defineSection({
  id: 'marquee',
  kind: 'strip',
  View: MarqueeView,
});
