import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../src/domain/profile-rules.js';
import { profile } from '../src/content/profile.js';
import { fixtureProfile } from './fixtures/profile.js';

const NOW = new Date('2026-09-28T12:00:00+07:00');
const errorsFor = (mutate) => {
  const p = fixtureProfile();
  mutate(p);
  return validateProfile(p, { now: NOW });
};
const hasError = (errors, path, pattern) =>
  assert.ok(errors.some((e) => e.path === path && pattern.test(e.message)), `expected ${path} ~ ${pattern}, got ${JSON.stringify(errors)}`);

test('the real CV source of truth is valid', () => {
  assert.deepEqual(validateProfile(profile), []);
});

test('the fixture is valid', () => {
  assert.deepEqual(validateProfile(fixtureProfile(), { now: NOW }), []);
});

test('typos in field names are rejected', () => {
  hasError(errorsFor((p) => { p.experience[0].bulets = p.experience[0].bullets; delete p.experience[0].bullets; }), 'profile.experience[0].bulets', /unknown field/);
  hasError(errorsFor((p) => { p.skils = {}; }), 'profile.skils', /unknown field/);
});

test('required text must be present and non-empty', () => {
  hasError(errorsFor((p) => { delete p.name; }), 'profile.name', /must be a string/);
  hasError(errorsFor((p) => { p.experience[1].role = '  '; }), 'profile.experience[1].role', /must not be empty/);
});

test('dates must use "Mon YYYY" and make sense', () => {
  hasError(errorsFor((p) => { p.experience[0].start = 'March 2024'; }), 'profile.experience[0].start', /must look like "Mar 2026"/);
  hasError(errorsFor((p) => { p.experience[1].end = 'Jan 2021'; }), 'profile.experience[1].end', /before start/);
  hasError(errorsFor((p) => { p.experience[0].start = 'Jan 2030'; }), 'profile.experience[0].start', /in the future/);
  hasError(errorsFor((p) => { p.careerStart = '2020/09/01'; }), 'profile.careerStart', /ISO date/);
});

test('experience must be newest first and labels unique', () => {
  hasError(errorsFor((p) => { p.experience.reverse(); }), 'profile.experience[1].start', /newest first/);
  hasError(errorsFor((p) => { p.experience[1].label = 'Acme'; }), 'profile.experience[1].label', /duplicate label/);
});

test('careerStart must match the earliest role', () => {
  hasError(errorsFor((p) => { p.careerStart = '2019-01-01'; }), 'profile.careerStart', /earliest role \(Sep 2020\)/);
});

test('contact fields are checked', () => {
  hasError(errorsFor((p) => { p.contact.email = 'ada.example.com'; }), 'profile.contact.email', /valid email/);
  hasError(errorsFor((p) => { p.contact.linkedin = 'https://linkedin.com/in/ada'; }), 'profile.contact.linkedin', /must start with/);
});

test('limits keep the layout intact', () => {
  hasError(errorsFor((p) => { p.certificates[0].badge = 'TOOLONG'; }), 'profile.certificates[0].badge', /max 4/);
  hasError(errorsFor((p) => { p.experience[0].tags = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']; }), 'profile.experience[0].tags', /max 8/);
  hasError(errorsFor((p) => { p.experience[0].tags = ['Go', 'Go']; }), 'profile.experience[0].tags[1]', /duplicate/);
});
