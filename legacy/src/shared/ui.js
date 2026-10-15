// Reusable markup partials (the future "components/ui" folder).
import { esc, pad2 } from './dom.js';

/** '01 // about' label above a section heading; the number comes from page order. */
export const kicker = (index, label) => `<p class="kicker"><span>${pad2(index)}</span> // ${esc(label)}</p>`;

const ICONS = {
  download: 'M12 3v12m0 0-5-5m5 5 5-5M5 21h14',
  arrowRight: 'M5 12h14m0 0-6-6m6 6-6 6',
  arrowUpRight: 'M7 17 17 7m0 0H8m9 0v9',
};
export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}" /></svg>`;

/** The "Export CV" button; the app wires every `.js-export` to the PDF. */
export const exportButton = ({ label = 'Export CV.pdf', size = '' } = {}) =>
  `<a class="btn btn-primary${size ? ` btn-${size}` : ''} js-export" href="assets/cv/Nam_Nguyen_Nhat_CV.pdf" download>${icon('download')}<span>${esc(label)}</span></a>`;
