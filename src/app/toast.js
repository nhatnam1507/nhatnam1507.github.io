// The page's single toast (`.toast` in index.html): one message at a time.
import { $ } from '../shared/dom.js';

const TOAST_MS = 2800;
let timer;

/** Show `html` in the toast for a few seconds. */
export function showToast(html) {
  const toast = $('.toast');
  toast.innerHTML = html;
  toast.classList.add('is-on');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('is-on'), TOAST_MS);
}
