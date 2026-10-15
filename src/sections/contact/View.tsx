// STUB (S0): markup ported from legacy/src/sections/contact/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function ContactView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="contact" />
      <p>TODO contact</p>
    </div>
  );
}
