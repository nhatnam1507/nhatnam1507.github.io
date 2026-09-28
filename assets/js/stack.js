// 03 // stack — the toolset drawn as the system it builds.
// Desktop: pinned; layers "deploy" one by one as you scroll, then request
// packets flow, CI runs and pods self-heal while the section is on screen.
// Phones: stacked boxes that animate in, no connectors.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SVGNS = 'http://www.w3.org/2000/svg';

// [name, level, regex matched against each role's tags + bullets]
const BOXES = {
  api: {
    title: 'api edge', sub: 'exposed via',
    items: [['gRPC', 'used', /grpc/i], ['GraphQL', 'used', /graphql/i], ['REST', 'used', /\brest\b/i], ['OIDC / Okta', 'used', /oidc|okta/i]],
  },
  svc: {
    title: 'services', sub: 'written in',
    items: [['Go', 'core', /\bgo\b/i], ['C / C++', 'used', /c\/c\+\+/i], ['Java · Spring', 'used', /java/i], ['Python', 'explore', /python/i]],
  },
  data: {
    title: 'data', sub: 'stored & streamed',
    items: [['PostgreSQL', 'core', /postgres/i], ['MSSQL', 'used', /mssql/i], ['Kafka', 'used', /kafka/i], ['Pub/Sub', 'used', /pub\/sub/i]],
  },
  obs: {
    title: 'observability', sub: 'watched by',
    items: [['Datadog', 'used', /datadog/i], ['Grafana', 'used', /grafana/i], ['Prometheus', 'used', /prometheus/i], ['ELK', 'used', /\belk\b/i]],
  },
  plat: {
    title: 'platform', sub: 'runs on',
    items: [['Docker', 'core', /docker/i], ['Kubernetes', 'core', /kubernetes|\baks\b|\beks\b/i], ['Helm', 'core', /helm/i], ['AWS', 'used', /\baws\b/i], ['Google Cloud', 'used', /google cloud|pub\/sub/i], ['Azure AKS', 'used', /\baks\b/i]],
  },
};

const STAGES = [
  ['git push', 'Git', /\bgit\b|svn/i],
  ['build', 'GitHub Actions', /github actions|ci\/cd/i],
  ['test', 'Testify · GTest', /testify|gtest|unit test/i],
  ['migrate', 'Liquibase', /liquibase|migration/i],
  ['deploy', 'Ansible · Helm', /ansible|helm/i],
];

// caption per build step (index = scrubbed step)
const STEPS = [
  '$ make deploy',
  '$ kubectl apply -f platform/',
  '$ go build ./services/...',
  '$ migrate up · kafka topics created',
  '$ expose grpc · graphql · rest',
  '$ gh workflow run pipeline',
  '$ curl /healthz → 200 · all green ✓',
];

const node = ([name, level], i) =>
  `<span class="an an-${level}" tabindex="0" data-k="${i}" style="--i:${i}">${esc(name)}</span>`;

function boxHTML(id) {
  const b = BOXES[id];
  const extra = {
    plat: `<div class="pods js-pods">${'<i></i>'.repeat(12)}</div><div class="pods-label"><b class="js-pods-n">12/12</b> pods Running</div>`,
    obs: `<div class="rps js-rps">${'<i></i>'.repeat(14)}</div><div class="rps-label">p99 <b class="js-p99">42</b>ms · errors <b>0.0%</b></div>`,
    data: `<div class="queue js-queue" aria-hidden="true">${'<i></i>'.repeat(6)}</div>`,
  }[id] || '';
  return `
    <div class="ab ab-${id}" data-box="${id}">
      <div class="ab-h"><span>#</span> ${b.title} <em>${b.sub}</em></div>
      <div class="ab-nodes">${b.items.map((it, i) => node(it, `${id}:${i}`)).join('')}</div>
      ${extra}
    </div>`;
}

export function setupStack({ gsap, ScrollTrigger, jobs, reducedMotion }) {
  const section = $('#stack');
  const arch = $('.js-arch');
  const board = $('.js-arch-board');
  const tip = $('.js-arch-tip');
  const stepEl = $('.js-arch-step');

  board.innerHTML = `
    <div class="ab ab-ci" data-box="ci">
      <div class="ab-h"><span>#</span> delivery <em>pipeline <b class="js-ci-run">#1507</b></em><span class="ci-status js-ci-status">queued</span></div>
      <div class="ci">${STAGES.map(([s, tool], i) => `
        <span class="ci-stage" tabindex="0" data-k="ci:${i}"><b>${s}</b><small>${esc(tool)}</small></span>${i < STAGES.length - 1 ? '<i class="ci-arrow"></i>' : ''}`).join('')}
      </div>
    </div>
    <div class="ab ab-client" data-box="client">
      <div class="client-icon" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="ab-h">clients</div>
      <small>web · mobile · services</small>
    </div>
    ${boxHTML('api')}${boxHTML('svc')}${boxHTML('data')}${boxHTML('obs')}${boxHTML('plat')}
    <svg class="arch-wires js-wires" aria-hidden="true"></svg>`;

  /* ---------- tooltips: which roles actually used this ---------- */
  const lookup = (key) => {
    const [box, i] = key.split(':');
    if (box === 'ci') { const s = STAGES[+i]; return { name: `${s[0]} · ${s[1]}`, level: 'used', re: s[2] }; }
    const [name, level, re] = BOXES[box].items[+i];
    return { name, level, re };
  };
  const rolesFor = (re) => jobs.filter((j) => re.test([...j.tags, ...j.bullets].join(' '))).map((j) => j.label);
  const showTip = (el) => {
    const { name, level, re } = lookup(el.dataset.k);
    const roles = [...new Set(rolesFor(re))];
    const lvl = { core: 'core skill', used: 'in production', explore: 'currently exploring' }[level];
    const where = roles.length ? `used at ${roles.join(', ')}` : level === 'explore' ? 'side projects & learning' : 'daily driver across projects';
    tip.innerHTML = `<b>${esc(name)}</b><span class="tip-${level}">${lvl}</span><small>${esc(where)}</small>`;
    const r = el.getBoundingClientRect();
    const a = arch.getBoundingClientRect();
    const scale = a.width / arch.offsetWidth || 1;
    tip.style.left = `${(r.left - a.left + r.width / 2) / scale}px`;
    tip.style.top = `${(r.top - a.top) / scale}px`;
    tip.classList.add('is-on');
  };
  const hideTip = () => tip.classList.remove('is-on');
  board.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-k]'); if (el) showTip(el); });
  board.addEventListener('pointerout', (e) => { if (e.target.closest('[data-k]')) hideTip(); });
  board.addEventListener('focusin', (e) => { const el = e.target.closest('[data-k]'); if (el) showTip(el); });
  board.addEventListener('focusout', hideTip);

  /* ---------- wires between boxes (desktop only) ---------- */
  const wires = $('.js-wires');
  const box = (id) => $(`[data-box="${id}"]`, board);
  const WIRES = [
    // id, from, to, kind
    ['w-client-api', 'client', 'api', 'flow'],
    ['w-api-svc', 'api', 'svc', 'flow'],
    ['w-svc-data', 'svc', 'data', 'flow'],
    ['w-data-obs', 'data', 'obs', 'telemetry'],
    ['w-ci-svc', 'ci', 'svc', 'deploy'],
  ];
  let wiresBuilt = false;
  const layoutWires = () => {
    if (innerWidth < 900) return;
    const scale = board.getBoundingClientRect().width / board.offsetWidth || 1;
    const b = board.getBoundingClientRect();
    const R = (el) => {
      const r = el.getBoundingClientRect();
      return { l: (r.left - b.left) / scale, t: (r.top - b.top) / scale, r: (r.right - b.left) / scale, b: (r.bottom - b.top) / scale };
    };
    wires.setAttribute('viewBox', `0 0 ${board.offsetWidth} ${board.offsetHeight}`);
    const d = {};
    WIRES.forEach(([id, from, to, kind]) => {
      const A = R(box(from)), B = R(box(to));
      if (kind === 'deploy') {
        const x = B.l + (B.r - B.l) * 0.5;
        d[id] = `M ${x} ${A.b} L ${x} ${B.t}`;
      } else {
        const y1 = A.t + (A.b - A.t) * 0.5, y2 = B.t + (B.b - B.t) * 0.5;
        const mx = (A.r + B.l) / 2;
        d[id] = `M ${A.r} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${B.l} ${y2}`;
      }
    });
    // "runs on" drops from each service box down to the platform band
    const P = R(box('plat'));
    const drops = ['api', 'svc', 'data', 'obs'].map((id) => { const X = R(box(id)); const x = (X.l + X.r) / 2; return `M ${x} ${X.b} L ${x} ${P.t}`; }).join(' ');

    if (!wiresBuilt) {
      wiresBuilt = true;
      wires.innerHTML = `
        <path class="wire-drop js-drops" d=""/>
        ${WIRES.map(([id, , , kind]) => `<path id="${id}" class="wire wire-${kind}" pathLength="1" d=""/>`).join('')}
        <g class="packets js-packets">
          ${WIRES.flatMap(([id, , , kind]) => [0, 1, 2].map((k) => `
            <circle class="pk pk-${kind}" r="${kind === 'flow' ? 3.2 : 2.6}">
              <animateMotion dur="${kind === 'flow' ? 1.8 : 2.6}s" begin="-${(k * (kind === 'flow' ? 0.6 : 0.87)).toFixed(2)}s" repeatCount="indefinite" rotate="auto">
                <mpath href="#${id}"/>
              </animateMotion>
            </circle>`)).join('')}
        </g>`;
      wires.pauseAnimations();
    }
    WIRES.forEach(([id]) => $(`#${id}`, wires).setAttribute('d', d[id]));
    $('.js-drops', wires).setAttribute('d', drops);
  };

  /* ---------- live bits ---------- */
  const stageEls = $$('.ci-stage', board);
  const ciStatus = $('.js-ci-status', board);
  const ciRun = $('.js-ci-run', board);
  let run = 1507, stage = -1;
  const tickCI = () => {
    stage++;
    if (stage === 0) { stageEls.forEach((s) => s.classList.remove('is-run', 'is-ok')); ciRun.textContent = `#${run++}`; }
    if (stage > 0 && stage <= STAGES.length) { stageEls[stage - 1].classList.remove('is-run'); stageEls[stage - 1].classList.add('is-ok'); }
    if (stage < STAGES.length) { stageEls[stage].classList.add('is-run'); ciStatus.textContent = `running ${stage + 1}/${STAGES.length}`; ciStatus.dataset.s = 'run'; }
    else if (stage === STAGES.length) { ciStatus.textContent = 'passed ✓'; ciStatus.dataset.s = 'ok'; }
    else if (stage > STAGES.length + 2) stage = -1;
  };

  const pods = $$('.js-pods i', board);
  const podsN = $('.js-pods-n', board);
  const tickPods = () => {
    const p = pods[(Math.random() * pods.length) | 0];
    p.classList.add('is-restart');
    podsN.textContent = `${pods.length - 1}/${pods.length}`;
    setTimeout(() => { p.classList.remove('is-restart'); podsN.textContent = `${pods.length}/${pods.length}`; }, 1300);
  };

  const bars = $$('.js-rps i', board);
  const p99 = $('.js-p99', board);
  const queue = $$('.js-queue i', board);
  let q = 0;
  const tickMetrics = () => {
    bars.forEach((b) => { b.style.transform = `scaleY(${(0.25 + Math.random() * 0.75).toFixed(2)})`; });
    p99.textContent = 36 + ((Math.random() * 14) | 0);
    queue.forEach((m, i) => m.classList.toggle('is-on', (i + q) % 3 === 0));
    q++;
  };

  const timers = [];
  const live = {
    on: false, built: reducedMotion,
    start() {
      if (this.on || reducedMotion) return;
      this.on = true;
      if (this.built) wires.unpauseAnimations();
      timers.push(setInterval(tickCI, 750), setInterval(tickPods, 2200), setInterval(tickMetrics, 700));
      tickMetrics();
    },
    stop() {
      this.on = false;
      wires.pauseAnimations();
      timers.splice(0).forEach(clearInterval);
    },
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) live.stop(); else if (ScrollTrigger.isInViewport(section)) live.start(); });

  /* ---------- fit to one screen when pinned ---------- */
  const fit = () => {
    arch.style.setProperty('--fit', '1');
    if (innerWidth < 900) return;
    const scale = Math.min(1, (innerHeight - 76 - 24) / arch.offsetHeight);
    arch.style.setProperty('--fit', scale.toFixed(3));
    // centred when it fits; top-aligned when scaled down (scale origin is the top)
    section.style.alignItems = scale < 1 ? 'flex-start' : '';
  };

  const setStep = (i) => { if (stepEl.dataset.i !== String(i)) { stepEl.dataset.i = i; stepEl.textContent = STEPS[i]; } };

  if (reducedMotion) {
    fit(); layoutWires(); setStep(STEPS.length - 1);
    addEventListener('resize', () => { fit(); layoutWires(); });
    return;
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    fit();
    layoutWires();
    const relayout = () => { fit(); layoutWires(); };
    ScrollTrigger.addEventListener('refresh', relayout);
    document.fonts?.ready.then(layoutWires);

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 0.5 },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${innerHeight * 1.5}`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * (STEPS.length - 0.2)))),
        onLeave: () => { live.built = true; if (live.on) wires.unpauseAnimations(); },
        onEnterBack: () => { live.built = true; },
      },
    });
    const from = { opacity: 0, y: 36, scale: 0.96 };
    tl.from('.arch-head', { opacity: 0, y: 24, duration: 0.3 })
      .from('.ab-plat', from, 0.2)
      .from('.ab-plat .an', { opacity: 0, y: 10, stagger: 0.04, duration: 0.25 }, 0.35)
      .from('.ab-svc', from, 0.7)
      .from('.ab-data', from, 1.1)
      .from('.wire-drop', { opacity: 0, duration: 0.3 }, 1.2)
      .from(['.ab-client', '.ab-api'], { ...from, stagger: 0.1 }, 1.5)
      .fromTo($$('.wire-flow', wires), { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.12, duration: 0.4, ease: 'none' }, 1.75)
      .from('.ab-ci', from, 2.2)
      .fromTo($$('.wire-deploy', wires), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'none' }, 2.45)
      .from('.ab-obs', from, 2.7)
      .fromTo($$('.wire-telemetry', wires), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.9)
      .fromTo('.js-packets', { opacity: 0 }, {
        opacity: 1, duration: 0.3,
        onStart: () => { live.built = true; if (live.on) wires.unpauseAnimations(); },
      }, 2.95)
      .to({}, { duration: 0.6 });
    return () => ScrollTrigger.removeEventListener('refresh', relayout);
  });

  mm.add('(max-width: 899px)', () => {
    arch.style.setProperty('--fit', '1');
    setStep(STEPS.length - 1);
    $$('.ab', board).forEach((b) => gsap.from(b, { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 90%' } }));
  });

  // Created after the pin exists so the range spans the whole pinned scroll
  // (the pin-spacer is taller than the section itself).
  const range = section.parentElement.classList.contains('pin-spacer') ? section.parentElement : section;
  ScrollTrigger.create({ trigger: range, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? live.start() : live.stop()) });
}
