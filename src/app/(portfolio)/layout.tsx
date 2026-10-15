import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { baseMetadata, preloadFonts } from '@/shared/metadata';
import { SITE_URL } from '@/shared/site';
import '@/styles/portfolio.css';

const TITLE = 'Nam Nguyen Nhat — Senior Software Engineer';

export const metadata: Metadata = {
  ...baseMetadata,
  title: TITLE,
  description:
    'Nam Nguyen Nhat — Senior Software Engineer in Hanoi. Backend, cloud and DevOps: Go, Kubernetes, AWS, gRPC, CI/CD.',
  openGraph: {
    type: 'website',
    title: TITLE,
    description: 'Backend · Cloud · DevOps. Go, Kubernetes, AWS, gRPC, CI/CD.',
    url: SITE_URL,
  },
  twitter: { card: 'summary' },
};

export const viewport: Viewport = { themeColor: '#050608' };

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  preloadFonts();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
