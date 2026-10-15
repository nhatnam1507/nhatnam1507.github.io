import { describe, expect, it } from 'vitest';
import { nextLevel, stateOf } from '@/sections/about/widgets/gauge';
import { MAX_CPU, nextCpu, zombiePhase } from '@/sections/about/widgets/htop';
import { KEEP, logMarkup } from '@/sections/about/widgets/logs';
import { uptimeText } from '@/sections/about/widgets/uptime';

describe('gauge', () => {
  it('names the caffeine state by threshold', () => {
    expect(stateOf(100)).toBe('nominal');
    expect(stateOf(80)).toBe('nominal');
    expect(stateOf(79.9)).toBe('degraded');
    expect(stateOf(55)).toBe('degraded');
    expect(stateOf(54.9)).toBe('refill needed ☕');
    expect(stateOf(0)).toBe('refill needed ☕');
  });

  it('empties the cup on every 5th sip only', () => {
    for (const rand of [0, 0.5, 1]) {
      expect(nextLevel(5, rand)).toBeLessThan(55);
      expect(nextLevel(10, rand)).toBeLessThan(55);
      for (const sip of [1, 2, 3, 4, 6]) expect(nextLevel(sip, rand)).toBeGreaterThanOrEqual(78);
    }
  });
});

describe('htop', () => {
  it('jitters the cpu reading around its base', () => {
    expect(nextCpu(30, 0.5)).toBe(30);
    expect(nextCpu(30, 1)).toBe(37);
    expect(nextCpu(30, 0)).toBe(23);
  });

  it('clamps the cpu reading to 2‥MAX_CPU', () => {
    expect(nextCpu(1, 0)).toBe(2);
    expect(nextCpu(MAX_CPU, 1)).toBe(MAX_CPU);
  });

  it('respawns and re-kills the zombie on a six-beat cycle', () => {
    const phases = Array.from({ length: 12 }, (_, i) => zombiePhase(i + 1));
    expect(phases).toEqual([null, null, null, 'respawn', 'killed', null, null, null, null, 'respawn', 'killed', null]);
  });
});

describe('logs', () => {
  it('escapes the message and the time, and tags the level', () => {
    const html = logMarkup('WARN', '"<b>" & co', '<t>');
    expect(html).toContain('<span class="log-l">WARN</span>');
    expect(html).toContain('&quot;&lt;b&gt;&quot; &amp; co');
    expect(html).toContain('&lt;t&gt;');
    expect(html).not.toContain('<b>');
  });

  it('keeps the last 8 lines', () => {
    expect(KEEP).toBe(8);
  });
});

describe('uptimeText', () => {
  it('formats whole years and months since the career start', () => {
    const { big } = uptimeText('2020-09-01', new Date('2026-03-15T00:00:00'));
    expect(big).toBe('5y 6m');
  });

  it('groups the elapsed seconds with commas', () => {
    const since = '2020-09-01T00:00:00Z';
    const now = new Date('2026-03-15T00:00:00Z');
    const seconds = Math.floor((now.getTime() - new Date(since).getTime()) / 1000);
    expect(uptimeText(since, now).seconds).toBe(seconds.toLocaleString('en-US'));
    expect(uptimeText(since, now).seconds).toMatch(/^\d{1,3}(,\d{3})+$/);
  });
});
