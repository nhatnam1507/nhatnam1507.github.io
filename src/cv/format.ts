// Pure formatting rules for the printable CV (kept out of the JSX so they can be unit-tested).
import type { Contact } from '@/domain/types';
import { SITE_URL } from '@/shared/site';

export interface ContactRow {
  /** short key shown in the left column ("mail", "in", ...) */
  key: string;
  label: string;
  href: string;
}

/** The contact list under the name. A missing phone number is skipped rather than printed as "undefined". */
export function contactRows({ email, phone, linkedin, github }: Contact): ContactRow[] {
  const rows: ContactRow[] = [{ key: 'mail', label: email, href: `mailto:${email}` }];
  if (phone) rows.push({ key: 'phone', label: phone, href: `tel:${phone}` });
  rows.push(
    { key: 'in', label: linkedin, href: `https://www.${linkedin}` },
    { key: 'gh', label: github, href: `https://${github}` },
    { key: 'web', label: new URL(SITE_URL).host, href: SITE_URL.replace(/\/$/, '') },
  );
  return rows;
}

/** Skills and tags are printed as "a · b · c". */
export const joinList = (items: readonly string[]): string => items.join(' · ');
