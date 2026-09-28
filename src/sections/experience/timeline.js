// View-model for the timeline: maps month indexes to % of the chart width.
// Pure, so the template and the scroll controller share one scale.
import { monthIndex } from '../../domain/career.js';

export function timelineScale(roles, now) {
  const t0 = Math.floor(roles[0].start / 12) * 12;
  const t1 = (now.getFullYear() + 1) * 12;
  const years = [];
  for (let y = t0 / 12; y <= t1 / 12; y++) years.push(y);
  return {
    now: monthIndex(now),
    years,
    pct: (m) => ((m - t0) / (t1 - t0)) * 100,
  };
}
