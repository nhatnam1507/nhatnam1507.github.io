// The diagram configuration is data, so its integrity is checked without a DOM.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { careerStats, toRoles } from '@/domain/career';
import type { PageContext } from '@/shell/contract';
import { StackView } from '@/sections/stack/View';
import {
  BOXES,
  BOX_ORDER,
  LEVELS,
  STAGES,
  STEPS,
  WIRES,
  toolAt,
  type BoxId,
  type NodeId,
} from '@/sections/stack/content';
import { fixtureProfile } from '../../fixtures/profile';

const NOW = new Date('2026-09-28T12:00:00+07:00');

function pageContext(index: number): PageContext {
  const profile = fixtureProfile();
  const roles = toRoles(profile.experience, NOW);
  return { profile, roles, stats: careerStats(profile, roles, NOW), now: NOW, index };
}

const markup = renderToStaticMarkup(createElement(StackView, { ctx: pageContext(3) }));
const attrValues = (attr: string): string[] =>
  [...markup.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1] ?? '');

describe('toolAt', () => {
  test('resolves a box tool', () => {
    expect(toolAt('svc:0')).toMatchObject({ name: 'Go', level: 'core' });
    expect(toolAt('svc:3')).toMatchObject({ name: 'Python', level: 'explore' });
    expect(toolAt('plat:5')).toMatchObject({ name: 'Azure AKS', level: 'used' });
  });

  test('resolves a pipeline stage as "stage · tool", always in production', () => {
    expect(toolAt('ci:0')).toMatchObject({ name: 'git push · Git', level: 'used' });
    expect(toolAt('ci:4')).toMatchObject({ name: 'deploy · Ansible · Helm', level: 'used' });
  });

  test('throws a descriptive error for an unknown key', () => {
    for (const key of ['nope:0', 'svc:99', 'svc:', 'ci:9', 'constructor:0', '']) {
      expect(() => toolAt(key), key).toThrow(/Unknown (tool|pipeline stage)/);
    }
  });

  test('every tool has a known level and a pattern', () => {
    for (const box of Object.values(BOXES)) {
      for (const [name, level, pattern] of box.items) {
        expect(name).not.toBe('');
        expect(Object.keys(LEVELS)).toContain(level);
        expect(pattern).toBeInstanceOf(RegExp);
      }
    }
  });

  test('patterns match the experience wording they stand for', () => {
    const matches = (key: string, text: string) => toolAt(key).pattern.test(text);
    expect(matches('idp:2', 'Google SSO')).toBe(true);
    expect(matches('idp:2', 'Google Cloud Run')).toBe(false); // Google the IdP, not the cloud
    expect(matches('api:2', 'REST APIs')).toBe(true);
    expect(matches('api:2', 'forest')).toBe(false);
    expect(matches('svc:0', 'Wrote Go services')).toBe(true);
    expect(matches('svc:0', 'Google')).toBe(false);
  });
});

describe('STEPS', () => {
  test('is a non-empty list of shell captions', () => {
    expect(STEPS.length).toBeGreaterThan(1);
    expect(STEPS.every((s) => s.startsWith('$ '))).toBe(true);
  });

  test('starts with the initial caption the View renders', () => {
    expect(markup).toContain(`<span class="js-arch-step">${STEPS[0]}</span>`);
  });
});

describe('WIRES', () => {
  const nodeIds: readonly NodeId[] = [...(Object.keys(BOXES) as BoxId[]), 'ci', 'client'];

  test('every wire endpoint is a diagram box', () => {
    for (const [id, from, to] of WIRES) {
      expect(nodeIds, `${id} from`).toContain(from);
      expect(nodeIds, `${id} to`).toContain(to);
      expect(from, `${id} loops back`).not.toBe(to);
    }
  });

  test('every wire endpoint is a box the View renders', () => {
    const rendered = attrValues('data-box');
    for (const [id, from, to] of WIRES) {
      expect(rendered, `${id} from`).toContain(from);
      expect(rendered, `${id} to`).toContain(to);
    }
  });

  test('wire ids are unique (the packets address them by id)', () => {
    const ids = WIRES.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every kind has a wire, so each build-up tween has something to draw', () => {
    expect(new Set(WIRES.map(([, , , kind]) => kind))).toEqual(new Set(['flow', 'auth', 'telemetry', 'deploy']));
  });
});

describe('StackView', () => {
  test('renders the kicker number from the page index', () => {
    expect(markup).toContain('<span>03</span> // stack');
  });

  test('renders one box per BOXES entry, in order, plus the pipeline and clients', () => {
    expect(attrValues('data-box')).toEqual(['ci', 'client', ...BOX_ORDER]);
    expect([...BOX_ORDER].sort()).toEqual(Object.keys(BOXES).sort());
  });

  test('every tooltip key it renders resolves through toolAt', () => {
    const keys = attrValues('data-k');
    const expected = [
      ...Object.entries(BOXES).flatMap(([id, box]) => box.items.map((_, i) => `${id}:${i}`)),
      ...STAGES.map((_, i) => `ci:${i}`),
    ];
    expect([...keys].sort()).toEqual(expected.sort());
    keys.forEach((key) => expect(() => toolAt(key)).not.toThrow());
  });

  test('renders the live-widget hooks the behaviour looks up', () => {
    const hooks = [
      'js-arch',
      'js-arch-board',
      'js-arch-step',
      'js-wires',
      'js-arch-tip',
      'js-pods',
      'js-pods-n',
      'js-rps',
      'js-p99',
      'js-queue',
      'js-jwt-ok',
      'js-ci-run',
      'js-ci-status',
    ];
    for (const hook of hooks) expect(markup, hook).toContain(hook);
    // 12 pods + 14 throughput bars + 6 queue lights + 3 client-icon dots
    expect(markup.match(/<i><\/i>/g)?.length).toBe(12 + 14 + 6 + 3);
  });
});
