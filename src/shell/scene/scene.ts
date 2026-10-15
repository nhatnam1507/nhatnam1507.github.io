// STUB (S0): replaced in S2 with the Three.js particle scene (legacy/src/app/scene/scene.js).
import type { SceneHandle, ShapeName } from '../contract';

export interface SceneOptions {
  /** one shape per section, in registry order */
  shapes: readonly ShapeName[];
  reducedMotion: boolean;
  /** stops the render loop and frees GPU resources on abort */
  signal: AbortSignal;
}

/** Throws when WebGL is unavailable (the runtime then continues without a scene). */
export function createScene(_canvas: HTMLCanvasElement, _opts: SceneOptions): SceneHandle {
  throw new Error('scene not implemented yet (S2)');
}
