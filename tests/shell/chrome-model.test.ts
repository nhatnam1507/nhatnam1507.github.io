// Nav numbers and the HUD total come from the section list, never hardcoded.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hudTotal, navItems } from '@/shell/chrome/model';
import type { SectionMeta } from '@/shell/contract';

const section = (id: SectionMeta['id'], extra: Partial<SectionMeta> = {}): SectionMeta => ({
  id,
  kind: 'section',
  label: id,
  shape: 'core',
  ...extra,
});

const SECTIONS = [
  section('hero', { label: 'init', nav: false }),
  section('about'),
  section('experience', { label: 'experience', navLabel: 'career' }),
  section('stack'),
  section('credentials', { nav: false }),
  section('contact'),
];

test('navItems skips the hero and sections with nav: false', () => {
  assert.deepEqual(
    navItems(SECTIONS).map((n) => n.id),
    ['about', 'experience', 'stack', 'contact'],
  );
});

test('navItems numbers come from the position among all sections', () => {
  assert.deepEqual(
    navItems(SECTIONS).map((n) => n.number),
    ['01', '02', '03', '05'],
  );
});

test('navItems uses navLabel when set, else the label', () => {
  const byId = Object.fromEntries(navItems(SECTIONS).map((n) => [n.id, n.text]));
  assert.equal(byId.experience, 'career');
  assert.equal(byId.about, 'about');
});

test('hero is never in the nav even if it forgot nav: false', () => {
  assert.deepEqual(
    navItems([section('hero'), section('about')]).map((n) => n.id),
    ['about'],
  );
});

test('hudTotal excludes the hero', () => {
  assert.equal(hudTotal(SECTIONS), '05');
  assert.equal(hudTotal([section('hero')]), '00');
});
