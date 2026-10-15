// Credentials presentation rules are pure, so they run under Vitest with no DOM.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { identicon, lifePath, sealFill, verifyResult } from '@/sections/credentials/content';
import { fixtureProfile } from '../../fixtures/profile';

const NOW = new Date('2026-09-28T12:00:00+07:00');

test('sealFill turns "score / max" ids into a ring fraction, other ids into a full ring', () => {
  assert.equal(sealFill({ id: '810 / 990' }), 810 / 990);
  assert.equal(sealFill({ id: '810/990' }), 810 / 990);
  assert.equal(sealFill({ id: 'ABC123' }), 1);
  assert.equal(sealFill({ id: '12345' }), 1);
});

test('verifyResult prints the score for scored ids and the date otherwise', () => {
  assert.equal(verifyResult({ id: '810 / 990', date: 'May 27, 2023' }), 'score 810/990 · 82% of max');
  assert.equal(verifyResult({ id: 'ABC123', date: 'May 27, 2023' }), 'record found · May 27, 2023');
});

test('identicon is deterministic, size*size long and mirrored left to right', () => {
  const a = identicon('ABC123');
  assert.deepEqual(a, identicon('ABC123'));
  assert.equal(a.length, 25);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) assert.equal(a[r * 5 + c], a[r * 5 + (4 - c)]);
  }
  assert.equal(identicon('ABC123', 7).length, 49);
});

test('identicon differs between ids', () => {
  assert.notDeepEqual(identicon('ABC123'), identicon('810 / 990'));
});

test('lifePath puts compile → deploy → runtime on one scale', () => {
  // Sep 2016 → May 2020 → careerStart 2020-09 → now Sep 2026
  const path = lifePath(fixtureProfile(), NOW);
  assert.deepEqual(path.months, { study: 44, gap: 4, career: 72 });
  const span = 2026 * 12 + 8 - (2016 * 12 + 8); // 120 months
  assert.equal(path.stops.graduated, (44 / span) * 100);
  assert.equal(path.stops.deployed, (48 / span) * 100);
  assert.ok(path.stops.graduated < path.stops.deployed && path.stops.deployed < 100);
});

test('lifePath lists each January between the degree start and now', () => {
  const { years } = lifePath(fixtureProfile(), NOW);
  assert.deepEqual(
    years.map((y) => y.year),
    [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  );
  // Jan 2017 sits 4 months after the Sep 2016 start, out of 120
  assert.equal(years[0].at, (4 / 120) * 100);
  assert.ok(years.every((y, i) => i === 0 || y.at > years[i - 1].at));
});

test('lifePath resolves a "Present" degree end to the month of now', () => {
  const profile = fixtureProfile();
  profile.education = [{ ...profile.education[0], end: 'Present' }];
  assert.equal(lifePath(profile, NOW).months.study, 120);
});
