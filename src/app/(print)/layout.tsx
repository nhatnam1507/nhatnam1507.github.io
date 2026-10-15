import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { baseMetadata, preloadFonts } from '@/shared/metadata';
import '@/shared/styles/fonts.css';
import '@/cv/cv.css';

export const metadata: Metadata = {
  ...baseMetadata,
  title: 'CV — Nam Nguyen Nhat',
  description: 'Printable CV of Nam Nguyen Nhat, Senior Software Engineer.',
  robots: { index: false },
};

export default function PrintLayout({ children }: { children: ReactNode }) {
  preloadFonts();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
