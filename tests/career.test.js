// Domain rules are pure, so they run under plain `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { careerStats, employerOf, formatMonth, parseMonth, rolesUsing, tenure, toRoles, uptime } from '../src/domain/career.js';
import { profile } from '../src/content/profile.js';

const NOW = new Date('2026-09-28T12:00:00+07:00');

test('parseMonth reads "Mon YYYY" and Present', () => {
  assert.equal(parseMonth('Sep 2020', NOW), 2020 * 12 + 8);
  assert.equal(parseMonth('Present', NOW), 2026 * 12 + 8);
});

test('formatMonth and tenure', () => {
  assert.equal(formatMonth(2023 * 12 + 1), '2023.02');
  assert.equal(tenure(20), '1y 8m');
  assert.equal(tenure(12), '1y');
  assert.equal(tenure(0), '<1m');
});

test('employerOf takes the first word of the company', () => {
  assert.equal(employerOf('Toshiba Software Development'), 'Toshiba');
  assert.equal(employerOf('Andpad Vietnam'), 'Andpad');
});

test('toRoles sorts oldest first, shorter first on ties, keeps labels', () => {
  const roles = toRoles(profile.experience, NOW);
  assert.equal(roles[0].label, 'SCADA');
  assert.equal(roles.at(-1).label, 'Andpad');
  const [welby, ab] = roles.filter((r) => r.startLabel === 'Feb 2023');
  assert.equal(welby.label, 'Welby'); // Feb–Aug 2023 ends before AllianceBernstein
  assert.equal(ab.label, 'AllianceBernstein');
  assert.ok(roles.every((r) => r.months >= 1 && r.end >= r.start));
});

test('careerStats counts years, roles and employers', () => {
  const roles = toRoles(profile.experience, NOW);
  assert.deepEqual(careerStats(profile, roles, NOW), { years: 6, roles: 7, employers: 3 });
});

test('uptime is calendar based', () => {
  const u = uptime('2020-09-01', NOW);
  assert.equal(u.years, 6);
  assert.equal(u.months, 0);
  assert.ok(u.seconds > 6 * 365 * 24 * 3600);
});

test('rolesUsing finds roles by tags and bullets', () => {
  const roles = toRoles(profile.experience, NOW);
  assert.deepEqual(rolesUsing(roles, /kubernetes|\baks\b|\beks\b/i), ['AllianceBernstein', 'Andpad']);
  assert.deepEqual(rolesUsing(roles, /python/i), []);
});
