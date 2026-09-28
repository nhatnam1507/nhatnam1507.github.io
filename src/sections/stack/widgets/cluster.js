// Kubernetes pods grid: now and then a pod restarts and self-heals.
import { $, $$ } from '../../../shared/dom.js';

const RESTART_MS = 1300;

export function createCluster(root) {
  const pods = $$('.js-pods i', root);
  const count = $('.js-pods-n', root);
  const total = pods.length;
  return {
    tick() {
      const pod = pods[(Math.random() * total) | 0];
      pod.classList.add('is-restart');
      count.textContent = `${total - 1}/${total}`;
      setTimeout(() => { pod.classList.remove('is-restart'); count.textContent = `${total}/${total}`; }, RESTART_MS);
    },
  };
}
