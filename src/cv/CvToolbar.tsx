'use client';

// The CV page's only client island: the print button, and the `body.is-ready` signal
// that scripts/build-pdf.ts waits for (fonts loaded, so the PDF uses the real faces).
import { useEffect } from 'react';
import { CV_PDF_NAME, CV_PDF_PATH } from '@/shared/site';

export function CvToolbar() {
  useEffect(() => {
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) document.body.classList.add('is-ready');
    });
    return () => {
      active = false;
      document.body.classList.remove('is-ready');
    };
  }, []);

  return (
    <div className="toolbar">
      {/* Plain anchor: it crosses root layouts, so it must be a full page load. */}
      <a href="/" className="tb-link">
        ← portfolio
      </a>
      <span className="tb-title">cv.pdf — A4 template</span>
      <div className="tb-actions">
        <button type="button" className="tb-btn" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <a className="tb-btn tb-primary" href={CV_PDF_PATH} download={CV_PDF_NAME}>
          Download PDF
        </a>
      </div>
    </div>
  );
}
