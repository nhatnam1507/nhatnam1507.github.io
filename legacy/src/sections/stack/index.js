// 03 // stack — the toolset drawn as the system it builds.
// Desktop: pinned; layers "deploy" one by one as you scroll, then packets
// flow, CI runs and pods self-heal while on screen. Phones: stacked boxes.
import { defineSection } from '../../app/contract.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { MEDIA } from '../../shared/env.js';
import { createLoop, fitToViewport, whileVisible } from '../../shared/motion.js';
import { template } from './template.js';
import { STEPS, WIRES } from './content.js';
import { createWires } from './widgets/wires.js';
import { attachTooltip } from './widgets/tooltip.js';
import { createPipeline } from './widgets/pipeline.js';
import { createCluster } from './widgets/cluster.js';
import { createMetrics } from './widgets/metrics.js';
import { createIdentity } from './widgets/identity.js';

export default defineSection({
  id: 'stack',
  label: 'stack',
  shape: 'network',
  template,

  mount(root, ctx) {
    const { reducedMotion } = ctx.env;
    const arch = $('.js-arch', root);
    const board = $('.js-arch-board', root);
    const stepEl = $('.js-arch-step', root);

    const wires = createWires(board, $('.js-wires', root), WIRES);
    attachTooltip({ board, tip: $('.js-arch-tip', root), frame: arch, roles: ctx.roles });
    const pipeline = createPipeline(board);
    const cluster = createCluster(board);
    const metrics = createMetrics(board);
    const identity = createIdentity(board);
    const fit = fitToViewport(arch, { reserve: 24, section: root });
    const relayout = () => { fit(); wires.layout(); };

    const setStep = (i) => {
      if (stepEl.dataset.i === String(i)) return;
      stepEl.dataset.i = i;
      stepEl.textContent = STEPS[i];
    };

    if (reducedMotion) {
      relayout();
      setStep(STEPS.length - 1);
      addEventListener('resize', relayout);
      return;
    }

    // packets only flow once the system has been "built" by scrolling
    let built = false;
    const loop = createLoop([[() => pipeline.tick(), 750], [() => cluster.tick(), 2200], [() => metrics.tick(), 700], [() => identity.tick(), 2600]]);
    const markBuilt = () => { built = true; if (loop.running) wires.play(); };

    const mm = gsap.matchMedia();
    mm.add(MEDIA.desktop, () => {
      relayout();
      ScrollTrigger.addEventListener('refresh', relayout);
      document.fonts?.ready.then(wires.layout);

      const rise = { opacity: 0, y: 36, scale: 0.96 };
      const q = (sel) => $$(sel, root);
      gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.5 },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${innerHeight * 1.5}`,
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * (STEPS.length - 0.2)))),
          onLeave: markBuilt,
          onEnterBack: () => { built = true; },
        },
      })
        .from(q('.arch-head'), { opacity: 0, y: 24, duration: 0.3 })
        .from(q('.ab-plat'), rise, 0.2)
        .from(q('.ab-plat .an'), { opacity: 0, y: 10, stagger: 0.04, duration: 0.25 }, 0.35)
        .from(q('.ab-svc'), rise, 0.7)
        .from(q('.ab-data'), rise, 1.1)
        .from(q('.wire-drop'), { opacity: 0, duration: 0.3 }, 1.2)
        .from(q('.ab-client, .ab-api'), { ...rise, stagger: 0.1 }, 1.5)
        .fromTo(wires.byKind('flow'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.12, duration: 0.4, ease: 'none' }, 1.75)
        .from(q('.ab-idp'), rise, 1.85)
        .fromTo(wires.byKind('auth'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.1, duration: 0.3, ease: 'none' }, 2.05)
        .from(q('.ab-ci'), rise, 2.2)
        .fromTo(wires.byKind('deploy'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'none' }, 2.45)
        .from(q('.ab-obs'), rise, 2.7)
        .fromTo(wires.byKind('telemetry'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.9)
        .fromTo(wires.packets(), { opacity: 0 }, { opacity: 1, duration: 0.3, onStart: markBuilt }, 2.95)
        .to({}, { duration: 0.6 });
      return () => ScrollTrigger.removeEventListener('refresh', relayout);
    });

    mm.add(MEDIA.mobile, () => {
      arch.style.setProperty('--fit', '1');
      setStep(STEPS.length - 1);
      $$('.ab', board).forEach((b) => gsap.from(b, { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 90%' } }));
    });

    whileVisible(root, {
      onShow: () => { if (loop.running) return; loop.start(); metrics.tick(); if (built) wires.play(); },
      onHide: () => { loop.stop(); wires.pause(); },
    });
  },
});
