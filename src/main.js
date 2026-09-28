// Composition root: the only place that knows about every layer. It builds
// the page context (content + domain), renders and mounts the sections from
// the registry, and wires the app shell around them.
import { ScrollTrigger } from './shared/lib.js';
import { $ } from './shared/dom.js';
import { env } from './shared/env.js';
import { profile } from './content/profile.js';
import { careerStats, toRoles } from './domain/career.js';
import { blocks, sections } from './app/registry.js';
import { mountPage, readyPage, renderPage } from './app/page.js';
import { createScene } from './app/scene/scene.js';
import { createSmoothScroll } from './app/smooth-scroll.js';
import { attachJumps, renderNav } from './app/navigation.js';
import { startTracker } from './app/tracker.js';
import { attachReveals, chromeIntro } from './app/reveals.js';
import { attachCursor } from './app/cursor.js';
import { attachExport } from './app/export-cv.js';
import { boot } from './app/boot.js';

function createContext(now = new Date()) {
  const roles = toRoles(profile.experience, now);
  return { profile, roles, stats: careerStats(profile, roles, now), now, env };
}

function tryCreateScene() {
  try {
    return createScene($('#webgl'), { shapes: sections.map((s) => s.shape), reducedMotion: env.reducedMotion });
  } catch (err) {
    console.warn('WebGL unavailable, continuing without the 3D scene.', err);
    $('#webgl').remove();
    return null;
  }
}

async function start() {
  const ctx = createContext();
  $('.js-year').textContent = ctx.now.getFullYear();

  renderNav($('.nav-links'), sections);
  renderPage($('#app'), blocks, ctx);

  const scene = tryCreateScene();
  const lenis = createSmoothScroll(env);
  lenis?.stop();

  attachJumps({ lenis, scene, reducedMotion: env.reducedMotion });
  mountPage(blocks, ctx); // top to bottom: pins must be created in page order
  attachReveals();
  attachCursor(env);
  startTracker({ sections, scene });
  attachExport();

  await boot(env);
  lenis?.start();
  chromeIntro();
  readyPage(blocks, ctx);
  ScrollTrigger.refresh();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

start();
