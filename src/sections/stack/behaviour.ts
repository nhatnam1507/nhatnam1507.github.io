// 03 // stack — the toolset drawn as the system it builds.
// Desktop: pinned; layers "deploy" one by one as you scroll, then packets
// flow, CI runs and pods self-heal while on screen. Phones: stacked boxes.
import { defineBehaviour } from '@/shell/contract';
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $req, $$ } from '@/shared/dom';
import { MEDIA } from '@/shared/env';
import { createLoop, fitToViewport, whileVisible } from '@/shared/motion';
import { STEPS, WIRES } from './content';
import { createWires } from './widgets/wires';
import { attachTooltip } from './widgets/tooltip';
import { createPipeline } from './widgets/pipeline';
import { createCluster } from './widgets/cluster';
import { createMetrics } from './widgets/metrics';
import { createIdentity } from './widgets/identity';

export default defineBehaviour({
  mount(root, ctx) {
    if (!root) return;
    const { reducedMotion } = ctx.env;
    const { signal } = ctx;
    const arch = $req('.js-arch', root);
    const board = $req('.js-arch-board', root);
    const stepEl = $req('.js-arch-step', root);

    const wires = createWires(board, $req<SVGSVGElement>('.js-wires', root), WIRES);
    attachTooltip({ board, tip: $req('.js-arch-tip', root), frame: arch, roles: ctx.roles, signal });
    const pipeline = createPipeline(board);
    const cluster = createCluster(board, signal);
    const metrics = createMetrics(board);
    const identity = createIdentity(board, signal);
    const fit = fitToViewport(arch, { reserve: 24, section: root });
    const relayout = () => {
      fit();
      wires.layout();
    };

    const setStep = (i: number) => {
      if (stepEl.dataset.i === String(i)) return;
      stepEl.dataset.i = String(i);
      stepEl.textContent = STEPS[i] ?? '';
    };

    if (reducedMotion) {
      relayout();
      setStep(STEPS.length - 1);
      addEventListener('resize', relayout, { signal });
      return;
    }

    // packets only flow once the system has been "built" by scrolling
    let built = false;
    const loop = createLoop([
      [() => pipeline.tick(), 750],
      [() => cluster.tick(), 2200],
      [() => metrics.tick(), 700],
      [() => identity.tick(), 2600],
    ]);
    const markBuilt = () => {
      built = true;
      if (loop.running) wires.play();
    };

    const mm = gsap.matchMedia();
    mm.add(MEDIA.desktop, () => {
      relayout();
      ScrollTrigger.addEventListener('refresh', relayout);
      document.fonts?.ready.then(() => {
        if (!signal.aborted) wires.layout();
      });

      const rise = { opacity: 0, y: 36, scale: 0.96 };
      const q = (sel: string) => $$(sel, root);
      gsap
        .timeline({
          defaults: { ease: 'power3.out', duration: 0.5 },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${innerHeight * 1.5}`,
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * (STEPS.length - 0.2)))),
            onLeave: markBuilt,
            onEnterBack: () => {
              built = true;
            },
          },
        })
        .from(q('.arch-head'), { opacity: 0, y: 24, duration: 0.3 })
        .from(q('.ab-plat'), rise, 0.2)
        .from(q('.ab-plat .an'), { opacity: 0, y: 10, stagger: 0.04, duration: 0.25 }, 0.35)
        .from(q('.ab-svc'), rise, 0.7)
        .from(q('.ab-data'), rise, 1.1)
        .from(q('.wire-drop'), { opacity: 0, duration: 0.3 }, 1.2)
        .from(q('.ab-client, .ab-api'), { ...rise, stagger: 0.1 }, 1.5)
        .fromTo(
          wires.byKind('flow'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, stagger: 0.12, duration: 0.4, ease: 'none' },
          1.75,
        )
        .from(q('.ab-idp'), rise, 1.85)
        .fromTo(
          wires.byKind('auth'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, stagger: 0.1, duration: 0.3, ease: 'none' },
          2.05,
        )
        .from(q('.ab-ci'), rise, 2.2)
        .fromTo(
          wires.byKind('deploy'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.3, ease: 'none' },
          2.45,
        )
        .from(q('.ab-obs'), rise, 2.7)
        .fromTo(wires.byKind('telemetry'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.9)
        .fromTo(wires.packets(), { opacity: 0 }, { opacity: 1, duration: 0.3, onStart: markBuilt }, 2.95)
        .to({}, { duration: 0.6 });
      return () => ScrollTrigger.removeEventListener('refresh', relayout);
    });

    mm.add(MEDIA.mobile, () => {
      arch.style.setProperty('--fit', '1');
      setStep(STEPS.length - 1);
      $$('.ab', board).forEach((b) =>
        gsap.from(b, {
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: b, start: 'top 90%' },
        }),
      );
    });

    // after the pin above exists, so the visible range includes the pinned scroll
    whileVisible(
      root,
      {
        onShow: () => {
          if (loop.running) return;
          loop.start();
          metrics.tick();
          if (built) wires.play();
        },
        onHide: () => {
          loop.stop();
          wires.pause();
        },
      },
      signal,
    );

    return () => mm.revert();
  },
});
