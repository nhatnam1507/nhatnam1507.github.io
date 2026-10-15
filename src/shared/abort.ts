// Teardown helper shared by the services and behaviours: run `undo` when `signal` aborts
// (immediately if it already has), so every service undoes its own setup.

export function onAbort(signal: AbortSignal, undo: () => void): void {
  if (signal.aborted) undo();
  else signal.addEventListener('abort', undo, { once: true });
}
