// Reusable markup partials for Views (Server Components). Same markup as the
// legacy string partials, so the CSS applies unchanged.
import type { CSSProperties } from 'react';
import { pad2 } from './dom';
import { CV_PDF_NAME, CV_PDF_PATH } from './site';

/** Inline CSS custom properties (React's CSSProperties doesn't know `--x`). */
export const cssVars = (vars: Record<`--${string}`, string | number>): CSSProperties => vars as CSSProperties;

/** '01 // about' label above a section heading; the number comes from page order. */
export function Kicker({ index, label }: { index: number; label: string }) {
  return (
    <p className="kicker">
      <span>{pad2(index)}</span>
      {` // ${label}`}
    </p>
  );
}

export const ICONS = {
  download: 'M12 3v12m0 0-5-5m5 5 5-5M5 21h14',
  arrowRight: 'M5 12h14m0 0-6-6m6 6-6 6',
  arrowUpRight: 'M7 17 17 7m0 0H8m9 0v9',
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** The "Export CV" button; the shell wires every `.js-export` to the PDF. */
export function ExportButton({ label = 'Export CV.pdf', size = '' }: { label?: string; size?: '' | 'sm' | 'lg' }) {
  return (
    <a className={`btn btn-primary${size ? ` btn-${size}` : ''} js-export`} href={CV_PDF_PATH} download={CV_PDF_NAME}>
      <Icon name="download" />
      <span>{label}</span>
    </a>
  );
}
