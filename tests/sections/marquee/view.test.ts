// The marquee View is a Server Component: render it to static HTML, as the build does.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { allSkills } from '@/domain/career';
import { createPageContext } from '@/shell/context';
import { MarqueeView } from '@/sections/marquee/View';
import { fixtureProfile } from '../../fixtures/profile';

const profile = fixtureProfile();
const ctx = { ...createPageContext(new Date('2026-09-28T12:00:00+07:00')), profile, index: -1 };
const html = renderToStaticMarkup(createElement(MarqueeView, { ctx }));
const row = allSkills(profile)
  .map((skill) => `<span>${skill}</span><i>✦</i>`)
  .join('');

test('the strip is decorative: hidden from assistive tech', () => {
  expect(html.startsWith('<div class="marquee" aria-hidden="true"><div class="marquee-inner">')).toBe(true);
});

test('the skills row is doubled so the -50% keyframe loops seamlessly', () => {
  expect(row).not.toBe('');
  expect(html).toBe(`<div class="marquee" aria-hidden="true"><div class="marquee-inner">${row}${row}</div></div>`);
});
