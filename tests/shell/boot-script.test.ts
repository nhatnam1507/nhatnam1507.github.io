// The boot screen's script and timings.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { BOOT_LINES, barPercent, lineDelay } from '@/shell/services/boot-script';

test('lines are printed 170ms apart after a 120ms start', () => {
  assert.equal(lineDelay(0), 120);
  assert.equal(lineDelay(1), 290);
  assert.equal(lineDelay(BOOT_LINES.length - 1), 120 + 5 * 170);
});

test('the bar fills evenly and ends full', () => {
  assert.ok(Math.abs(barPercent(0) - 100 / BOOT_LINES.length) < 1e-9);
  assert.equal(barPercent(BOOT_LINES.length - 1), 100);
  assert.equal(barPercent(0, 4), 25);
});

test('the script ends with the welcome line', () => {
  const last = BOOT_LINES[BOOT_LINES.length - 1];
  assert.equal(last?.[0], 'hl');
  assert.match(last?.[2] ?? '', /welcome, visitor/);
});
