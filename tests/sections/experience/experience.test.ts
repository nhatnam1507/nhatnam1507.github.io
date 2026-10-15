// Pure parts of the experience section: the timeline scale and the employer colours.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { monthIndex, toRoles } from '@/domain/career';
import { DEFAULT_COLOR, EMPLOYER_COLORS, colorOf } from '@/sections/experience/content';
import { timelineScale } from '@/sections/experience/timeline';
import { fixtureProfile } from '../../fixtures/profile';

// local time on purpose: monthIndex reads local year/month
const NOW = new Date(2026, 8, 28, 12);
const roles = toRoles(fixtureProfile().experience, NOW); // first role starts Sep 2020

test('timelineScale: axis runs from the first role’s year to the end of the current year', () => {
  const scale = timelineScale(roles, NOW);
  assert.deepEqual(scale.years, [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]);
  assert.equal(scale.now, monthIndex(NOW));
});

test('timelineScale: pct maps the axis ends to 0% and 100%', () => {
  const { pct } = timelineScale(roles, NOW);
  assert.equal(pct(2020 * 12), 0);
  assert.equal(pct(2027 * 12), 100);
});

test('timelineScale: pct is linear in months', () => {
  const { pct } = timelineScale(roles, NOW);
  const span = 7 * 12; // 2020 → 2027
  assert.equal(pct(2020 * 12 + 8), (8 / span) * 100); // Sep 2020, the first role
  assert.ok(Math.abs(pct(2023 * 12) - (3 / 7) * 100) < 1e-9);
});

test('timelineScale: a role starting late in a year still anchors the axis on January', () => {
  const [first] = roles;
  assert.ok(first);
  assert.equal(Math.floor(first.start / 12), 2020);
  assert.ok(timelineScale(roles, NOW).pct(first.start) > 0);
});

test('timelineScale: no roles falls back to the current year', () => {
  const scale = timelineScale([], NOW);
  assert.deepEqual(scale.years, [2026, 2027]);
});

test('colorOf returns the colour of a known employer', () => {
  assert.equal(colorOf('Toshiba'), EMPLOYER_COLORS.Toshiba);
  assert.equal(colorOf('Rikkeisoft'), EMPLOYER_COLORS.Rikkeisoft);
  assert.equal(colorOf('Andpad'), EMPLOYER_COLORS.Andpad);
});

test('colorOf falls back to the default colour for unknown employers', () => {
  assert.equal(colorOf('Gamma'), DEFAULT_COLOR);
  assert.equal(colorOf(''), DEFAULT_COLOR);
});

test('colorOf is looked up by the domain employer (first word of the company)', () => {
  const colors = roles.map((r) => colorOf(r.employer));
  assert.deepEqual(colors, [DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR, DEFAULT_COLOR]);
});
