// Domain layer: career rules as pure functions. No DOM, no libraries, no
// knowledge of how anything is displayed, so it can move unchanged into any
// framework (or a backend) and be unit-tested in isolation.
//
// Time is modelled as a "month index" (year * 12 + month) so ranges, tenure
// and timeline positions are plain integer arithmetic.

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

/** @param {Date} date */
export const monthIndex = (date) => date.getFullYear() * 12 + date.getMonth();

/** 'Mar 2026' → month index; 'Present' → the month of `now`. */
export function parseMonth(label, now) {
  if (/present/i.test(label)) return monthIndex(now);
  const [m, y] = label.split(' ');
  return Number(y) * 12 + MONTHS[m.slice(0, 3)];
}

/** month index → '2023.02' */
export const formatMonth = (m) => `${Math.floor(m / 12)}.${String((m % 12) + 1).padStart(2, '0')}`;

/** 20 → '1y 8m' */
export function tenure(months) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ') || '<1m';
}

/** 'Toshiba Software Development' → 'Toshiba' (the employer a role belongs to) */
export const employerOf = (company) => company.split(' ')[0];

/**
 * Role entity: an experience entry enriched with its time range.
 * @typedef {object} Role
 * @property {number} start   month index
 * @property {number} end     month index
 * @property {number} months  tenure in months (≥ 1)
 * @property {string} employer
 */

/** Experience entries → Role[] sorted oldest first (ties: shorter first). */
export function toRoles(experience, now) {
  return experience
    .map((j) => {
      const start = parseMonth(j.start, now);
      const end = parseMonth(j.end, now);
      return { ...j, startLabel: j.start, endLabel: j.end, start, end, months: Math.max(1, end - start), employer: employerOf(j.company) };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Whole calendar years/months since an ISO date, plus elapsed seconds. */
export function uptime(sinceISO, now) {
  const start = new Date(sinceISO);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  return { years: Math.floor(months / 12), months: months % 12, seconds: Math.floor((now - start) / 1000) };
}

/** Headline numbers used across the page. */
export function careerStats(profile, roles, now) {
  return {
    years: Math.floor((now - new Date(profile.careerStart)) / MS_PER_YEAR),
    roles: roles.length,
    employers: new Set(roles.map((r) => r.employer)).size,
  };
}

/** Labels of the roles whose tags or bullets mention `pattern`. */
export function rolesUsing(roles, pattern) {
  return [...new Set(roles.filter((r) => pattern.test([...r.tags, ...r.bullets].join(' '))).map((r) => r.label))];
}

/** Every distinct skill in the profile, in declaration order. */
export const allSkills = (profile) => [...new Set(profile.skills.groups.flatMap((g) => g.items))];
