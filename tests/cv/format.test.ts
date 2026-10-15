import { describe, expect, it } from 'vitest';
import { contactRows, joinList } from '@/cv/format';
import type { Contact } from '@/domain/types';

const contact: Contact = {
  email: 'jane@example.com',
  phone: '0123456789',
  linkedin: 'linkedin.com/in/jane',
  github: 'github.com/jane',
};

describe('contactRows', () => {
  it('lists mail, phone, linkedin, github and the site, each with a link', () => {
    expect(contactRows(contact)).toEqual([
      { key: 'mail', label: 'jane@example.com', href: 'mailto:jane@example.com' },
      { key: 'phone', label: '0123456789', href: 'tel:0123456789' },
      { key: 'in', label: 'linkedin.com/in/jane', href: 'https://www.linkedin.com/in/jane' },
      { key: 'gh', label: 'github.com/jane', href: 'https://github.com/jane' },
      { key: 'web', label: 'nhatnam1507.github.io', href: 'https://nhatnam1507.github.io' },
    ]);
  });

  it('skips the phone row when there is no phone', () => {
    const keys = contactRows({ ...contact, phone: undefined }).map((row) => row.key);
    expect(keys).toEqual(['mail', 'in', 'gh', 'web']);
  });
});

describe('joinList', () => {
  it('joins with a middle dot', () => {
    expect(joinList(['Go', 'C++', 'Linux'])).toBe('Go · C++ · Linux');
  });

  it('handles empty and single-item lists', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['Go'])).toBe('Go');
  });
});
