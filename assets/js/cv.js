// Renders the printable CV (cv.html) from the shared data.
import { cv } from './data.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const c = cv.contact;

const contact = [
  ['mail', c.email, `mailto:${c.email}`],
  ['phone', c.phone, `tel:${c.phone}`],
  ['in', c.linkedin, `https://www.${c.linkedin}`],
  ['gh', c.github, `https://${c.github}`],
  ['web', 'nhatnam1507.github.io', 'https://nhatnam1507.github.io'],
];

const job = (j) => `
  <section class="job">
    <div class="job-when">
      <span>${esc(j.start)}</span>
      <span>${esc(j.end)}</span>
    </div>
    <div class="job-body">
      <h3>${esc(j.role)} <span class="at">· ${esc(j.company)}</span></h3>
      ${j.project ? `<div class="job-project">Project: ${esc(j.project)}</div>` : ''}
      <ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <div class="job-tags">${j.tags.map(esc).join(' · ')}</div>
    </div>
  </section>`;

document.getElementById('cv').innerHTML = `
  <header class="head">
    <div>
      <div class="prompt">nam@dev:~$ cat cv.pdf</div>
      <h1>${esc(cv.name)}</h1>
      <p class="role">${esc(cv.title)} <span>— ${esc(cv.tagline)}</span></p>
    </div>
    <ul class="contact">
      <li><span class="k">loc</span> ${esc(cv.location)}</li>
      ${contact.map(([k, v, href]) => `<li><span class="k">${k}</span> <a href="${href}">${esc(v)}</a></li>`).join('')}
    </ul>
  </header>

  <section class="block">
    <h2><span>01</span> Summary</h2>
    <p class="summary">${esc(cv.summary)}</p>
  </section>

  <section class="block">
    <h2><span>02</span> Technologies</h2>
    <dl class="skills">
      <div class="skills-row core"><dt>core</dt><dd>${cv.skills.core.map(esc).join(' · ')}</dd></div>
      ${cv.skills.groups.map((g) => `<div class="skills-row"><dt>${esc(g.label)}</dt><dd>${g.items.map(esc).join(' · ')}</dd></div>`).join('')}
      <div class="skills-row"><dt>exploring</dt><dd>${cv.skills.exploring.map(esc).join(' · ')}</dd></div>
    </dl>
  </section>

  <section class="block">
    <h2><span>03</span> Experience</h2>
    ${cv.experience.map(job).join('')}
  </section>

  <div class="two">
    <section class="block">
      <h2><span>04</span> Certificates</h2>
      ${cv.certificates.map((x) => `
        <div class="item">
          <div class="item-title">${esc(x.name)}</div>
          <div class="item-meta">${esc(x.date)} · <span class="mono">${esc(x.id)}</span></div>
        </div>`).join('')}
    </section>
    <section class="block">
      <h2><span>05</span> Education</h2>
      ${cv.education.map((e) => `
        <div class="item">
          <div class="item-title">${esc(e.school)}</div>
          <div class="item-sub">${esc(e.degree)}</div>
          <div class="item-meta">${esc(e.start)} – ${esc(e.end)}</div>
        </div>`).join('')}
    </section>
  </div>
`;

document.querySelector('.js-print').addEventListener('click', () => window.print());
document.fonts.ready.then(() => document.body.classList.add('is-ready'));
