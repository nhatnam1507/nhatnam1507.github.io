// Domain rules are pure, so they run under plain `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { careerStats, employerOf, formatMonth, parseMonth, rolesUsing, tenure, toRoles, uptime } from '../src/domain/career.js';
import { fixtureProfile } from './fixtures/profile.js';

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
  const roles = toRoles(fixtureProfile().experience, NOW);
  assert.deepEqual(roles.map((r) => r.label), ['Gamma', 'Migration', 'Payments', 'Acme']);
  assert.equal(roles[0].startLabel, 'Sep 2020');
  assert.equal(roles.at(-1).endLabel, 'Present');
  assert.ok(roles.every((r) => r.months >= 1 && r.end >= r.start));
});

test('careerStats counts years, roles and employers', () => {
  const profile = fixtureProfile();
  const roles = toRoles(profile.experience, NOW);
  assert.deepEqual(careerStats(profile, roles, NOW), { years: 6, roles: 4, employers: 3 });
});

test('uptime is calendar based', () => {
  const u = uptime('2020-09-01', NOW);
  assert.equal(u.years, 6);
  assert.equal(u.months, 0);
  assert.ok(u.seconds > 6 * 365 * 24 * 3600);
});

test('rolesUsing finds roles by tags and bullets', () => {
  const roles = toRoles(fixtureProfile().experience, NOW);
  assert.deepEqual(rolesUsing(roles, /kubernetes|\beks\b/i), ['Acme']);
  assert.deepEqual(rolesUsing(roles, /\bgo\b/i), ['Payments', 'Acme']);
  assert.deepEqual(rolesUsing(roles, /haskell/i), []);
});
