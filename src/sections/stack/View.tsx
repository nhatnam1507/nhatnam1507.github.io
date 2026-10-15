// STUB (S0): markup ported from legacy/src/sections/stack/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function StackView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="stack" />
      <p>TODO stack</p>
    </div>
  );
}
