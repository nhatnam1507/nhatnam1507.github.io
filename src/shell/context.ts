// The one place the page context is built, on the server (Views) and on the
// client (behaviours), from the same build-time `now` (PLAN.md D9).
import { profile } from '@/content/profile';
import { careerStats, toRoles } from '@/domain/career';
import type { PageContext } from './contract';

export function createPageContext(now: Date): Omit<PageContext, 'index'> {
  const roles = toRoles(profile.experience, now);
  return { profile, roles, stats: careerStats(profile, roles, now), now };
}
