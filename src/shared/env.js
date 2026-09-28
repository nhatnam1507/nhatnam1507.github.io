// Runtime environment facts, read once. Breakpoints live here so JS and the
// CSS media queries in each section agree on the same numbers.

export const env = Object.freeze({
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
});

export const MEDIA = Object.freeze({
  desktop: '(min-width: 900px)',
  mobile: '(max-width: 899px)',
});

export const isDesktop = () => innerWidth >= 900;

/** Height of the fixed nav bar, reserved above pinned full-screen sections. */
export const NAV_HEIGHT = 76;
