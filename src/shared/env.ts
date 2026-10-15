// Runtime environment facts. Breakpoints live here so JS and the CSS media
// queries in each section agree on the same numbers. `getEnv()` reads the
// browser lazily, so importing this module is safe on the server.

export interface Env {
  reducedMotion: boolean;
  finePointer: boolean;
}

/** Read the visitor's environment (client only). */
export const getEnv = (): Env =>
  Object.freeze({
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    finePointer: matchMedia('(hover: hover) and (pointer: fine)').matches,
  });

export const MEDIA = Object.freeze({
  desktop: '(min-width: 900px)',
  mobile: '(max-width: 899px)',
});

export const isDesktop = (): boolean => innerWidth >= 900;

/** Height of the fixed nav bar, reserved above pinned full-screen sections. */
export const NAV_HEIGHT = 76;
