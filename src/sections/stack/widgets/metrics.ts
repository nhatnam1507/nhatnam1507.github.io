// Throughput bars, p99 latency and the Kafka queue lights.
import { $req, $$ } from '@/shared/dom';

export function createMetrics(root: HTMLElement) {
  const bars = $$('.js-rps i', root);
  const p99 = $req('.js-p99', root);
  const queue = $$('.js-queue i', root);
  let q = 0;
  return {
    tick(): void {
      bars.forEach((b) => {
        b.style.transform = `scaleY(${(0.25 + Math.random() * 0.75).toFixed(2)})`;
      });
      p99.textContent = String(36 + Math.floor(Math.random() * 14));
      queue.forEach((m, i) => m.classList.toggle('is-on', (i + q) % 3 === 0));
      q++;
    },
  };
}
