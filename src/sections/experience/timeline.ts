// View-model for the timeline: maps month indexes to % of the chart width.
// Pure, so the View and the scroll behaviour share one scale.
import { monthIndex } from '@/domain/career';
import type { Role } from '@/domain/types';

export interface TimelineScale {
  /** month index of `now` */
  now: number;
  /** calendar years shown on the axis */
  years: number[];
  /** month index → % of the chart width */
  pct(month: number): number;
}

/** `roles` are oldest first; the axis runs from the first role's year to the end of `now`'s year. */
export function timelineScale(roles: readonly Role[], now: Date): TimelineScale {
  const t0 = Math.floor((roles[0]?.start ?? monthIndex(now)) / 12) * 12;
  const t1 = (now.getFullYear() + 1) * 12;
  const years: number[] = [];
  for (let y = t0 / 12; y <= t1 / 12; y++) years.push(y);
  return {
    now: monthIndex(now),
    years,
    pct: (m) => ((m - t0) / (t1 - t0)) * 100,
  };
}
