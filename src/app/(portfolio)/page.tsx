// The portfolio: chrome + every block from the registry, server-rendered at
// build time, plus the client runtime that mounts their behaviours.
import { Chrome } from '@/shell/chrome';
import { createPageContext } from '@/shell/context';
import { blockMeta, blocks, sectionMeta, sections } from '@/shell/registry';
import { PageRuntime } from '@/shell/runtime';
import { SectionFrame } from '@/shell/SectionFrame';
import { CV_PDF_PATH } from '@/shared/site';

const PERSON_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Nam Nguyen Nhat',
  jobTitle: 'Senior Software Engineer',
  address: { '@type': 'PostalAddress', addressLocality: 'Hanoi', addressCountry: 'VN' },
  sameAs: ['https://github.com/nhatnam1507', 'https://www.linkedin.com/in/nhatnam1507'],
};

export default function PortfolioPage() {
  const now = new Date(); // build time (PLAN.md D9); the weekly deploy keeps it fresh
  const page = createPageContext(now);
  const indexOf = (id: string) => sections.findIndex((s) => s.id === id);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }} />
      <Chrome sections={sectionMeta} now={now}>
        <main id="app">
          {blocks.map((block) => (
            <SectionFrame key={block.id} block={block} index={indexOf(block.id)} page={page} />
          ))}
        </main>
        <noscript>
          <p style={{ padding: '120px 24px', fontFamily: 'monospace' }}>
            This portfolio needs JavaScript. <a href={CV_PDF_PATH}>Download the CV (PDF)</a>.
          </p>
        </noscript>
      </Chrome>
      <PageRuntime blocks={blockMeta} nowISO={now.toISOString()} />
    </>
  );
}
