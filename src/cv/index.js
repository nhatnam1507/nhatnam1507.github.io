// cv.html entry: render the printable CV and wire the toolbar.
// body.is-ready tells scripts/build-pdf.mjs that fonts are loaded.
import { profile } from '../content/profile.js';
import { $ } from '../shared/dom.js';
import { cvTemplate } from './template.js';

$('#cv').innerHTML = cvTemplate(profile);
$('.js-print').addEventListener('click', () => window.print());
document.fonts.ready.then(() => document.body.classList.add('is-ready'));
