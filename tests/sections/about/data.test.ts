import { describe, expect, it } from 'vitest';
import { DAY } from '@/sections/about/content';
import { chartModel } from '@/sections/about/widgets/chart';
import { COLS, ROWS, commitLevels } from '@/sections/about/widgets/heatmap';
import { sparklinePaths, sparklinePoints } from '@/sections/about/widgets/sparkline';

describe('sparkline', () => {
  it('is deterministic (same server and client markup)', () => {
    expect(sparklinePaths()).toEqual(sparklinePaths());
    expect(sparklinePoints()).toEqual(sparklinePoints());
  });

  it('spans the viewBox with the two incident dips', () => {
    const pts = sparklinePoints();
    expect(pts).toHaveLength(41);
    expect(pts[0]?.[0]).toBe(0);
    expect(pts[40]?.[0]).toBe(200);
    pts.forEach(([, y], i) => {
      if (i === 14 || i === 29) expect(y).toBeGreaterThanOrEqual(22);
      else expect(y).toBeLessThan(10);
    });
  });

  it('closes the fill path along the bottom edge', () => {
    const { line, fill } = sparklinePaths();
    expect(line.startsWith('M 0 ')).toBe(true);
    expect(fill).toBe(`${line} L 200 36 L 0 36 Z`);
  });
});

describe('heatmap commit levels', () => {
  const levels = commitLevels();

  it('has one level per cell, each 0‥4', () => {
    expect(levels).toHaveLength(COLS * ROWS);
    expect(levels.every((l) => Number.isInteger(l) && l >= 0 && l <= 4)).toBe(true);
  });

  it('is deterministic', () => {
    expect(commitLevels()).toEqual(levels);
  });

  it('is quieter on weekends than on weekdays', () => {
    const sum = (rows: number[]) =>
      levels.filter((_, k) => rows.includes(k % ROWS)).reduce((a, b) => a + b, 0) / (rows.length * COLS);
    expect(sum([0, 6])).toBeLessThan(sum([1, 2, 3, 4, 5]));
  });
});

describe('chartModel', () => {
  const m = chartModel(DAY);

  it('labels the x axis every four hours from the start hour', () => {
    expect(m.ticks.map((t) => t.label)).toEqual(['08h', '12h', '16h', '20h']);
  });

  it('draws coffee as a step line and bugs as a polyline', () => {
    expect(m.coffeePath.startsWith('M ')).toBe(true);
    expect(m.coffeePath.match(/ H /g)).toHaveLength(DAY.coffee.length - 1);
    expect(m.coffeePath.match(/ V /g)).toHaveLength(DAY.coffee.length - 1);
    expect(m.bugsPath.match(/L /g)).toHaveLength(DAY.bugs.length - 1);
  });

  it('puts the note on the bugs line, with its label up and to the right', () => {
    expect(m.note.tx).toBe(m.note.cx + 7);
    expect(m.note.ty).toBe(m.note.cy - 7);
    expect(m.note.text).toBe(DAY.note.text);
  });

  it('has finite numbers throughout', () => {
    const nums = [...m.grid.flatMap((g) => [g.x1, g.x2, g.y]), ...m.ticks.flatMap((t) => [t.x, t.y])];
    expect(nums.every(Number.isFinite)).toBe(true);
  });
});
