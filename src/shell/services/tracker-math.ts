// The tracker's pure arithmetic and text formatting (ported from
// legacy/src/app/tracker.js), kept free of DOM and GSAP so it can be unit-tested.

/** Sections fade the 3D scene in over this share of a viewport before their top reaches the top edge. */
const SCENE_FADE = 0.8;
/** The active section is the last one whose top is above this share of the viewport. */
const ACTIVE_LINE = 0.5;

/** 0.5 → '+0.500', -1 → '-1.000' (the sign is always shown) */
export const fmtCoord = (v: number): string => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(3);

/** Pointer position → -1‥1 on both axes, y up. */
export function pointerToNdc(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return { x: (clientX / width) * 2 - 1, y: -(clientY / height) * 2 + 1 };
}

export const coordsLabel = (x: number, y: number): string => `x:${fmtCoord(x)} y:${fmtCoord(y)}`;

export interface ScrollState {
  /** float index into the section list (the scene's morph progress) */
  progress: number;
  /** index of the section that is currently active */
  current: number;
}

/**
 * `tops` are the page offsets of each section's scroll range; `y` is the
 * scroll position and `vh` the viewport height.
 */
export function trackScroll(tops: readonly number[], y: number, vh: number): ScrollState {
  let progress = 0;
  let current = 0;
  tops.forEach((pageTop, i) => {
    const top = pageTop - y;
    if (i > 0) progress += Math.min(1, Math.max(0, (vh - top) / (vh * SCENE_FADE)));
    if (top <= vh * ACTIVE_LINE) current = i;
  });
  return { progress, current };
}

/** Scroll fraction 0‥1, rounded to 3 decimals so tiny moves don't rewrite the DOM. */
export const scrollFraction = (y: number, maxScroll: number): number => Math.round((y / maxScroll) * 1000) / 1000;

/** 0.5 → '050%' */
export const percentLabel = (fraction: number): string => `${String(Math.round(fraction * 100)).padStart(3, '0')}%`;

/** frames drawn in `ms` → '60 fps' */
export const fpsLabel = (frames: number, ms: number): string => `${Math.round((frames * 1000) / ms)} fps`;
