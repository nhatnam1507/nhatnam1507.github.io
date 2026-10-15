// Hero content builders and terminal rendering are pure.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hudSlots, terminalLines } from '@/sections/hero/content';
import { renderLine } from '@/sections/hero/shell/terminal';
import { fixtureProfile } from '../../fixtures/profile';

test('hudSlots keeps only the callouts whose skill group exists', () => {
  const slots = hudSlots(fixtureProfile());
  assert.deepEqual(slots, [{ label: 'lang', angle: -108, items: ['Go', 'C / C++'] }]);
});

test('terminalLines types whoami then the career uptime', () => {
  const lines = terminalLines({ stats: { years: 8, employers: 3, roles: 4 } });
  assert.deepEqual(lines[0], { p: '$ ', t: 'whoami' });
  assert.deepEqual(lines[2], { p: '$ ', t: 'uptime --career' });
  assert.deepEqual(lines[3], { o: '8 years · 3 companies · 4 roles · still shipping' });
});

test('renderLine escapes text and opens absolute links in a new tab', () => {
  assert.equal(renderLine([['o', '<b>&']]), '<span class="o">&lt;b&gt;&amp;</span>');
  assert.equal(
    renderLine([['a', 'x', 'https://example.com']]),
    '<a href="https://example.com" target="_blank" rel="noopener">x</a>',
  );
  assert.equal(renderLine([['a', 'me', 'mailto:me@example.com']]), '<a href="mailto:me@example.com">me</a>');
});
