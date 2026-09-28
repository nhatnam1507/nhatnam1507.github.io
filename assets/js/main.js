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

function renderExperience() {
  const track = $('.js-exp-track');
  const cards = cv.experience.map((job, i) => {
    const hash = shortHash(job.role + job.company + (job.project || '') + job.start);
    return `
      <li class="exp-card${i === 0 ? ' is-current' : ''}">
        <div class="exp-meta">
          <span class="exp-hash">${hash}</span>
          <span class="exp-date">${esc(job.start)} → ${esc(job.end)}</span>
          ${i === 0 ? '<span class="exp-head-tag">HEAD → main</span>' : ''}
        </div>
        <h3 class="exp-role">${esc(job.role)}</h3>
        <div class="exp-company">@ ${esc(job.company)}${job.project ? ` · <b>${esc(job.project)}</b>` : ''}</div>
        <ul class="exp-bullets">${job.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <div class="chips">${job.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      </li>`;
  });
  const edu = cv.education[0];
  cards.push(`
    <li class="exp-card exp-end">
      <span>$ git log --reverse | head -1</span>
      <strong>initial commit</strong>
      <span>${esc(edu.degree)}<br>${esc(edu.school)} · ${esc(edu.start)} – ${esc(edu.end)}</span>
    </li>`);
  track.innerHTML = cards.join('');
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

function setupAnchors(lenis) {
  $$('[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else target.scrollIntoView();
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
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top top',
    end: '+=140%',
    pin: true,
    scrub: true,
    onUpdate(self) {
      const lit = Math.round(self.progress * words.length * 1.08);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    },
  });
}

function setupExperience() {
  const section = $('#experience');
  const track = $('.js-exp-track');
  const cards = $$('.exp-card', track);
  const bar = $('.exp-progress span');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate(self) {
          bar.style.transform = `scaleX(${self.progress})`;
          const idx = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
          cards.forEach((c, i) => c.classList.toggle('is-current', i === idx));
        },
      },
    });
    cards.forEach((card) => {
      gsap.from(card, {
        opacity: 0.2,
        y: 60,
        rotateZ: 2,
        ease: 'power2.out',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 65%', scrub: true },
      });
    });
    return () => gsap.set(track, { clearProps: 'transform' });
  });

  mm.add('(max-width: 899px)', () => {
    cards.forEach((card) => {
      gsap.from(card, { opacity: 0, y: 50, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    });
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

// scene progress, HUD, nav — computed every frame from section rects so it stays
// correct regardless of pinning
function setupTracking(scene) {
  const sections = $$('main .section'); // pinned sections get wrapped in a pin-spacer
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

  let pointerX = 0, pointerY = 0;
  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / innerWidth) * 2 - 1;
    pointerY = -(e.clientY / innerHeight) * 2 + 1;
  });

  let active = -1, frames = 0, last = performance.now();
  gsap.ticker.add(() => {
    const vh = innerHeight;
    let s = 0;
    let current = 0;
    sections.forEach((sec, i) => {
      const top = sec.getBoundingClientRect().top;
      if (i > 0) s += Math.min(1, Math.max(0, (vh - top) / (vh * 0.8)));
      if (top <= vh * 0.5) current = i;
    });
    scene?.setProgress(s);

    if (current !== active) {
      active = current;
      const label = sections[active].dataset.label;
      hudNum.textContent = String(active).padStart(2, '0');
      hudLabel.textContent = label;
      hudShape.textContent = `mesh: ${SHAPES[Math.min(active, SHAPES.length - 1)].name}`;
      const id = sections[active].id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    }

    const max = document.documentElement.scrollHeight - vh;
    const pct = max > 0 ? scrollY / max : 0;
    hudFill.style.transform = `scaleY(${pct})`;
    hudPct.textContent = `${String(Math.round(pct * 100)).padStart(3, '0')}%`;
    nav.classList.toggle('is-scrolled', scrollY > 40);

    const f = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(3);
    hudCoords.textContent = `x:${f(pointerX)} y:${f(pointerY)}`;

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
  setupAnchors(lenis);
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
