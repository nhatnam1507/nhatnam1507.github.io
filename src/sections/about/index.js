// 01 // about — Nam rendered as a monitored production service.
// Desktop: pinned; panels assemble as you scroll (scrubbed), then keep running
// live while on screen. Phones: panels animate in one by one.
import { defineSection } from '../../app/contract.js';
import { gsap, ScrollTrigger } from '../../shared/lib.js';
import { $, $$ } from '../../shared/dom.js';
import { MEDIA } from '../../shared/env.js';
import { createLoop, fitToViewport, whileVisible } from '../../shared/motion.js';
import { typeTokens } from '../../shared/text.js';
import { template } from './template.js';
import { DAY, LOG_LINES, PROCESSES, TIME_ZONE, readmeTokens } from './content.js';
import { createHtop } from './widgets/htop.js';
import { createChart } from './widgets/chart.js';
import { drawSparkline } from './widgets/sparkline.js';
import { createHeatmap } from './widgets/heatmap.js';
import { createGauge } from './widgets/gauge.js';
import { createLogStream } from './widgets/logs.js';
import { createUptime } from './widgets/uptime.js';

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const formatTime = (d) => timeFmt.format(d);

export default defineSection({
  id: 'about',
  label: 'about',
  shape: 'helix',
  template,

  mount(root, ctx) {
    const { reducedMotion } = ctx.env;
    const dash = $('.js-dash', root);
    const panels = $$('.panel', dash);

    /* widgets */
    const htop = createHtop($('.js-htop', root), PROCESSES);
    const chart = createChart($('.js-chart', root), DAY);
    drawSparkline($('.js-spark', root), $('.js-spark-fill', root));
    const heat = createHeatmap($('.js-heat', root));
    const gauge = createGauge({ arc: $('.js-gauge-arc', root), needle: $('.js-needle', root), value: $('.js-gauge-val', root), state: $('.js-gauge-state', root) });
    const logs = createLogStream($('.js-logs', root), LOG_LINES, formatTime);
    const clock = createUptime({ clock: $('.js-clock', root), big: $('.js-uptime', root), seconds: $('.js-uptime-s', root) }, { since: ctx.profile.careerStart, formatTime });

    const slis = $$('.js-sli', dash).map((el) => ({ el, to: Number(el.dataset.to) }));
    const sli = { p: 0 };
    const renderSli = () => slis.forEach((x) => (x.el.textContent = Math.round(x.to * sli.p)));
    const heatReveal = { v: 0 };
    const renderHeat = () => heat.setReveal(heatReveal.v);

    let typed = false;
    const typeReadme = () => {
      if (typed) return;
      typed = true;
      typeTokens($('.js-readme', root), readmeTokens(ctx), { prefix: 'rd-', instant: reducedMotion });
    };

    clock.tick();
    for (let i = 0; i < 4; i++) logs.push();
    heat.size();
    addEventListener('resize', () => heat.size());

    if (reducedMotion) {
      heat.setReveal(1);
      chart.lines.forEach((l) => (l.style.strokeDashoffset = '0'));
      $('.js-spark', root).style.strokeDashoffset = '0';
      gauge.set(86);
      htop.settle();
      sli.p = 1; renderSli();
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
      gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${innerHeight * 1.6}`, pin: true, scrub: 0.6, onEnter: typeReadme },
      })
        .from($('.dash-top', root), { opacity: 0, y: 30, duration: 0.4 })
        .from(panels, { opacity: 0, y: 60, scale: 0.94, duration: 0.5, stagger: 0.12 }, 0.1)
        .to(sli, { p: 1, duration: 0.6, ease: 'power2.out', onUpdate: renderSli }, 0.2)
        .fromTo($('.js-spark', root), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, 0.35)
        .fromTo(chart.lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'none', stagger: 0.1 }, 0.6)
        .from(chart.note, { opacity: 0, duration: 0.2 }, 1.2)
        .to(heatReveal, { v: 1, duration: 0.8, ease: 'none', onUpdate: renderHeat }, 0.75)
        .to({}, { duration: 0.5 }); // hold the finished dashboard for a beat
      return () => ScrollTrigger.removeEventListener('refreshInit', fit);
    });

    // phones: no pin, each panel animates as it enters
    mm.add(MEDIA.mobile, () => {
      dash.style.setProperty('--fit', '1');
      const on = (sel, start = 'top 80%') => ({ trigger: $(sel, root), start });
      ScrollTrigger.create({ ...on('.p-readme', 'top 85%'), once: true, onEnter: typeReadme });
      panels.forEach((p) => gsap.from(p, { opacity: 0, y: 40, duration: 0.7, scrollTrigger: { trigger: p, start: 'top 90%' } }));
      gsap.to(sli, { p: 1, duration: 1.6, ease: 'power2.out', onUpdate: renderSli, scrollTrigger: on('.p-sli', 'top 85%') });
      gsap.fromTo($('.js-spark', root), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: on('.p-uptime') });
      gsap.fromTo(chart.lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', stagger: 0.15, scrollTrigger: on('.p-chart') });
      gsap.to(heatReveal, { v: 1, duration: 1.4, ease: 'power1.out', onUpdate: renderHeat, scrollTrigger: on('.p-heat', 'top 85%') });
    });

    whileVisible(root, {
      onShow: () => { if (!live.running) { live.start(); htop.tick(); gauge.tick(); } },
      onHide: () => live.stop(),
    });
  },
});
