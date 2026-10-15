// The copy button talks to the injected toast service (never the toast module)
// and falls back to the mail client without clipboard access. No DOM needed:
// a button is just an event target with a few properties.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { attachCopy } from '@/sections/contact/widgets/copy';

const EMAIL = 'ada@example.com';

function fakeButton(): HTMLElement {
  const classes = new Set<string>();
  const btn = Object.assign(new EventTarget(), {
    dataset: { copy: EMAIL },
    textContent: 'copy',
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
  });
  return btn as unknown as HTMLElement;
}

/** Fire a click and let the async handler settle. */
async function click(btn: HTMLElement): Promise<void> {
  btn.dispatchEvent(new Event('click'));
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('copies the address, confirms on the button, calls the toast service, then resets', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const toast = vi.fn();
  const btn = fakeButton();
  attachCopy(btn, toast, new AbortController().signal);

  await click(btn);
  expect(writeText).toHaveBeenCalledWith(EMAIL);
  expect(btn.textContent).toBe('copied ✓');
  expect(btn.classList.contains('is-done')).toBe(true);
  expect(toast).toHaveBeenCalledExactlyOnceWith(`<b>✓</b> ${EMAIL} copied`);

  await vi.advanceTimersByTimeAsync(1600);
  expect(btn.textContent).toBe('copy');
  expect(btn.classList.contains('is-done')).toBe(false);
});

test('without clipboard access it opens the mail client and does not toast', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
  const loc = { href: '' };
  vi.stubGlobal('location', loc);
  const toast = vi.fn();
  const btn = fakeButton();
  attachCopy(btn, toast, new AbortController().signal);

  await click(btn);
  expect(loc.href).toBe(`mailto:${EMAIL}`);
  expect(toast).not.toHaveBeenCalled();
});

test('aborting removes the listener and restores the label (StrictMode teardown)', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const controller = new AbortController();
  const btn = fakeButton();
  attachCopy(btn, vi.fn(), controller.signal);

  await click(btn);
  expect(btn.textContent).toBe('copied ✓');

  controller.abort();
  expect(btn.textContent).toBe('copy');
  expect(btn.classList.contains('is-done')).toBe(false);

  await click(btn);
  expect(writeText).toHaveBeenCalledTimes(1);
});
