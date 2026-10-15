// The fixed page chrome around the sections (legacy/index.html minus <head>).
// Server Components throughout: ids and classes are the hooks the shell
// services select, so keep them. Stateless on purpose (PLAN.md §7 rule 2).
import type { ReactNode } from 'react';
import type { SectionMeta } from '../contract';
import { Backdrop } from './Backdrop';
import { Boot } from './Boot';
import { Cursor } from './Cursor';
import { Curtain } from './Curtain';
import { Footer } from './Footer';
import { Hud } from './Hud';
import { Nav } from './Nav';
import { Toast } from './Toast';

interface ChromeProps {
  sections: readonly SectionMeta[];
  now: Date;
  children: ReactNode;
}

export function Chrome({ sections, now, children }: ChromeProps) {
  return (
    <>
      <Boot />
      <Backdrop />
      <Cursor />
      <Curtain />
      <Nav sections={sections} />
      <Hud sections={sections} />
      {children}
      <Footer now={now} />
      <Toast />
    </>
  );
}
