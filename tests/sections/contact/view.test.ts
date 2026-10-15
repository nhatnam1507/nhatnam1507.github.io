// The View is a Server Component: render it to static HTML, as the build does.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { createPageContext } from '@/shell/context';
import { ContactView } from '@/sections/contact/View';
import { fixtureProfile } from '../../fixtures/profile';

const now = new Date('2026-09-28T12:00:00+07:00');
const ctx = { ...createPageContext(now), profile: fixtureProfile(), index: 6 };
const html = renderToStaticMarkup(createElement(ContactView, { ctx }));

describe('ContactView', () => {
  test('kicker number comes from ctx.index', () => {
    expect(html).toContain('<span>06</span> // contact');
  });

  test('the live clock and presence are placeholders for the behaviour', () => {
    expect(html).toContain('<b class="js-local">--:--:--</b>');
    expect(html).toContain('<span class="js-mood-i"></span>');
    expect(html).toContain('<span class="js-mood"></span>');
    expect(html).toContain('<code class="js-hello"></code>');
  });

  test('the version label uses the build-time year', () => {
    expect(html).toContain('v2026 · base url: Ha Noi, VN');
  });

  test('exactly one copy button, carrying the email', () => {
    expect(html.match(/js-copy/g)).toHaveLength(1);
    expect(html).toContain('data-copy="ada@example.com"');
    expect(html).toContain('aria-label="Copy ada@example.com"');
  });

  test('external profiles open in a new tab, mailto does not', () => {
    expect(html).toContain('href="https://github.com/ada" target="_blank" rel="noopener"');
    expect(html).toContain('<a class="ep-link" href="mailto:ada@example.com">');
  });

  test('the large export button is rendered', () => {
    expect(html).toContain('btn btn-primary btn-lg js-export');
  });
});
