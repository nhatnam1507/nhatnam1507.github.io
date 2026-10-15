// Hanoi wall clock + career uptime (years/months and a live seconds counter).
import { uptime } from '@/domain/career';

/** The big "2y 3m" and the grouped seconds counter. */
export function uptimeText(since: string, now: Date): { big: string; seconds: string } {
  const u = uptime(since, now);
  return { big: `${u.years}y ${u.months}m`, seconds: u.seconds.toLocaleString('en-US') };
}

export interface UptimeParts {
  clock: HTMLElement;
  big: HTMLElement;
  seconds: HTMLElement;
}

export interface Uptime {
  tick(): void;
}

export function createUptime(
  { clock, big, seconds }: UptimeParts,
  { since, formatTime }: { since: string; formatTime: (d: Date) => string },
): Uptime {
  return {
    tick() {
      const now = new Date();
      const text = uptimeText(since, now);
      clock.textContent = `Hanoi ${formatTime(now)}`;
      big.textContent = text.big;
      seconds.textContent = text.seconds;
    },
  };
}
