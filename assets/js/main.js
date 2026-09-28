import { cv, yearsOfExperience } from './data.js';
import { createScene, SHAPES } from './scene.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const YEARS = String(yearsOfExperience());
const PDF_NAME = 'Nam_Nguyen_Nhat_CV.pdf';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function shortHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/* ==========================================================================
   1. Content: fill placeholders and render data-driven blocks
   ========================================================================== */

function fillYears() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeValue.includes('__YEARS__')) n.nodeValue = n.nodeValue.replaceAll('__YEARS__', YEARS);
  }
  $$('[data-lines], [data-to]').forEach((el) => {
    for (const a of ['data-lines', 'data-to']) {
      const v = el.getAttribute(a);
      if (v && v.includes('__YEARS__')) el.setAttribute(a, v.replaceAll('__YEARS__', YEARS));
    }
  });
  $('.js-year').textContent = new Date().getFullYear();
}

/* ---------- experience: timeline model ---------- */

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const NOW = new Date();
const NOW_M = NOW.getFullYear() * 12 + NOW.getMonth();
const toMonth = (s) => {
  if (/present/i.test(s)) return NOW_M;
  const [m, y] = s.split(' ');
  return Number(y) * 12 + MONTHS[m.slice(0, 3)];
};
const COMPANY_COLOR = { Toshiba: '#5aa9ff', Rikkeisoft: '#b18cff', Andpad: '#2ef2b0' };
const companyKey = (c) => Object.keys(COMPANY_COLOR).find((k) => c.startsWith(k)) || 'Andpad';

// oldest first so the playhead travels left → right through the career
const JOBS = cv.experience
  .map((j) => ({ ...j, s: toMonth(j.start), e: toMonth(j.end), key: companyKey(j.company) }))
  .sort((a, b) => a.s - b.s || a.e - b.e);
const T0 = Math.floor(JOBS[0].s / 12) * 12;
const T1 = (NOW.getFullYear() + 1) * 12;
const pct = (m) => ((m - T0) / (T1 - T0)) * 100;

function tenure(months) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y}y`, m && `${m}m`].filter(Boolean).join(' ') || '<1m';
}

function renderExperience() {
  const years = [];
  for (let y = T0 / 12; y <= T1 / 12; y++) years.push(y);

  const rows = JOBS.map(
    (j, i) => `
      <div class="tl-row" style="--c:${COMPANY_COLOR[j.key]}" data-i="${i}">
        <div class="tl-label"><i></i>${esc(j.label)}</div>
        <div class="tl-lane">
          <span class="tl-ghost" style="left:${pct(j.s)}%;width:${pct(j.e) - pct(j.s)}%"></span>
          <span class="tl-bar" style="left:${pct(j.s)}%;width:${pct(j.e) - pct(j.s)}%"></span>
          <span class="tl-dot" style="left:${pct(j.s)}%"></span>
        </div>
      </div>`
  ).join('');

  $('.js-timeline').innerHTML = `
    <div class="tl-row tl-axis">
      <div class="tl-label"></div>
      <div class="tl-lane">${years.map((y) => `<span class="tl-year" style="left:${pct(y * 12)}%">${y}</span>`).join('')}</div>
    </div>
    ${rows}
    <div class="tl-over"><div class="tl-playhead"><span class="tl-date"></span></div></div>`;

  const RING = 2 * Math.PI * 30;
  $('.js-role').innerHTML = JOBS.map((j, i) => {
    const months = Math.max(1, j.e - j.s);
    const head = i === JOBS.length - 1;
    const hash = shortHash(j.role + j.company + (j.project || '') + j.start);
    return `
      <article class="role-card" style="--c:${COMPANY_COLOR[j.key]}">
        <div class="role-main">
          <div class="role-meta">
            <span class="role-hash">${hash}</span>
            <span>${esc(j.start)} → ${esc(j.end)}</span>
            ${head ? '<span class="role-head">HEAD → main</span>' : ''}
          </div>
          <h3 class="role-title">${esc(j.role)}</h3>
          <div class="role-company">@ ${esc(j.company)}${j.project ? ` · <b>${esc(j.project)}</b>` : ''}</div>
          <p class="role-hl">${esc(j.highlight)}</p>
          <div class="chips">${j.tags.map((t, k) => `<span class="chip" style="--k:${k}">${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="role-side">
          <div class="ring">
            <svg viewBox="0 0 72 72"><circle class="ring-bg" cx="36" cy="36" r="30"/><circle class="ring-fg" cx="36" cy="36" r="30"
              style="stroke-dasharray:${RING};--off:${RING * (1 - Math.min(1, months / 24))};--full:${RING}"/></svg>
            <span>${tenure(months)}</span>
          </div>
          <div class="impact">
            <b>${esc(j.impact.value)}</b>
            <small>${esc(j.impact.label)}</small>
          </div>
        </div>
      </article>`;
  }).join('');
  $('.js-legend').innerHTML = Object.entries(COMPANY_COLOR).map(([k, c]) => `<span style="--c:${c}"><i></i>${k}</span>`).join('');
  $('.js-exp-total').textContent = String(JOBS.length).padStart(2, '0');
}

function renderStack() {
  const groups = $('.js-skill-groups');
  const CORE = new Set(['Go', 'PostgreSQL', 'Docker', 'Kubernetes', 'Helm', 'CI/CD', 'Git']);
  const isCore = (s) => CORE.has(s);
  groups.innerHTML = cv.skills.groups
    .map(
      (g) => `
      <div class="skill-group">
        <h3>${esc(g.label)}</h3>
        <div class="chips">${g.items.map((s) => `<span class="chip${isCore(s) ? ' core' : ''}">${esc(s)}</span>`).join('')}</div>
      </div>`
    )
    .join('');

  const all = [...new Set(cv.skills.groups.flatMap((g) => g.items))];
  const row = all.map((s) => `<span>${esc(s)}</span><i>✦</i>`).join('');
  $('.js-marquee').innerHTML = row + row;
}

function yamlTokens() {
  const T = [];
  const push = (cls, text) => T.push([cls, text]);
  const key = (k, indent = '') => { push('', indent); push('k', k); push('', ':'); };
  push('c', '# stack.yaml — curated by nam@dev\n');
  key('engineer'); push('s', ` "${cv.name}"`); push('', '\n');
  key('experience'); push('s', ` "${YEARS}+ years"`); push('', '\n');
  key('core'); push('', '\n');
  cv.skills.core.forEach((s) => { push('', '  - '); push('s', s); push('', '\n'); });
  key('cloud'); push('', '\n');
  key('aws', '  '); push('', ' [EC2, ECS, EKS, Lambda, S3, RDS]\n');
  key('gcp', '  '); push('', ' [Pub/Sub]\n');
  key('azure', '  '); push('', ' [AKS]\n');
  key('observability'); push('', ' [Datadog, ELK, Grafana, Prometheus]\n');
  key('exploring'); push('', '\n');
  cv.skills.exploring.forEach((s) => { push('', '  - '); push('s', s); push('', '\n'); });
  key('certified'); push('', ' '); push('p', 'true'); push('c', '  # AWS SAA + CCP\n');
  return T;
}

function renderCredentials() {
  $('.js-certs').innerHTML = cv.certificates
    .map(
      (c) => `
      <div class="cert-wrap"><article class="cert">
        <div class="cert-top"><span>${esc(c.issuer)}</span><span>${esc(c.date)}</span></div>
        <div class="cert-badge" style="margin-top:22px">${esc(c.badge)}</div>
        <h3>${esc(c.short)}</h3>
        <div class="cert-issuer">${esc(c.name)}</div>
        <div class="cert-id"><span>${c.issuer.startsWith('Amazon') ? 'validation' : 'score'}</span><b>${esc(c.id)}</b></div>
      </article></div>`
    )
    .join('');
  const e = cv.education[0];
  $('.js-edu').innerHTML = `
    <div>
      <div class="edu-k">education</div>
      <h3>${esc(e.school)}</h3>
      <p>${esc(e.degree)}</p>
    </div>
    <div class="edu-date">${esc(e.start)} — ${esc(e.end)}</div>`;
}

function renderContact() {
  const c = cv.contact;
  const links = [
    ['email', c.email, `mailto:${c.email}`],
    ['linkedin', c.linkedin, `https://www.${c.linkedin}`],
    ['github', c.github, `https://${c.github}`],
  ];
  $('.js-contact').innerHTML = links
    .map(([k, v, href]) => `<a class="contact-link" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><small>${k} ↗</small><span>${esc(v)}</span></a>`)
    .join('');
}

/* ==========================================================================
   2. Text effects
   ========================================================================== */

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFxz';

function scramble(el, { duration = 1.1, delay = 0 } = {}) {
  const final = el.dataset.text || el.textContent;
  const len = final.length;
  const reveal = Array.from({ length: len }, () => Math.random() * 0.6 + 0.2);
  const state = { t: 0 };
  return gsap.to(state, {
    t: 1,
    duration,
    delay,
    ease: 'none',
    onUpdate() {
      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = final[i];
        if (ch === ' ' || state.t >= reveal[i]) out += ch;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete() { el.textContent = final; },
  });
}

function typeTerminal(el) {
  const lines = JSON.parse(el.dataset.lines);
  let html = '';
  let li = 0, ci = 0;
  const cursor = '<span class="cur"></span>';
  return new Promise((resolve) => {
    function step() {
      const line = lines[li];
      if (!line) { el.innerHTML = html + cursor; resolve(); return; }
      if (line.o !== undefined) {
        html += `<span class="o">${esc(line.o)}</span>\n`;
        li++; ci = 0;
        el.innerHTML = html + cursor;
        setTimeout(step, 380);
        return;
      }
      if (ci === 0) html += `<span class="p">${esc(line.p)}</span>`;
      if (ci < line.t.length) {
        html += esc(line.t[ci++]);
        el.innerHTML = html + cursor;
        setTimeout(step, 38 + Math.random() * 60);
      } else {
        html += '\n';
        li++; ci = 0;
        setTimeout(step, 240);
      }
    }
    step();
  });
}

function typeTokens(el, tokens, charsPerFrame = 3) {
  const total = tokens.reduce((n, [, t]) => n + t.length, 0);
  const renderUpTo = (n) => {
    let out = '', left = n;
    for (const [cls, text] of tokens) {
      if (left <= 0) break;
      const part = text.slice(0, left);
      left -= part.length;
      out += cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part);
    }
    el.innerHTML = out + '<span class="cur"></span>';
  };
  if (reducedMotion) { renderUpTo(total); return; }
  let n = 0;
  const tick = () => {
    n = Math.min(total, n + charsPerFrame);
    renderUpTo(n);
    if (n < total) requestAnimationFrame(tick);
  };
  tick();
}

// wrap words of headings so each can slide up from a mask
function splitWords(el) {
  const frag = document.createDocumentFragment();
  const wrap = (node) => {
    const w = document.createElement('span');
    w.className = 'w';
    const inner = document.createElement('span');
    inner.appendChild(node);
    w.appendChild(inner);
    return w;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
        else frag.appendChild(wrap(document.createTextNode(part)));
      });
    } else {
      frag.appendChild(wrap(node));
    }
  });
  el.innerHTML = '';
  el.appendChild(frag);
  return $$('.w > span', el);
}

// wrap every word of the about paragraph into .word (em words get .em)
function splitReading(el) {
  const words = [];
  const frag = document.createDocumentFragment();
  const addWords = (text, em) => {
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
      const s = document.createElement('span');
      s.className = 'word' + (em ? ' em' : '');
      s.textContent = part;
      frag.appendChild(s);
      words.push(s);
    });
  };
  [...el.childNodes].forEach((n) => addWords(n.textContent, n.nodeType === Node.ELEMENT_NODE));
  el.innerHTML = '';
  el.appendChild(frag);
  return words;
}

/* ==========================================================================
   3. Boot sequence
   ========================================================================== */

function boot() {
  const el = $('#boot');
  if (reducedMotion) { el.remove(); return Promise.resolve(); }
  document.body.classList.add('is-booting');
  const log = $('.boot-log', el);
  const bar = $('.boot-bar span', el);
  const lines = [
    ['ok', '[  OK  ]', ' mounting /dev/portfolio'],
    ['ok', '[  OK  ]', ' go build ./... ................ done'],
    ['ok', '[  OK  ]', ' kubectl get nodes ............. 7 Ready'],
    ['ok', '[  OK  ]', ' aws sts get-caller-identity ... nam@hanoi'],
    ['ok', '[  OK  ]', ' compiling shaders ............. particles online'],
    ['hl', '>', ' welcome, visitor. scroll to explore.'],
  ];
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      gsap.to(el, {
        yPercent: -100,
        duration: 0.9,
        ease: 'expo.inOut',
        onComplete: () => { el.remove(); document.body.classList.remove('is-booting'); },
      });
      setTimeout(resolve, 350);
    };
    el.addEventListener('click', finish);
    lines.forEach(([cls, tag, text], i) => {
      setTimeout(() => {
        log.insertAdjacentHTML('beforeend', `<span class="${cls}">${tag}</span>${esc(text)}\n`);
        bar.style.width = `${((i + 1) / lines.length) * 100}%`;
        if (i === lines.length - 1) setTimeout(finish, 380);
      }, 120 + i * 170);
    });
  });
}

/* ==========================================================================
   4. Scroll, scene and animations
   ========================================================================== */

function setupSmoothScroll() {
  if (reducedMotion) return null;
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// Nav jumps: instead of smooth-scrolling through every pinned/scrubbed section
// in between (which replays all of them at once and stutters), a curtain wipes
// in, the page jumps instantly underneath it, and the curtain wipes out.
function setupAnchors(lenis, scene) {
  const curtain = $('.curtain');
  const cmd = $('.curtain-cmd');
  let busy = false;

  const jump = (target) => {
    // land on the pin start for pinned sections
    const el = target.parentElement?.classList.contains('pin-spacer') ? target.parentElement : target;
    const y = el.getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
    scene?.snap();
  };

  $$('[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (reducedMotion) { jump(target); return; }
      if (busy) return;
      busy = true;
      cmd.textContent = `cd ~/${target.id === 'hero' ? '' : target.id}`;
      gsap.timeline({ onComplete: () => { busy = false; } })
        .set(curtain, { visibility: 'visible', yPercent: 100 })
        .to(curtain, { yPercent: 0, duration: 0.38, ease: 'power3.in' })
        .call(() => jump(target))
        .to(curtain, { yPercent: -100, duration: 0.5, ease: 'power3.out', delay: 0.14 })
        .set(curtain, { visibility: 'hidden' });
    });
  });
}

function heroIntro() {
  const tl = gsap.timeline();
  $$('.hero-name .scramble').forEach((el, i) => {
    tl.from(el, { yPercent: 110, duration: 1.1, ease: 'expo.out' }, i * 0.12);
    if (!reducedMotion) tl.add(scramble(el, { duration: 1.2 }), i * 0.12);
  });
  tl.from('.reveal-hero', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }, 0.3);
  tl.from('.nav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
  tl.from('.hud', { opacity: 0, duration: 1 }, 0.6);
  tl.call(() => typeTerminal($('.js-typer')), null, 0.8);
  return tl;
}

function setupAbout() {
  const el = $('.js-words');
  const words = splitReading(el);
  if (reducedMotion) { words.forEach((w) => w.classList.add('lit')); return; }
  let lit = 0;
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top top',
    end: '+=140%',
    pin: true,
    scrub: true,
    onUpdate(self) {
      const next = Math.min(words.length, Math.round(self.progress * words.length * 1.08));
      if (next === lit) return;
      const [a, b, on] = next > lit ? [lit, next, true] : [next, lit, false];
      for (let i = a; i < b; i++) words[i].classList.toggle('lit', on);
      lit = next;
    },
  });
}

// Pinned timeline: scrolling moves a playhead through time, bars draw in
// behind it and the matching role card swaps in. Only transforms/classes are
// written per update, and only when they change.
function setupExperience() {
  const section = $('#experience');
  const rows = $$('.tl-row[data-i]');
  const bars = rows.map((r) => $('.tl-bar', r));
  const playhead = $('.tl-playhead');
  const dateEl = $('.tl-date');
  const cards = $$('.role-card');
  const stepEl = $('.js-exp-step');
  const N = JOBS.length;
  let active = -1;
  let lastDate = '';

  const setActive = (i) => {
    if (i === active) return;
    active = i;
    rows.forEach((r, k) => { r.classList.toggle('is-active', k === i); r.classList.toggle('is-past', k < i); });
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    stepEl.textContent = String(i + 1).padStart(2, '0');
  };

  const render = (p) => {
    const step = Math.min(N - 1, Math.floor(p * N));
    const frac = Math.min(1, p * N - step);
    const from = JOBS[step].s;
    const to = step < N - 1 ? JOBS[step + 1].s : NOW_M;
    const t = from + (to - from) * frac;
    playhead.style.transform = `translate3d(${pct(t)}%,0,0)`;
    const m = Math.round(t);
    const label = `${Math.floor(m / 12)}.${String((m % 12) + 1).padStart(2, '0')}`;
    if (label !== lastDate) { dateEl.textContent = label; lastDate = label; }
    JOBS.forEach((j, k) => {
      const v = Math.min(1, Math.max(0, (t - j.s) / Math.max(1, j.e - j.s)));
      bars[k].style.transform = `scaleX(${v})`;
    });
    setActive(step);
  };

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    section.classList.remove('is-static');
    const proxy = { p: 0 };
    render(0);
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      onUpdate: () => render(proxy.p),
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${innerHeight * N * 0.5}`,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });
    return () => tween.kill();
  });

  // phones: no pin — fully drawn chart, every role listed, animate on enter
  mm.add('(max-width: 899px)', () => {
    section.classList.add('is-static');
    playhead.style.transform = `translate3d(${pct(NOW_M)}%,0,0)`;
    dateEl.textContent = 'now';
    // cards animate via their CSS transition when they get .is-active
    gsap.fromTo(bars, { scaleX: 0 }, {
      scaleX: 1, duration: 1.2, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.js-timeline', start: 'top 85%' },
    });
    cards.forEach((c) => ScrollTrigger.create({ trigger: c, start: 'top 92%', once: true, onEnter: () => c.classList.add('is-active') }));
  });
}

function setupReveals() {
  $$('.split').forEach((el) => {
    const parts = splitWords(el);
    gsap.from(parts, {
      yPercent: 110,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  $$('.kicker').forEach((el) => {
    gsap.from(el, { opacity: 0, x: -20, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // counters
  $$('.stat').forEach((stat, i) => {
    const num = $('.js-count', stat);
    const to = Number(num.dataset.to);
    const obj = { v: 0, p: 0 };
    gsap.from(stat, { opacity: 0, y: 40, duration: 0.9, delay: i * 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.stat-grid', start: 'top 80%' } });
    gsap.to(obj, {
      v: to,
      p: 1,
      duration: 1.8,
      delay: 0.2 + i * 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.stat-grid', start: 'top 80%' },
      onUpdate() {
        num.textContent = Math.round(obj.v);
        stat.style.setProperty('--p', obj.p);
      },
    });
  });

  // stack
  let typed = false;
  ScrollTrigger.create({
    trigger: '.term-stack',
    start: 'top 75%',
    onEnter() { if (!typed) { typed = true; typeTokens($('.js-yaml'), yamlTokens(), 4); } },
  });
  gsap.from('.skill-group', {
    opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', stagger: 0.07,
    scrollTrigger: { trigger: '.skill-groups', start: 'top 80%' },
  });

  // certs
  gsap.from('.cert-wrap', {
    opacity: 0, y: 80, rotateX: -25, duration: 1.1, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.cert-grid', start: 'top 80%' },
  });
  gsap.from('.edu', { opacity: 0, y: 40, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.edu', start: 'top 90%' } });

  // contact
  gsap.from('.contact-title .line > span', {
    yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.contact-title', start: 'top 80%' },
  });
  gsap.from('.contact-link', {
    opacity: 0, y: 30, duration: 0.8, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: '.contact-links', start: 'top 88%' },
  });

  // hero parallax out
  gsap.to('#hero .container', {
    yPercent: -25, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

function setupTilt() {
  if (!finePointer) return;
  $$('.cert').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

function setupCursor() {
  const c = $('.cursor');
  if (!finePointer || reducedMotion) { c.remove(); return; }
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const setX = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const setY = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    setX(pos.x); setY(pos.y);
    c.classList.add('is-visible');
  });
  document.addEventListener('pointerleave', () => c.classList.remove('is-visible'));
  document.addEventListener('pointerover', (e) => {
    c.classList.toggle('is-hover', !!e.target.closest('a, button, .cert, .skill-group'));
  });
}

// Scene progress, HUD and nav state. Section offsets are measured once per
// ScrollTrigger refresh (pinned sections via their pin-spacer), so the
// per-frame work is arithmetic on scrollY with no layout reads, and the DOM
// is only written when a value actually changes.
function setupTracking(scene) {
  const sections = $$('main .section');
  const nav = $('.nav');
  const navLinks = $$('.nav-links a');
  const hudNum = $('.hud-num');
  const hudLabel = $('.hud-label');
  const hudFill = $('.hud-fill');
  const hudPct = $('.hud-pct');
  const hudShape = $('.hud-shape');
  const hudCoords = $('.hud-coords');
  const hudFps = $('.hud-fps');
  $('.hud-total').textContent = String(sections.length - 1).padStart(2, '0');

  let tops = [], maxScroll = 1;
  const measure = () => {
    const y = scrollY;
    tops = sections.map((sec) => {
      const el = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec;
      return el.getBoundingClientRect().top + y;
    });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  };
  ScrollTrigger.addEventListener('refresh', measure);
  measure();

  const fmt = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(3);
  let coordsDirty = false, px = 0, py = 0;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / innerWidth) * 2 - 1;
    py = -(e.clientY / innerHeight) * 2 + 1;
    coordsDirty = true;
  });

  let active = -1, lastPct = -1, scrolled = null, frames = 0, last = performance.now();
  gsap.ticker.add(() => {
    const y = scrollY;
    const vh = innerHeight;
    let s = 0, current = 0;
    for (let i = 0; i < tops.length; i++) {
      const top = tops[i] - y;
      if (i > 0) s += Math.min(1, Math.max(0, (vh - top) / (vh * 0.8)));
      if (top <= vh * 0.5) current = i;
    }
    scene?.setProgress(s);

    if (current !== active) {
      active = current;
      hudNum.textContent = String(active).padStart(2, '0');
      hudLabel.textContent = sections[active].dataset.label;
      hudShape.textContent = `mesh: ${SHAPES[Math.min(active, SHAPES.length - 1)].name}`;
      const id = sections[active].id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    }

    const p = Math.round((y / maxScroll) * 1000) / 1000;
    if (p !== lastPct) {
      lastPct = p;
      hudFill.style.transform = `scaleY(${p})`;
      hudPct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
    }
    const sc = y > 40;
    if (sc !== scrolled) { scrolled = sc; nav.classList.toggle('is-scrolled', sc); }

    if (coordsDirty) { coordsDirty = false; hudCoords.textContent = `x:${fmt(px)} y:${fmt(py)}`; }

    frames++;
    const now = performance.now();
    if (now - last > 500) {
      hudFps.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
      frames = 0; last = now;
    }
  });
}

/* ==========================================================================
   5. Export
   ========================================================================== */

function setupExport() {
  const toast = $('.toast');
  let timer;
  const show = (html) => {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-on'), 2800);
  };
  $$('.js-export').forEach((btn) => {
    btn.setAttribute('download', PDF_NAME);
    btn.addEventListener('click', () => show(`<b>✓</b> exporting ${PDF_NAME}`));
  });
}

/* ==========================================================================
   Init
   ========================================================================== */

async function init() {
  fillYears();
  renderExperience();
  renderStack();
  renderCredentials();
  renderContact();

  let scene = null;
  try {
    scene = createScene($('#webgl'), { reducedMotion });
  } catch (err) {
    console.warn('WebGL unavailable, continuing without the 3D scene.', err);
    $('#webgl').remove();
  }

  const lenis = setupSmoothScroll();
  lenis?.stop();
  setupAnchors(lenis, scene);
  setupAbout();
  setupExperience();
  setupReveals();
  setupTilt();
  setupCursor();
  setupTracking(scene);
  setupExport();

  await boot();
  lenis?.start();
  heroIntro();
  ScrollTrigger.refresh();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

init();
