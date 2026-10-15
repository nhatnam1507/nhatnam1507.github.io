// STUB (S0): markup ported from legacy/src/sections/hero/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function HeroView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="init" />
      <p>TODO hero</p>
    </div>
  );
}
