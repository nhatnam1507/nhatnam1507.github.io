// STUB (S0): replaced in S1 with the curtain jumps (legacy/src/app/navigation.js).
import type { Lenis } from '@/shared/lib';
import type { SceneHandle, SectionId } from '../contract';

export interface JumpOptions {
  lenis: Lenis | null;
  scene: SceneHandle | null;
  reducedMotion: boolean;
  signal: AbortSignal;
}

/** Wires `[data-scroll-to]` links and returns the same jump as a service. */
export function attachJumps(_opts: JumpOptions): { navigate(id: SectionId): void } {
  return { navigate: (id) => document.getElementById(id)?.scrollIntoView() };
}
