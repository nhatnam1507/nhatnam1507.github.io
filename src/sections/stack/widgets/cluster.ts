// Kubernetes pods grid: now and then a pod restarts and self-heals.
import { $req, $$ } from '@/shared/dom';
import { settleLater } from './settle';

const RESTART_MS = 1300;

export function createCluster(root: HTMLElement, signal: AbortSignal) {
  const pods = $$('.js-pods i', root);
  const count = $req('.js-pods-n', root);
  const total = pods.length;
  return {
    tick(): void {
      const pod = pods[Math.floor(Math.random() * total)];
      if (!pod) return;
      pod.classList.add('is-restart');
      count.textContent = `${total - 1}/${total}`;
      settleLater(
        signal,
        () => {
          pod.classList.remove('is-restart');
          count.textContent = `${total}/${total}`;
        },
        RESTART_MS,
      );
    },
  };
}
