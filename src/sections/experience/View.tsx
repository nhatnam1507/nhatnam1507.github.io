// STUB (S0): markup ported from legacy/src/sections/experience/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function ExperienceView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="experience" />
      <p>TODO experience</p>
    </div>
  );
}
