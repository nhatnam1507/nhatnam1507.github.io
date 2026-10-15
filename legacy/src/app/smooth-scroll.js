// Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
import { gsap, ScrollTrigger, Lenis } from '../shared/lib.js';

export function createSmoothScroll({ reducedMotion }) {
  if (reducedMotion) return null;
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
