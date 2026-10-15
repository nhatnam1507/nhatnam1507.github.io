// Every `.js-export` link downloads the prebuilt PDF and shows a toast
// (ported from legacy/src/app/export-cv.js).
import { CV_PDF_NAME, CV_PDF_PATH } from '@/shared/site';

/**
 * One delegated listener serves every `.js-export` anchor (the links keep
 * working without JS: `href` + `download`). `exportCv` clicks a temporary
 * `.js-export` anchor, so the download and the toast share a single path.
 */
export function createExport(toast: (html: string) => void, signal: AbortSignal): { exportCv(): void } {
  document.addEventListener(
    'click',
    (e) => {
      if (e.target instanceof Element && e.target.closest('.js-export')) toast(`<b>✓</b> exporting ${CV_PDF_NAME}`);
    },
    { signal },
  );

  return {
    exportCv() {
      const a = document.createElement('a');
      a.className = 'js-export';
      a.href = CV_PDF_PATH;
      a.download = CV_PDF_NAME;
      a.hidden = true;
      document.body.append(a); // attached so the click bubbles to the delegated listener
      a.click();
      a.remove();
    },
  };
}
