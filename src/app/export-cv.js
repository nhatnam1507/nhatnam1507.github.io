// Every `.js-export` link downloads the prebuilt PDF and shows a toast.
import { $$ } from '../shared/dom.js';
import { showToast } from './toast.js';

const PDF_NAME = 'Nam_Nguyen_Nhat_CV.pdf';

export function attachExport() {
  $$('.js-export').forEach((btn) => {
    btn.setAttribute('download', PDF_NAME);
    btn.addEventListener('click', () => showToast(`<b>✓</b> exporting ${PDF_NAME}`));
  });
}
