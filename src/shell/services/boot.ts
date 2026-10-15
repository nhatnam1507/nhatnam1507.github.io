// STUB (S0): replaced in S1 with the legacy boot screen (legacy/src/app/boot.js).
import type { Env } from '@/shared/env';
import { $ } from '@/shared/dom';

/** Resolves once the page underneath should start its intro. Never remove #boot (React owns it): hide it. */
export function boot(_env: Env, _signal: AbortSignal): Promise<void> {
  const el = $('#boot');
  if (el) el.hidden = true;
  return Promise.resolve();
}
