// htop — "brain.processes": CPU bars that jitter, plus a deploy-on-friday.sh
// that keeps respawning and getting SIGKILLed.
import { gsap } from '../../../shared/lib.js';
import { $, $$, esc } from '../../../shared/dom.js';

const MAX_CPU = 60;

export function createHtop(el, processes) {
  el.innerHTML =
    `<div class="htop-row htop-head"><span>PID</span><span>COMMAND</span><span>CPU%</span></div>` +
    processes.map((p) => `
      <div class="htop-row${p.killed ? ' is-killed' : ''}">
        <span class="htop-pid">${p.pid}</span>
        <span class="htop-cmd">${esc(p.cmd)}</span>
        <span class="htop-cpu">${p.killed ? '<b class="htop-kill">SIGKILL</b>' : `<i class="htop-bar"><i></i></i><b>${p.cpu}</b>`}</span>
      </div>`).join('');

  const rows = $$('.htop-row', el).slice(1);
  const procs = processes.map((p, i) => ({ ...p, row: rows[i], fill: $('.htop-bar > i', rows[i]), num: $('.htop-cpu b', rows[i]), v: 0 }));
  const alive = procs.filter((p) => !p.killed);
  const zombie = procs.find((p) => p.killed);
  const render = (p) => { p.fill.style.transform = `scaleX(${p.v / MAX_CPU})`; p.num.textContent = Math.round(p.v); };
  let beat = 0;

  return {
    tick() {
      alive.forEach((p) => {
        const to = Math.max(2, Math.min(MAX_CPU, p.cpu + (Math.random() - 0.5) * 14));
        gsap.to(p, { v: to, duration: 0.6, ease: 'power2.out', onUpdate: () => render(p) });
      });
      if (!zombie) return;
      beat++;
      const label = $('.htop-kill', zombie.row);
      if (beat % 6 === 4) { zombie.row.classList.add('is-respawn'); label.textContent = 'respawning…'; }
      if (beat % 6 === 5) { zombie.row.classList.remove('is-respawn'); label.textContent = 'SIGKILL'; }
    },
    /** static state for reduced motion */
    settle() { alive.forEach((p) => { p.v = p.cpu; render(p); }); },
  };
}
