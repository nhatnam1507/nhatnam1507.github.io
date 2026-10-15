// Contact copy and rules are pure, so they run with no DOM.
import { describe, expect, test } from 'vitest';
import { endpoints, handshake, presence } from '@/sections/contact/content';
import { fixtureProfile } from '../../fixtures/profile';

describe('presence', () => {
  const asleep = { icon: '💤', text: 'asleep · replies after coffee' };

  test.each([
    [0, asleep],
    [6, asleep],
    [7, { icon: '☕', text: 'brewing coffee' }],
    [8, { icon: '☕', text: 'brewing coffee' }],
    [9, { icon: '⌨', text: 'in focus mode' }],
    [11, { icon: '⌨', text: 'in focus mode' }],
    [12, { icon: '🍜', text: 'lunch break' }],
    [13, { icon: '🚀', text: 'shipping' }],
    [17, { icon: '🚀', text: 'shipping' }],
    [18, { icon: '🌙', text: 'off hours · still reads mail' }],
    [22, { icon: '🌙', text: 'off hours · still reads mail' }],
    [23, asleep],
  ])('hour %i', (hour, expected) => {
    expect(presence(hour)).toEqual(expected);
  });

  test('every hour of the day has an icon and a text', () => {
    for (let h = 0; h < 24; h++) {
      const p = presence(h);
      expect(p.icon).not.toBe('');
      expect(p.text).not.toBe('');
    }
  });
});

describe('endpoints', () => {
  const rows = endpoints(fixtureProfile().contact);

  test('one row per channel, in order', () => {
    expect(rows.map((r) => [r.method, r.path])).toEqual([
      ['POST', '/email'],
      ['GET', '/linkedin'],
      ['GET', '/github'],
    ]);
  });

  test('hrefs: mail client for email, https for the web profiles', () => {
    expect(rows.map((r) => r.href)).toEqual([
      'mailto:ada@example.com',
      'https://www.linkedin.com/in/ada',
      'https://github.com/ada',
    ]);
  });

  test('values are the raw profile strings', () => {
    expect(rows.map((r) => r.value)).toEqual(['ada@example.com', 'linkedin.com/in/ada', 'github.com/ada']);
  });

  test('only the email endpoint copies', () => {
    expect(rows.filter((r) => r.copy).map((r) => r.path)).toEqual(['/email']);
  });
});

describe('handshake', () => {
  const lines = handshake(fixtureProfile());

  test('alternates typed commands and printed output', () => {
    expect(lines.map((l) => ('o' in l ? 'o' : 'cmd'))).toEqual(['cmd', 'o', 'cmd', 'o']);
  });

  test('commands carry the shell prompt', () => {
    const commands = lines.filter((l) => 'p' in l);
    expect(commands).toEqual([
      { p: '$ ', t: 'ping nam' },
      { p: '$ ', t: `curl -X POST /collab -d '{"idea":"yours"}'` },
    ]);
  });

  test('the ping line names the profile location', () => {
    expect(lines[1]).toEqual({ o: 'PING nam (Hanoi, Vietnam · UTC+7): reply time < 1 day' });
  });

  test('ends on the 202 reply', () => {
    expect(lines[3]).toEqual({ o: 'HTTP/1.1 202 Accepted — let’s talk ✉' });
  });
});
