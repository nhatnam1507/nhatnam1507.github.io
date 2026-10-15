import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ShapeName } from '@/shell/contract';
import { SHAPES, type Shape } from '@/shell/scene/shapes';

// Kept in sync with ShapeName by the compiler: a missing key is a type error.
const NAMES = Object.keys({
  core: 0,
  helix: 0,
  lattice: 0,
  network: 0,
  knot: 0,
  portal: 0,
} satisfies Record<ShapeName, 0>) as ShapeName[];

describe('SHAPES', () => {
  it('has an entry for every ShapeName, keyed by its own name', () => {
    assert.deepEqual(Object.keys(SHAPES).sort(), [...NAMES].sort());
    for (const name of NAMES) assert.equal(SHAPES[name].name, name);
  });

  for (const name of NAMES) {
    describe(name, () => {
      for (const count of [1000, 4500, 9000]) {
        it(`generates ${count} finite xyz positions`, () => {
          const out = SHAPES[name].gen(count);
          assert.ok(out instanceof Float32Array);
          assert.equal(out.length, count * 3);
          assert.ok(out.every(Number.isFinite));
        });
      }

      it('has a sane placement', () => {
        const { x, y, s, tilt, o, r }: Shape = SHAPES[name];
        for (const v of [x, y, s, tilt, o]) assert.ok(Number.isFinite(v));
        assert.ok(s > 0);
        assert.ok(o > 0 && o <= 1);
        if (r !== undefined) assert.ok(r > 0);
      });
    });
  }

  it('only the core exposes a bounding radius for overlays to lock onto', () => {
    assert.ok(SHAPES.core.r > 0);
    for (const name of NAMES.filter((n) => n !== 'core')) assert.equal('r' in SHAPES[name], false);
  });
});
