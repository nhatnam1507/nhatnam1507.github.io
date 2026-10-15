// Printable A4 CV markup, rendered at build time from the same content as the portfolio.
import type { ReactNode } from 'react';
import type { Experience, Profile } from '@/domain/types';
import { pad2 } from '@/shared/dom';
import { contactRows, joinList } from './format';

function Block({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="block">
      <h2>
        <span>{pad2(index)}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Job({ job }: { job: Experience }) {
  return (
    <section className="job">
      <div className="job-when">
        <span>{job.start}</span>
        <span>{job.end}</span>
      </div>
      <div className="job-body">
        <h3>
          {job.role} <span className="at">· {job.company}</span>
        </h3>
        {job.project && <div className="job-project">Project: {job.project}</div>}
        <ul>
          {job.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <div className="job-tags">{joinList(job.tags)}</div>
      </div>
    </section>
  );
}

export function CvSheet({ profile: p }: { profile: Profile }) {
  return (
    <article className="sheet" id="cv">
      <header className="head">
        <div>
          <div className="prompt">nam@dev:~$ cat cv.pdf</div>
          <h1>{p.name}</h1>
          <p className="role">
            {p.title} <span>— {p.tagline}</span>
          </p>
        </div>
        <ul className="contact">
          <li>
            <span className="k">loc</span> {p.location}
          </li>
          {contactRows(p.contact).map((row) => (
            <li key={row.key}>
              <span className="k">{row.key}</span> <a href={row.href}>{row.label}</a>
            </li>
          ))}
        </ul>
      </header>

      <Block index={1} title="Summary">
        <p className="summary">{p.summary}</p>
      </Block>

      <Block index={2} title="Technologies">
        <dl className="skills">
          <div className="skills-row core">
            <dt>core</dt>
            <dd>{joinList(p.skills.core)}</dd>
          </div>
          {p.skills.groups.map((group) => (
            <div className="skills-row" key={group.label}>
              <dt>{group.label}</dt>
              <dd>{joinList(group.items)}</dd>
            </div>
          ))}
          <div className="skills-row">
            <dt>exploring</dt>
            <dd>{joinList(p.skills.exploring)}</dd>
          </div>
        </dl>
      </Block>

      <Block index={3} title="Experience">
        {/* index keys: two roles can share company, title and start month */}
        {p.experience.map((job, i) => (
          <Job job={job} key={i} />
        ))}
      </Block>

      <div className="two">
        <Block index={4} title="Certificates">
          {p.certificates.map((cert) => (
            <div className="item" key={cert.id}>
              <div className="item-title">{cert.name}</div>
              <div className="item-meta">
                {cert.date} · <span className="mono">{cert.id}</span>
              </div>
            </div>
          ))}
        </Block>
        <Block index={5} title="Education">
          {p.education.map((edu) => (
            <div className="item" key={`${edu.school}-${edu.start}`}>
              <div className="item-title">{edu.school}</div>
              <div className="item-sub">{edu.degree}</div>
              <div className="item-meta">
                {edu.start} – {edu.end}
              </div>
            </div>
          ))}
        </Block>
      </div>
    </article>
  );
}
