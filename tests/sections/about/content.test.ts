import { describe, expect, it } from 'vitest';
import { careerStats, toRoles } from '@/domain/career';
import { DAY, LOG_LINES, PROCESSES, readmeTokens, slis } from '@/sections/about/content';
import { fixtureProfile } from '../../fixtures/profile';

const NOW = new Date('2026-03-15T00:00:00Z');

function context() {
  const profile = fixtureProfile();
  const roles = toRoles(profile.experience, NOW);
  return { profile, stats: careerStats(profile, roles, NOW) };
}

describe('about slis', () => {
  it('derives the AWS and role tiles from the profile', () => {
    const ctx = context();
    const tiles = slis(ctx);
    expect(tiles).toHaveLength(4);
    expect(tiles[2]).toMatchObject({ to: 1, suffix: '×', label: 'AWS certified' });
    expect(tiles[3]).toMatchObject({ to: ctx.stats.roles, label: 'roles shipped' });
    expect(tiles[3]?.note).toBe(`${ctx.stats.employers} companies`);
  });

  it('counts only Amazon-issued certificates', () => {
    const ctx = context();
    ctx.profile.certificates.push({ ...ctx.profile.certificates[0], issuer: 'Other Org', id: 'X' });
    expect(slis(ctx)[2]?.to).toBe(1);
    ctx.profile.certificates.push({ ...ctx.profile.certificates[0], issuer: 'Amazon Web Services', id: 'Y' });
    expect(slis(ctx)[2]?.to).toBe(2);
  });

  it('keeps the static tiles stable', () => {
    const tiles = slis(context());
    expect(tiles[0]).toMatchObject({ to: 90, suffix: '%' });
    expect(tiles[1]).toMatchObject({ prefix: '+', to: 20, suffix: '%' });
  });
});

describe('readmeTokens', () => {
  it('weaves the career years into the text', () => {
    const { stats } = context();
    const text = readmeTokens({ stats })
      .map(([, t]) => t)
      .join('');
    expect(text).toContain(`${stats.years} yrs: C++ SCADA → Go on k8s`);
    expect(text.startsWith('# nam.nguyen\n')).toBe(true);
  });

  it('uses only the readme classes the CSS defines', () => {
    const classes = new Set(readmeTokens(context()).map(([cls]) => cls));
    expect([...classes].sort()).toEqual(['', 'b', 'h', 'm', 'r']);
  });
});

describe('content tables', () => {
  it('has a coffee and bugs reading for every hour of the day', () => {
    expect(DAY.coffee).toHaveLength(13);
    expect(DAY.bugs).toHaveLength(DAY.coffee.length);
    expect(DAY.note.at).toBeLessThan(DAY.bugs.length);
  });

  it('has exactly one process that gets killed, with unique pids', () => {
    expect(PROCESSES.filter((p) => 'killed' in p)).toHaveLength(1);
    expect(new Set(PROCESSES.map((p) => p.pid)).size).toBe(PROCESSES.length);
  });

  it('only uses log levels that have a style', () => {
    const levels = new Set(LOG_LINES.map(([level]) => level));
    expect([...levels].sort()).toEqual(['DEBUG', 'ERROR', 'INFO', 'WARN']);
  });
});
