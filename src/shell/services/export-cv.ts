// STUB (S0): replaced in S1 (legacy/src/app/export-cv.js).
import { CV_PDF_PATH } from '@/shared/site';

/** Every `.js-export` link downloads the prebuilt PDF and shows a toast; `exportCv` does the same from code. */
export function createExport(_toast: (html: string) => void, _signal: AbortSignal): { exportCv(): void } {
  return { exportCv: () => window.open(CV_PDF_PATH) };
}
