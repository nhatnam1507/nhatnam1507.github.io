// The tooltip text is built by pure functions from the experience data.
import { describe, expect, test } from 'vitest';
import { toRoles } from '@/domain/career';
import { tooltipHtml, usageLine } from '@/sections/stack/widgets/tooltip';
import { fixtureProfile } from '../../fixtures/profile';

const NOW = new Date('2026-09-28T12:00:00+07:00');
const roles = toRoles(fixtureProfile().experience, NOW); // Gamma, Migration, Payments, Acme (oldest first)

describe('usageLine', () => {
  test('lists the roles that mention the tool, oldest first', () => {
    expect(usageLine(roles, 'svc:0')).toBe('used at Payments, Acme'); // Go
    expect(usageLine(roles, 'svc:1')).toBe('used at Gamma'); // C / C++
    expect(usageLine(roles, 'svc:3')).toBe('used at Migration'); // Python
  });

  test('falls back by level when no role mentions the tool', () => {
    expect(usageLine(roles, 'ci:0')).toBe('daily driver across projects'); // nobody mentions git
    expect(usageLine(roles, 'plat:2')).toBe('daily driver across projects'); // Helm, core
    expect(usageLine(roles, 'api:0')).toBe('daily driver across projects'); // gRPC, used
    expect(usageLine([], 'svc:3')).toBe('side projects & learning'); // Python, exploring
    expect(usageLine([], 'svc:0')).toBe('daily driver across projects'); // Go, core
  });

  test('lists each role once', () => {
    expect(usageLine([...roles, ...roles], 'svc:0')).toBe('used at Payments, Acme');
  });
});

describe('tooltipHtml', () => {
  test('renders name, level label and usage', () => {
    expect(tooltipHtml(roles, 'svc:0')).toBe(
      '<b>Go</b><span class="tip-core">core skill</span><small>used at Payments, Acme</small>',
    );
    expect(tooltipHtml([], 'svc:3')).toBe(
      '<b>Python</b><span class="tip-explore">currently exploring</span><small>side projects &amp; learning</small>',
    );
    expect(tooltipHtml([], 'api:1')).toBe(
      '<b>GraphQL</b><span class="tip-used">in production</span><small>daily driver across projects</small>',
    );
  });

  test('names a pipeline stage as "stage · tool"', () => {
    expect(tooltipHtml(roles, 'ci:1')).toContain('<b>build · GitHub Actions</b>');
  });

  test('escapes role labels', () => {
    const hostile = roles.map((r) => ({ ...r, label: '<img src=x>' }));
    const html = tooltipHtml(hostile, 'svc:0');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x&gt;');
  });

  test('throws on a key the diagram does not have', () => {
    expect(() => tooltipHtml(roles, 'svc:42')).toThrow();
  });
});
