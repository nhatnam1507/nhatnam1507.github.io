// Top nav: logo, links generated from the registry, and the Export CV button.
// The links' `data-scroll-to` is wired by services/navigation, `.js-export` by services/export-cv.
import { ExportButton } from '@/shared/ui';
import type { SectionMeta } from '../contract';
import { navItems } from './model';

export function Nav({ sections }: { sections: readonly SectionMeta[] }) {
  return (
    <header className="nav">
      <a className="logo" href="#hero" data-scroll-to="">
        <span className="logo-prompt">nam@dev</span>
        <span className="logo-path">:~$</span>
        <span className="caret"></span>
      </a>
      <nav className="nav-links" aria-label="Sections">
        {navItems(sections).map(({ id, number, text }) => (
          <a key={id} href={`#${id}`} data-scroll-to="">
            <span>{number}</span>
            {text}
          </a>
        ))}
      </nav>
      <ExportButton size="sm" label="Export CV" />
    </header>
  );
}
