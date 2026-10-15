// The pure parts of the stack widgets: wire routing and the teardown-safe timer.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { route, type Rect } from '@/sections/stack/widgets/wires';
import { settleLater } from '@/sections/stack/widgets/settle';

describe('route', () => {
  const box = (l: number, t: number, r: number, b: number): Rect => ({ l, t, r, b });

  test('goes straight down when the target sits under the source', () => {
    expect(route(box(0, 0, 100, 50), box(20, 100, 80, 150))).toBe('M 50 50 L 50 100');
  });

  test('uses the overlap centre when only partly aligned', () => {
    expect(route(box(0, 0, 100, 50), box(60, 100, 200, 150))).toBe('M 80 50 L 80 100');
  });

  test('drops down and across when the target is below but to the side', () => {
    expect(route(box(0, 0, 100, 50), box(200, 100, 300, 150))).toBe('M 50 50 C 50 125, 50 125, 200 125');
  });

  test('is a horizontal S-curve when the target is beside the source', () => {
    expect(route(box(0, 0, 100, 50), box(200, 10, 300, 60))).toBe('M 100 25 C 150 25, 150 35, 200 35');
  });
});

describe('settleLater', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('fires once after the delay', () => {
    const fn = vi.fn();
    const ac = new AbortController();
    settleLater(ac.signal, fn, 100);
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    ac.abort(); // a later abort must not fire it again
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('fires immediately, once, when the signal aborts first', () => {
    const fn = vi.fn();
    const ac = new AbortController();
    settleLater(ac.signal, fn, 100);
    ac.abort();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('runs straight away on an already aborted signal', () => {
    const fn = vi.fn();
    settleLater(AbortSignal.abort(), fn, 100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
