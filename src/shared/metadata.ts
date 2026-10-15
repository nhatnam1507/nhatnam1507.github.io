// <head> bits shared by both root layouts (portfolio and print).
import type { Metadata } from 'next';
import { preload } from 'react-dom';

const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23050608'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' dominant-baseline='middle' font-family='monospace' font-weight='700' font-size='30' fill='%232ef2b0'%3E%3E_%3C/text%3E%3C/svg%3E";

export const baseMetadata: Metadata = {
  icons: { icon: ICON },
};

const FONTS = ['/assets/fonts/Geist-Variable.woff2', '/assets/fonts/GeistMono-Variable.woff2'];

/** Preload the two variable fonts every page uses (call from a root layout; React dedupes and hoists). */
export function preloadFonts(): void {
  FONTS.forEach((href) => preload(href, { as: 'font', type: 'font/woff2', crossOrigin: '' }));
}
