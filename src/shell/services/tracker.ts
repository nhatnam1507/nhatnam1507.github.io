// STUB (S0): replaced in S1 with scroll → scene / HUD / nav tracking (legacy/src/app/tracker.js).
import type { SceneHandle, SectionMeta } from '../contract';

export interface TrackerOptions {
  sections: readonly SectionMeta[];
  scene: SceneHandle | null;
  signal: AbortSignal;
}

export function startTracker(_opts: TrackerOptions): void {}
