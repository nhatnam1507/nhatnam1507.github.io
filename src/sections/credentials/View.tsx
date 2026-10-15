// STUB (S0): markup ported from legacy/src/sections/credentials/template.js.
import type { PageContext } from '@/shell/contract';
import { Kicker } from '@/shared/ui';

export function CredentialsView({ ctx }: { ctx: PageContext }) {
  return (
    <div className="container">
      <Kicker index={ctx.index} label="certs" />
      <p>TODO credentials</p>
    </div>
  );
}
