// The "copy" button on the email endpoint: copies to the clipboard and says so,
// or opens the mail client when the clipboard is off limits.
const COPIED_MS = 1600;

export function attachCopy(btn: HTMLElement, toast: (html: string) => void, signal: AbortSignal): void {
  const value = btn.dataset.copy ?? '';
  let reset: ReturnType<typeof setTimeout> | undefined;
  const restore = () => {
    btn.textContent = 'copy';
    btn.classList.remove('is-done');
  };

  btn.addEventListener(
    'click',
    async () => {
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = 'copied ✓';
        btn.classList.add('is-done');
        toast(`<b>✓</b> ${value} copied`);
        clearTimeout(reset);
        reset = setTimeout(restore, COPIED_MS);
      } catch {
        location.href = `mailto:${value}`; // no clipboard access: fall back to the mail client
      }
    },
    { signal },
  );
  signal.addEventListener(
    'abort',
    () => {
      clearTimeout(reset);
      restore();
    },
    { once: true },
  );
}
