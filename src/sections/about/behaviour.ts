// 01 // about: Nam rendered as a monitored production service.
// Desktop: pinned; panels assemble as you scroll (scrubbed), then keep running
// live while on screen. Phones: panels animate in one by one.
import { defineBehaviour } from '@/shell/contract';
import { gsap, ScrollTrigger } from '@/shared/lib';
import { $$, $req } from '@/shared/dom';
import { MEDIA } from '@/shared/env';
import { createLoop, fitToViewport, whileVisible } from '@/shared/motion';
import { typeTokens } from '@/shared/text';
import { formatClock } from '@/shared/time';
import { LOG_LINES, PROCESSES, readmeTokens } from './content';
import { chartParts } from './widgets/chart';
import { createGauge } from './widgets/gauge';
import { createHeatmap } from './widgets/heatmap';
import { createHtop } from './widgets/htop';
import { createLogStream } from './widgets/logs';
import { createUptime } from './widgets/uptime';

export default defineBehaviour({
  mount(root, ctx) {
    if (!root) return;
    const { reducedMotion } = ctx.env;
    const { signal } = ctx;
    const dash = $req('.js-dash', root);
    const panels = $$('.panel', dash);
    const spark = $req<SVGPathElement>('.js-spark', root);

    /* widgets (the View renders the static markup, they only animate it) */
    const htop = createHtop($req('.js-htop', root), PROCESSES);
    const chart = chartParts($req<SVGSVGElement>('.js-chart', root));
    const heat = createHeatmap($req<HTMLCanvasElement>('.js-heat', root));
    const gauge = createGauge({
      arc: $req<SVGElement>('.js-gauge-arc', root),
      needle: $req<SVGElement>('.js-needle', root),
      value: $req('.js-gauge-val', root),
      state: $req('.js-gauge-state', root),
    });
    const logs = createLogStream($req('.js-logs', root), LOG_LINES, formatClock);
    const clock = createUptime(
      { clock: $req('.js-clock', root), big: $req('.js-uptime', root), seconds: $req('.js-uptime-s', root) },
      { since: ctx.profile.careerStart, formatTime: formatClock },
    );

    const sliEls = $$('.js-sli', dash).map((el) => ({ el, to: Number(el.dataset.to) }));
    const sli = { p: 0 };
    const renderSli = () => sliEls.forEach((x) => (x.el.textContent = String(Math.round(x.to * sli.p))));
    const heatReveal = { v: 0 };
    const renderHeat = () => heat.setReveal(heatReveal.v);

    let typed = false;
    const typeReadme = () => {
      if (typed) return;
      typed = true;
      typeTokens($req('.js-readme', root), readmeTokens(ctx), { prefix: 'rd-', instant: reducedMotion });
    };

    clock.tick();
    for (let i = 0; i < 4; i++) logs.push();
    heat.size();
    addEventListener('resize', () => heat.size(), { signal });

    if (reducedMotion) {
      heat.setReveal(1);
      chart.lines.forEach((l) => (l.style.strokeDashoffset = '0'));
      spark.style.strokeDashoffset = '0';
      gauge.set(86);
      htop.settle();
      sli.p = 1;
      renderSli();
      typeReadme();
      return;
    }

    const live = createLoop([
      [() => clock.tick(), 1000],
      [() => htop.tick(), 900],
      [() => logs.push(), 1500],
      [() => gauge.tick(), 2600],
      [() => heat.twinkle(), 450],
    ]);

    const mm = gsap.matchMedia();

    // desktop: pin and scrub the assembly, then hold so it can be enjoyed
    mm.add(MEDIA.desktop, () => {
      const fit = fitToViewport(dash, { reserve: 28 });
      fit();
      ScrollTrigger.addEventListener('refreshInit', fit);
      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${innerHeight * 1.6}`,
            pin: true,
            scrub: 0.6,
            onEnter: typeReadme,
          },
        })
        .from($req('.dash-top', root), { opacity: 0, y: 30, duration: 0.4 })
        .from(panels, { opacity: 0, y: 60, scale: 0.94, duration: 0.5, stagger: 0.12 }, 0.1)
        .to(sli, { p: 1, duration: 0.6, ease: 'power2.out', onUpdate: renderSli }, 0.2)
        .fromTo(spark, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, 0.35)
        .fromTo(
          chart.lines,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.7, ease: 'none', stagger: 0.1 },
          0.6,
        )
        .from(chart.note, { opacity: 0, duration: 0.2 }, 1.2)
        .to(heatReveal, { v: 1, duration: 0.8, ease: 'none', onUpdate: renderHeat }, 0.75)
        .to({}, { duration: 0.5 }); // hold the finished dashboard for a beat
      return () => ScrollTrigger.removeEventListener('refreshInit', fit);
    });

    // phones: no pin, each panel animates as it enters
    mm.add(MEDIA.mobile, () => {
      dash.style.setProperty('--fit', '1');
      const on = (sel: string, start = 'top 80%') => ({ trigger: $req(sel, root), start });
      ScrollTrigger.create({ ...on('.p-readme', 'top 85%'), once: true, onEnter: typeReadme });
      panels.forEach((p) =>
        gsap.from(p, { opacity: 0, y: 40, duration: 0.7, scrollTrigger: { trigger: p, start: 'top 90%' } }),
      );
      gsap.to(sli, {
        p: 1,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: renderSli,
        scrollTrigger: on('.p-sli', 'top 85%'),
      });
      gsap.fromTo(
        spark,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: on('.p-uptime') },
      );
      gsap.fromTo(
        chart.lines,
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', stagger: 0.15, scrollTrigger: on('.p-chart') },
      );
      gsap.to(heatReveal, {
        v: 1,
        duration: 1.4,
        ease: 'power1.out',
        onUpdate: renderHeat,
        scrollTrigger: on('.p-heat', 'top 85%'),
      });
    });

    // after the pin exists, so the visible range includes the pinned scroll
    whileVisible(
      root,
      {
        onShow: () => {
          if (live.running) return;
          live.start();
          htop.tick();
          gauge.tick();
        },
        onHide: () => live.stop(),
      },
      signal,
    );

    return () => {
      mm.revert();
      htop.kill();
      gauge.kill();
    };
  },
});
