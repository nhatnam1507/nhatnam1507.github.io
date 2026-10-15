// Boot screen: a few fake systemd lines, then it slides away. Click to skip.
import { gsap } from '../shared/lib.js';
import { $, esc } from '../shared/dom.js';

const LINES = [
  ['ok', '[  OK  ]', ' mounting /dev/portfolio'],
  ['ok', '[  OK  ]', ' go build ./... ................ done'],
  ['ok', '[  OK  ]', ' kubectl get nodes ............. 7 Ready'],
  ['ok', '[  OK  ]', ' aws sts get-caller-identity ... nam@hanoi'],
  ['ok', '[  OK  ]', ' compiling shaders ............. particles online'],
  ['hl', '>', ' welcome, visitor. scroll to explore.'],
];

/** Resolves once the page underneath should start its intro. */
export function boot({ reducedMotion }) {
  const el = $('#boot');
  if (reducedMotion) { el.remove(); return Promise.resolve(); }
  document.body.classList.add('is-booting');
  const log = $('.boot-log', el);
  const bar = $('.boot-bar span', el);

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      gsap.to(el, {
        yPercent: -100, duration: 0.9, ease: 'expo.inOut',
        onComplete: () => { el.remove(); document.body.classList.remove('is-booting'); },
      });
      setTimeout(resolve, 350);
    };
    el.addEventListener('click', finish);
    LINES.forEach(([cls, tag, text], i) => {
      setTimeout(() => {
        log.insertAdjacentHTML('beforeend', `<span class="${cls}">${tag}</span>${esc(text)}\n`);
        bar.style.width = `${((i + 1) / LINES.length) * 100}%`;
        if (i === LINES.length - 1) setTimeout(finish, 380);
      }, 120 + i * 170);
    });
  });
}
