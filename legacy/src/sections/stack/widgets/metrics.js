// Throughput bars, p99 latency and the Kafka queue lights.
import { $, $$ } from '../../../shared/dom.js';

export function createMetrics(root) {
  const bars = $$('.js-rps i', root);
  const p99 = $('.js-p99', root);
  const queue = $$('.js-queue i', root);
  let q = 0;
  return {
    tick() {
      bars.forEach((b) => { b.style.transform = `scaleY(${(0.25 + Math.random() * 0.75).toFixed(2)})`; });
      p99.textContent = 36 + ((Math.random() * 14) | 0);
      queue.forEach((m, i) => m.classList.toggle('is-on', (i + q) % 3 === 0));
      q++;
    },
  };
}
