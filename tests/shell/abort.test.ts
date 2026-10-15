// onAbort is how every service undoes its setup on teardown.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { onAbort } from '@/shell/services/abort';

test('onAbort runs the undo once when the signal aborts', () => {
  const controller = new AbortController();
  let calls = 0;
  onAbort(controller.signal, () => calls++);
  assert.equal(calls, 0);
  controller.abort();
  assert.equal(calls, 1);
});

test('onAbort runs the undo immediately if the signal already aborted', () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  onAbort(controller.signal, () => calls++);
  assert.equal(calls, 1);
});
