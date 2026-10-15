'use client';
// The client orchestrator (the composition root's runtime half): the one place behaviours
// run. Everything happens in one useGSAP effect so (a) blocks mount strictly
// in registry order, which ScrollTrigger pins require, and (b) every tween and
// ScrollTrigger is reverted on teardown (React StrictMode mounts twice in dev).
// Renders nothing: the markup is server-rendered by the Views.
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from '@/shared/lib';
import { $ } from '@/shared/dom';
import { getEnv, type Env } from '@/shared/env';
import { behaviours } from './behaviours';
import { createPageContext } from './context';
import {
  isSection,
  navSections,
  type BlockMeta,
  type Cleanup,
  type RuntimeContext,
  type SceneHandle,
  type SectionMeta,
} from './contract';
import { createScene } from './scene/scene';
import { createSmoothScroll } from './services/smooth-scroll';
import { attachJumps } from './services/navigation';
import { startTracker } from './services/tracker';
import { attachReveals, chromeIntro } from './services/reveals';
import { attachCursor } from './services/cursor';
import { createExport } from './services/export-cv';
import { showToast } from './services/toast';
import { boot } from './services/boot';

function tryCreateScene(sections: readonly SectionMeta[], env: Env, signal: AbortSignal): SceneHandle | null {
  const canvas = $<HTMLCanvasElement>('#webgl');
  if (!canvas) return null;
  try {
    return createScene(canvas, { shapes: sections.map((s) => s.shape), reducedMotion: env.reducedMotion, signal });
  } catch (err) {
    console.warn('WebGL unavailable, continuing without the 3D scene.', err);
    canvas.hidden = true; // React owns the node: hide it, never remove it
    return null;
  }
}

export function PageRuntime({ blocks, nowISO }: { blocks: readonly BlockMeta[]; nowISO: string }) {
  useGSAP((_context, contextSafe) => {
    const controller = new AbortController();
    const { signal } = controller;
    const env = getEnv();
    const page = createPageContext(new Date(nowISO));
    const sections = blocks.filter(isSection);
    const navTargets = navSections(sections).map((s) => s.id);

    const scene = tryCreateScene(sections, env, signal); // sections may lock overlays onto it
    const lenis = createSmoothScroll(env, signal);
    lenis?.stop();

    const { navigate } = attachJumps({ lenis, scene, reducedMotion: env.reducedMotion, signal });
    const { exportCv } = createExport(showToast, signal);
    const services = { navigate, exportCv, toast: showToast };

    const rootOf = (b: BlockMeta) => (isSection(b) ? document.getElementById(b.id) : null);
    const ctxFor = (b: BlockMeta): RuntimeContext => ({
      ...page,
      index: sections.findIndex((s) => s.id === b.id),
      env,
      scene,
      services,
      navTargets,
      signal,
    });

    // top to bottom: pins must be created in page order
    const cleanups: Cleanup[] = [];
    for (const b of blocks) {
      const cleanup = behaviours[b.id].mount?.(rootOf(b), ctxFor(b));
      if (cleanup) cleanups.push(cleanup);
    }
    attachReveals();
    attachCursor(env, signal);
    startTracker({ sections, scene, signal });

    // after the boot screen: tweens created here still belong to the context
    const afterBoot = contextSafe?.(() => {
      if (signal.aborted) return;
      lenis?.start();
      chromeIntro();
      for (const b of blocks) behaviours[b.id].onReady?.(rootOf(b), ctxFor(b));
      ScrollTrigger.refresh();
      document.fonts?.ready.then(() => {
        if (!signal.aborted) ScrollTrigger.refresh();
      });
    });
    boot(env, signal).then(afterBoot);

    return () => {
      controller.abort();
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
