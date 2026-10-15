// The page's single toast (`.toast`, rendered by chrome/Toast): one message at
// a time (ported from legacy/src/app/toast.js).
import { $req } from '@/shared/dom';

const TOAST_MS = 2800;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Show `html` in the toast for a few seconds. */
export function showToast(html: string): void {
  const toast = $req('.toast');
  toast.innerHTML = html;
  toast.classList.add('is-on');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('is-on'), TOAST_MS);
}
