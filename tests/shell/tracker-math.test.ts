// The tracker's arithmetic and formatting are pure, so they run with no DOM.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  coordsLabel,
  fmtCoord,
  fpsLabel,
  percentLabel,
  pointerToNdc,
  scrollFraction,
  trackScroll,
} from '@/shell/services/tracker-math';

test('fmtCoord always shows the sign and 3 decimals', () => {
  assert.equal(fmtCoord(0), '+0.000');
  assert.equal(fmtCoord(-0), '+0.000');
  assert.equal(fmtCoord(0.5), '+0.500');
  assert.equal(fmtCoord(-1), '-1.000');
  assert.equal(fmtCoord(0.12345), '+0.123');
});

test('pointerToNdc maps the viewport to -1..1 with y up', () => {
  assert.deepEqual(pointerToNdc(0, 0, 1000, 500), { x: -1, y: 1 });
  assert.deepEqual(pointerToNdc(1000, 500, 1000, 500), { x: 1, y: -1 });
  assert.deepEqual(pointerToNdc(500, 250, 1000, 500), { x: 0, y: 0 });
  assert.equal(coordsLabel(0.5, -0.25), 'x:+0.500 y:-0.250');
});

test('trackScroll: at the top only the hero is active and the scene stays at 0', () => {
  const tops = [0, 900, 1800, 2700];
  assert.deepEqual(trackScroll(tops, 0, 900), { progress: 0, current: 0 });
});

test('trackScroll: a section fades the scene in over 80% of a viewport before its top', () => {
  const tops = [0, 1000];
  // top of section 1 is 1000 - 280 = 720 below the top edge; vh 900 → (900 - 720) / 720 = 0.25
  assert.equal(trackScroll(tops, 280, 900).progress, 0.25);
  // fully faded once its top has reached 20% of the viewport
  assert.equal(trackScroll(tops, 820, 900).progress, 1);
  assert.equal(trackScroll(tops, 5000, 900).progress, 1);
});

test('trackScroll: the active section is the last whose top passed half the viewport', () => {
  const tops = [0, 1000, 2000];
  assert.equal(trackScroll(tops, 549, 900).current, 0);
  assert.equal(trackScroll(tops, 550, 900).current, 1);
  assert.equal(trackScroll(tops, 1550, 900).current, 2);
});

test('trackScroll: no sections', () => {
  assert.deepEqual(trackScroll([], 100, 900), { progress: 0, current: 0 });
});

test('scrollFraction rounds to 3 decimals; percentLabel pads to 3 digits', () => {
  assert.equal(scrollFraction(0, 1000), 0);
  assert.equal(scrollFraction(1, 3), 0.333);
  assert.equal(scrollFraction(1000, 1000), 1);
  assert.equal(percentLabel(0), '000%');
  assert.equal(percentLabel(0.333), '033%');
  assert.equal(percentLabel(1), '100%');
});

test('fpsLabel converts frames per window to fps', () => {
  assert.equal(fpsLabel(30, 500), '60 fps');
  assert.equal(fpsLabel(0, 500), '0 fps');
});
