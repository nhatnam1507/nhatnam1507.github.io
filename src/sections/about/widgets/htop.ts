// htop — "brain.processes": CPU bars that jitter, plus a deploy-on-friday.sh
// that keeps respawning and getting SIGKILLed. The View renders the rows; this
// widget animates them.
import { gsap } from '@/shared/lib';
import { $req } from '@/shared/dom';
import type { Process } from '../content';

export const MAX_CPU = 60;

/** A jittered CPU reading around `base`, clamped to 2‥MAX_CPU. `rand` is in 0‥1. */
export const nextCpu = (base: number, rand: number): number => Math.max(2, Math.min(MAX_CPU, base + (rand - 0.5) * 14));

export type ZombiePhase = 'respawn' | 'killed' | null;

/** The zombie's cycle: killed → (beat 4) respawning → (beat 5) killed again, every 6 beats. */
export function zombiePhase(beat: number): ZombiePhase {
  if (beat % 6 === 4) return 'respawn';
  if (beat % 6 === 5) return 'killed';
  return null;
}

interface Live {
  cpu: number;
  /** current animated value */
  v: number;
  fill: HTMLElement;
  num: HTMLElement;
}

export interface Htop {
  tick(): void;
  /** static state for reduced motion */
  settle(): void;
  /** stop any in-flight tweens (teardown) */
  kill(): void;
}

export function createHtop(el: HTMLElement, processes: readonly Process[]): Htop {
  const alive: Live[] = [];
  let zombie: HTMLElement | null = null;
  processes.forEach((p, i) => {
    const row = $req(`.htop-row:nth-child(${i + 2})`, el); // child 1 is the header
    if (p.killed) zombie = row;
    else alive.push({ cpu: p.cpu, v: 0, fill: $req('.htop-bar > i', row), num: $req('.htop-cpu b', row) });
  });
  const render = (p: Live) => {
    p.fill.style.transform = `scaleX(${p.v / MAX_CPU})`;
    p.num.textContent = String(Math.round(p.v));
  };
  let beat = 0;

  return {
    tick() {
      alive.forEach((p) => {
        gsap.to(p, { v: nextCpu(p.cpu, Math.random()), duration: 0.6, ease: 'power2.out', onUpdate: () => render(p) });
      });
      if (!zombie) return;
      beat++;
      const phase = zombiePhase(beat);
      if (!phase) return;
      const label = $req('.htop-kill', zombie);
      zombie.classList.toggle('is-respawn', phase === 'respawn');
      label.textContent = phase === 'respawn' ? 'respawning…' : 'SIGKILL';
    },
    settle() {
      alive.forEach((p) => {
        p.v = p.cpu;
        render(p);
      });
    },
    kill() {
      gsap.killTweensOf(alive);
    },
  };
}
