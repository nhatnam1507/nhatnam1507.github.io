// Adapter for third-party animation libraries: the ONLY module that imports
// gsap, ScrollTrigger and Lenis. Everything else imports them from here, so a
// library upgrade or swap touches one file. Client-side code only: Views
// (Server Components) must never import this module.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger, Lenis };
