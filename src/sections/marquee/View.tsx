// Decorative strip of every skill, scrolling sideways (CSS animation).
// Ported from legacy/src/sections/marquee/index.js.
import { Fragment } from 'react';
import { allSkills } from '@/domain/career';
import type { PageContext } from '@/shell/contract';

export function MarqueeView({ ctx }: { ctx: PageContext }) {
  const row = allSkills(ctx.profile).map((skill) => (
    <Fragment key={skill}>
      <span>{skill}</span>
      <i>✦</i>
    </Fragment>
  ));
  // the row is doubled so the -50% keyframe loops seamlessly
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-inner">
        {row}
        {row}
      </div>
    </div>
  );
}
