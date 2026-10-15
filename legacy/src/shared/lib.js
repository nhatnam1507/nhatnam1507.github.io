// Adapter for third-party animation libraries. They load as classic scripts
// (window globals) so the site runs without a bundler; everything else imports
// them from here, so moving to npm packages later changes only this file.

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger, Lenis };
