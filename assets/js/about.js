// 01 // about — Nam rendered as a monitored production service.
// Panels assemble on scroll (pinned + scrubbed on desktop), then keep running
// "live" (htop, logs, gauge, clock, uptime, heatmap twinkle) only while the
// section is on screen.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const TZ = 'Asia/Ho_Chi_Minh';
const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- content ---------- */

// PIDs are well-known ports, for the people who notice
const PROCS = [
  { pid: 8080, cmd: 'go build ./ideas/...', cpu: 34 },
  { pid: 6443, cmd: 'kubectl get pods -w', cpu: 22 },
  { pid: 3306, cmd: 'coffee.service', cpu: 17 },
  { pid: 5432, cmd: 'read --the-docs', cpu: 12 },
  { pid: 9090, cmd: 'rubber-duck --verbose', cpu: 9 },
  { pid: 666, cmd: 'deploy-on-friday.sh', cpu: 0, killed: true },
];

const LOGS = [
  ['INFO', 'coffee.service started (cups=1)'],
  ['INFO', 'go test ./... PASS · coverage=90.3%'],
  ['WARN', '"works on my machine" detected → writing Dockerfile'],
  ['INFO', 'deployment/api successfully rolled out'],
  ['DEBUG', 'rubber duck consulted · root cause in 4m'],
  ['ERROR', 'deploy-on-friday.sh blocked by nam (SIGKILL)'],
  ['INFO', 'PR merged with 0 comments… suspicious'],
  ['INFO', 'alert fired → actionable ✓ → resolved'],
  ['WARN', '47 browser tabs open (3 are docs)'],
  ['INFO', 'helm diff: no surprises. phew.'],
  ['DEBUG', 'grpc: p99 latency happy'],
  ['INFO', 'git push --force-with-lease (responsibly)'],
];

function readmeTokens(years) {
  return [
    ['h', '# nam.nguyen\n'],
    ['m', 'backend · cloud · devops @ hanoi\n'],
    ['m', `${years} yrs: C++ SCADA → Go on k8s\n\n`],
    ['b', '- '], ['', 'turns YAML into production\n'],
    ['b', '- '], ['', 'every alert must be actionable\n'],
    ['b', '- '], ['', 'friday deploys: '], ['r', 'strongly no\n'],
    ['b', '- '], ['', 'debugs with logs, not vibes'],
  ];
}

/* ---------- builders ---------- */

function buildHtop(el) {
  el.innerHTML =
    `<div class="htop-row htop-head"><span>PID</span><span>COMMAND</span><span>CPU%</span></div>` +
    PROCS.map(
      (p) => `
      <div class="htop-row${p.killed ? ' is-killed' : ''}">
        <span class="htop-pid">${p.pid}</span>
        <span class="htop-cmd">${esc(p.cmd)}</span>
        <span class="htop-cpu">${p.killed ? '<b class="htop-kill">SIGKILL</b>' : `<i class="htop-bar"><i></i></i><b>${p.cpu}</b>`}</span>
      </div>`
    ).join('');
  const live = PROCS.map((p, i) => {
    const row = $$('.htop-row', el)[i + 1];
    return { ...p, row, fill: $('.htop-bar > i', row), num: $('.htop-cpu b', row), v: 0 };
  });
  return live;
}

function buildChart(svg) {
  // 08h → 20h, hourly
  const coffee = [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4];
  const bugs = [9, 8, 6, 6, 5, 6, 4, 3, 3, 2, 1, 1, 0];
  const W = 320, H = 128, L = 26, R = 8, T = 10, B = 22;
  const x = (i) => L + (i / (coffee.length - 1)) * (W - L - R);
  const y = (v, max) => T + (1 - v / max) * (H - T - B);
  // coffee as a step line (cups are discrete), bugs as a smooth-ish polyline
  let dc = `M ${x(0)} ${y(coffee[0], 5)}`;
  coffee.forEach((v, i) => { if (i) dc += ` H ${x(i)} V ${y(v, 5)}`; });
  const db = bugs.map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v, 10).toFixed(1)}`).join(' ');
  const grid = [0, 0.5, 1].map((f) => `<line class="ch-grid" x1="${L}" x2="${W - R}" y1="${T + f * (H - T - B)}" y2="${T + f * (H - T - B)}"/>`).join('');
  const ticks = [0, 4, 8, 12].map((i) => `<text class="ch-tick" x="${x(i)}" y="${H - 6}" text-anchor="middle">${String(8 + i).padStart(2, '0')}h</text>`).join('');
  const lunch = 5;
  svg.innerHTML = `
    ${grid}${ticks}
    <path class="ch-line ch-coffee" pathLength="1" d="${dc}"/>
    <path class="ch-line ch-bugs" pathLength="1" d="${db}"/>
    <g class="ch-note">
      <circle cx="${x(lunch)}" cy="${y(bugs[lunch], 10)}" r="3.5"/>
      <text x="${x(lunch) + 7}" y="${y(bugs[lunch], 10) - 7}">lunch → bug +1</text>
    </g>`;
  return { lines: $$('.ch-line', svg), note: $('.ch-note', svg) };
}

function buildSpark(line, fill) {
  const rnd = mulberry32(42);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    let v = 6 + rnd() * 4;
    if (i === 14 || i === 29) v = 22 + rnd() * 6; // the incidents we don't talk about
    pts.push([i * 5, v]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y.toFixed(1)}`).join(' ');
  line.setAttribute('d', d);
  fill.setAttribute('d', `${d} L 200 36 L 0 36 Z`);
}

// 52×7 contribution grid on a canvas (cheap to redraw, no 364 DOM nodes)
function buildHeat(canvas) {
  const rnd = mulberry32(1507);
  const COLS = 52, ROWS = 7;
  const level = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const weekend = r === 0 || r === 6;
      const recent = c / COLS;
      let v = rnd() * (weekend ? 0.45 : 1) * (0.55 + recent * 0.6);
      if (!weekend && rnd() < 0.08) v = 1; // release weeks
      level.push(v < 0.18 ? 0 : v < 0.4 ? 1 : v < 0.62 ? 2 : v < 0.82 ? 3 : 4);
    }
  }
  const COLORS = ['rgba(255,255,255,0.05)', 'rgba(46,242,176,0.22)', 'rgba(46,242,176,0.45)', 'rgba(46,242,176,0.7)', '#2ef2b0'];
  const boost = new Float32Array(COLS * ROWS);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, cell = 0, gap = 0, reveal = 0;

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    gap = w < 420 ? 2 : 3;
    cell = (w - gap * (COLS - 1)) / COLS;
    h = Math.ceil(cell * ROWS + gap * (ROWS - 1));
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const k = c * ROWS + r;
        // diagonal wave reveal driven by `reveal` (0..1)
        const t = Math.min(1, Math.max(0, (reveal * 1.25 - (c / COLS) - r * 0.012) * 6));
        if (t <= 0) continue;
        const lv = Math.min(4, level[k] + (boost[k] > 0.5 ? 1 : 0));
        ctx.globalAlpha = t;
        ctx.fillStyle = COLORS[lv];
        const s = cell * (0.6 + 0.4 * t);
        const o = (cell - s) / 2;
        ctx.fillRect(c * (cell + gap) + o, r * (cell + gap) + o, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    size,
    setReveal(v) { if (v !== reveal) { reveal = v; draw(); } },
    twinkle() {
      for (let i = 0; i < boost.length; i++) boost[i] *= 0.6;
      for (let n = 0; n < 4; n++) boost[(Math.random() * boost.length) | 0] = 1;
      draw();
    },
  };
}

/* ---------- main ---------- */

export function setupAbout({ gsap, ScrollTrigger, years, careerStart, reducedMotion }) {
  const section = $('#about');
  const dash = $('.js-dash');
  const procs = buildHtop($('.js-htop'));
  const chart = buildChart($('.js-chart'));
  buildSpark($('.js-spark'), $('.js-spark-fill'));
  const heat = buildHeat($('.js-heat'));
  const clockEl = $('.js-clock');
  const uptimeEl = $('.js-uptime');
  const uptimeS = $('.js-uptime-s');
  const gaugeArc = $('.js-gauge-arc');
  const needle = $('.js-needle');
  const gaugeVal = $('.js-gauge-val');
  const gaugeState = $('.js-gauge-state');
  const logsEl = $('.js-logs');
  const readmeEl = $('.js-readme');
  const start = new Date(careerStart);

  /* static-ish readouts */
  const tickClock = () => {
    const now = new Date();
    clockEl.textContent = `Hanoi ${clockFmt.format(now)}`;
    let m = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
    if (now.getDate() < start.getDate()) m--;
    uptimeEl.textContent = `${Math.floor(m / 12)}y ${m % 12}m`;
    uptimeS.textContent = Math.floor((now - start) / 1000).toLocaleString('en-US');
  };
  tickClock();

  /* gauge */
  const gauge = { v: 0 };
  const renderGauge = () => {
    gaugeArc.style.strokeDashoffset = String(1 - gauge.v / 100);
    needle.style.transform = `rotate(${-90 + gauge.v * 1.8}deg)`;
    gaugeVal.textContent = Math.round(gauge.v);
    const state = gauge.v >= 80 ? 'nominal' : gauge.v >= 55 ? 'degraded' : 'refill needed ☕';
    if (gaugeState.textContent !== state) {
      gaugeState.textContent = state;
      gaugeState.dataset.state = state.split(' ')[0];
    }
  };
  let sip = 0;
  const moveGauge = () => {
    sip++;
    // every 5th reading the cup is empty, then it gets refilled
    const to = sip % 5 === 0 ? 38 + Math.random() * 12 : 78 + Math.random() * 19;
    gsap.to(gauge, { v: to, duration: 1.4, ease: 'elastic.out(1, 0.55)', onUpdate: renderGauge });
  };

  /* htop */
  let killTick = 0;
  const jitterHtop = () => {
    procs.forEach((p) => {
      if (p.killed) return;
      const to = Math.max(2, Math.min(60, p.cpu + (Math.random() - 0.5) * 14));
      gsap.to(p, {
        v: to, duration: 0.6, ease: 'power2.out',
        onUpdate: () => { p.fill.style.transform = `scaleX(${p.v / 60})`; p.num.textContent = Math.round(p.v); },
      });
    });
    // the friday deploy keeps trying to come back
    killTick++;
    const k = procs.find((p) => p.killed);
    const label = $('.htop-kill', k.row);
    if (killTick % 6 === 4) { k.row.classList.add('is-respawn'); label.textContent = 'respawning…'; }
    if (killTick % 6 === 5) { k.row.classList.remove('is-respawn'); label.textContent = 'SIGKILL'; }
  };

  /* logs */
  let logIdx = 0;
  const pushLog = () => {
    const [lvl, msg] = LOGS[logIdx++ % LOGS.length];
    const line = document.createElement('div');
    line.className = `log log-${lvl.toLowerCase()}`;
    line.innerHTML = `<span class="log-t">${clockFmt.format(new Date())}</span><span class="log-l">${lvl}</span><span class="log-m">${esc(msg)}</span>`;
    logsEl.appendChild(line);
    while (logsEl.children.length > 8) logsEl.firstElementChild.remove();
  };
  for (let i = 0; i < 4; i++) pushLog();

  /* readme typing */
  let typed = false;
  const typeReadme = () => {
    if (typed) return;
    typed = true;
    const tokens = readmeTokens(years);
    const total = tokens.reduce((n, [, t]) => n + t.length, 0);
    const render = (n) => {
      let out = '', left = n;
      for (const [cls, text] of tokens) {
        if (left <= 0) break;
        const part = text.slice(0, left);
        left -= part.length;
        out += cls ? `<span class="rd-${cls}">${esc(part)}</span>` : esc(part);
      }
      readmeEl.innerHTML = `${out}<span class="cur"></span>`;
    };
    if (reducedMotion) { render(total); return; }
    const st = { n: 0 };
    gsap.to(st, { n: total, duration: total / 55, ease: 'none', onUpdate: () => render(Math.round(st.n)) });
  };

  /* live loop: only while the section is visible */
  const timers = [];
  const live = {
    on: false,
    start() {
      if (this.on || reducedMotion) return;
      this.on = true;
      timers.push(setInterval(tickClock, 1000));
      timers.push(setInterval(jitterHtop, 900));
      timers.push(setInterval(pushLog, 1500));
      timers.push(setInterval(moveGauge, 2600));
      timers.push(setInterval(() => heat.twinkle(), 450));
      jitterHtop();
      moveGauge();
    },
    stop() {
      this.on = false;
      timers.splice(0).forEach(clearInterval);
    },
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) live.stop();
    else if (ScrollTrigger.isInViewport(section)) live.start();
  });

  /* fit the dashboard into one screen when pinned */
  const fit = () => {
    dash.style.setProperty('--fit', '1');
    if (innerWidth < 900) return;
    const avail = innerHeight - 76 - 28; // below the nav, with a little breathing room
    const s = Math.min(1, avail / dash.offsetHeight);
    dash.style.setProperty('--fit', s.toFixed(3));
  };

  const panels = $$('.panel', dash);
  const slis = $$('.js-sli', dash).map((el) => ({ el, to: Number(el.dataset.to) }));
  const sli = { p: 0 };
  const renderSli = () => slis.forEach((x) => (x.el.textContent = Math.round(x.to * sli.p)));
  const setHeat = { v: 0 };
  const heatUpdate = () => heat.setReveal(setHeat.v);
  heat.size();
  window.addEventListener('resize', () => heat.size());

  if (reducedMotion) {
    heat.setReveal(1);
    chart.lines.forEach((l) => (l.style.strokeDashoffset = '0'));
    $('.js-spark').style.strokeDashoffset = '0';
    gauge.v = 86; renderGauge();
    procs.forEach((p) => { if (!p.killed) { p.v = p.cpu; p.fill.style.transform = `scaleX(${p.cpu / 60})`; p.num.textContent = p.cpu; } });
    sli.p = 1; renderSli();
    typeReadme();
    return;
  }

  const mm = gsap.matchMedia();

  // desktop: pin and scrub the assembly, then hold so it can be enjoyed
  mm.add('(min-width: 900px)', () => {
    fit();
    ScrollTrigger.addEventListener('refreshInit', fit);
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${innerHeight * 1.6}`,
        pin: true,
        scrub: 0.6,
        onEnter: typeReadme,
      },
    });
    tl.from('.dash-top', { opacity: 0, y: 30, duration: 0.4 })
      .from(panels, { opacity: 0, y: 60, scale: 0.94, duration: 0.5, stagger: 0.12 }, 0.1)
      .to(sli, { p: 1, duration: 0.6, ease: 'power2.out', onUpdate: renderSli }, 0.2)
      .fromTo('.js-spark', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'none' }, 0.35)
      .fromTo(chart.lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'none', stagger: 0.1 }, 0.6)
      .from(chart.note, { opacity: 0, duration: 0.2 }, 1.2)
      .to(setHeat, { v: 1, duration: 0.8, ease: 'none', onUpdate: heatUpdate }, 0.75)
      .to({}, { duration: 0.5 }); // hold the finished dashboard for a beat
    return () => ScrollTrigger.removeEventListener('refreshInit', fit);
  });

  // phones: no pin, each panel animates as it enters
  mm.add('(max-width: 899px)', () => {
    dash.style.setProperty('--fit', '1');
    ScrollTrigger.create({ trigger: '.p-readme', start: 'top 85%', once: true, onEnter: typeReadme });
    panels.forEach((p) => gsap.from(p, { opacity: 0, y: 40, duration: 0.7, scrollTrigger: { trigger: p, start: 'top 90%' } }));
    gsap.to(sli, { p: 1, duration: 1.6, ease: 'power2.out', onUpdate: renderSli, scrollTrigger: { trigger: '.p-sli', start: 'top 85%' } });
    gsap.fromTo('.js-spark', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: '.p-uptime', start: 'top 80%' } });
    gsap.fromTo(chart.lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', stagger: 0.15, scrollTrigger: { trigger: '.p-chart', start: 'top 80%' } });
    gsap.to(setHeat, { v: 1, duration: 1.4, ease: 'power1.out', onUpdate: heatUpdate, scrollTrigger: { trigger: '.p-heat', start: 'top 85%' } });
  });

  // Created after the pin exists so the range spans the whole pinned scroll
  // (the pin-spacer is taller than the section itself).
  const range = section.parentElement.classList.contains('pin-spacer') ? section.parentElement : section;
  ScrollTrigger.create({ trigger: range, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? live.start() : live.stop()) });
}
