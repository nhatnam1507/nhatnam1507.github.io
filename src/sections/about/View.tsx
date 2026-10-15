// STUB (S0): markup ported from legacy/src/sections/about/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function AboutView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="about" />
      <p>TODO about</p>
    </div>
  );
}
