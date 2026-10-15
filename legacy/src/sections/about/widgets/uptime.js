// Hanoi wall clock + career uptime (years/months and a live seconds counter).
import { uptime } from '../../../domain/career.js';

export function createUptime({ clock, big, seconds }, { since, formatTime }) {
  return {
    tick() {
      const now = new Date();
      const u = uptime(since, now);
      clock.textContent = `Hanoi ${formatTime(now)}`;
      big.textContent = `${u.years}y ${u.months}m`;
      seconds.textContent = u.seconds.toLocaleString('en-US');
    },
  };
}
