// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync
// (ported from legacy/src/app/smooth-scroll.js).
import { gsap, Lenis, ScrollTrigger } from '@/shared/lib';
import type { Env } from '@/shared/env';
import { onAbort } from './abort';

/** Lenis instance (null with reduced motion). Destroyed and unhooked when `signal` aborts. */
export function createSmoothScroll({ reducedMotion }: Env, signal: AbortSignal): Lenis | null {
  if (reducedMotion) return null;
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  const stopSync = lenis.on('scroll', () => ScrollTrigger.update());
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  onAbort(signal, () => {
    stopSync();
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33); // GSAP's default
    lenis.destroy();
  });
  return lenis;
}
