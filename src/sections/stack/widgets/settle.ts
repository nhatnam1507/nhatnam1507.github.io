// A one-shot timer that also fires when the signal aborts, so a widget never
// stays frozen mid-state (a pod blinking, a token "verifying") after teardown.
// Candidate to promote to shared/motion.
export function settleLater(signal: AbortSignal, fn: () => void, ms: number): void {
  if (signal.aborted) {
    fn();
    return;
  }
  const done = () => {
    clearTimeout(timer);
    signal.removeEventListener('abort', done);
    fn();
  };
  const timer = setTimeout(done, ms);
  signal.addEventListener('abort', done, { once: true });
}
