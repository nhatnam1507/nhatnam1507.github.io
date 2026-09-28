// Every `.js-export` link downloads the prebuilt PDF and shows a toast.
import { $, $$ } from '../shared/dom.js';

const PDF_NAME = 'Nam_Nguyen_Nhat_CV.pdf';
const TOAST_MS = 2800;

export function attachExport() {
  const toast = $('.toast');
  let timer;
  const show = (html) => {
    toast.innerHTML = html;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-on'), TOAST_MS);
  };
  $$('.js-export').forEach((btn) => {
    btn.setAttribute('download', PDF_NAME);
    btn.addEventListener('click', () => show(`<b>✓</b> exporting ${PDF_NAME}`));
  });
}
