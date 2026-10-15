// The CV's shape. content/profile.ts is typed by these, and the domain rules
// (career.ts, profile-rules.ts) work on them. Pure types, no runtime code.

export interface Contact {
  email: string;
  phone?: string;
  linkedin: string;
  github: string;
}

export interface Impact {
  value: string;
  label: string;
}

export interface Experience {
  role: string;
  company: string;
  project?: string;
  location: string;
  /** "Mon YYYY" */
  start: string;
  /** "Mon YYYY" or "Present" */
  end: string;
  bullets: string[];
  tags: string[];
  // portfolio-only fields (the PDF ignores them)
  label: string;
  highlight: string;
  impact: Impact;
}

export interface Education {
  school: string;
  degree: string;
  start: string;
  end: string;
}

export interface Certificate {
  name: string;
  short: string;
  issuer: string;
  id: string;
  date: string;
  badge: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Skills {
  core: string[];
  exploring: string[];
  groups: SkillGroup[];
}

export interface Profile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  /** ISO date, in the earliest role's month */
  careerStart: string;
  contact: Contact;
  summary: string;
  /** newest first */
  experience: Experience[];
  education: Education[];
  certificates: Certificate[];
  skills: Skills;
}

/** Role entity: an experience entry enriched with its time range (month indexes). */
export interface Role extends Omit<Experience, 'start' | 'end'> {
  /** the original "Mon YYYY" labels */
  startLabel: string;
  endLabel: string;
  /** month index (year * 12 + month) */
  start: number;
  /** month index; "Present" resolves to the month of `now` */
  end: number;
  /** tenure in months (>= 1) */
  months: number;
  /** first word of the company, e.g. "Toshiba" */
  employer: string;
}

/** Headline numbers used across the page. */
export interface CareerStats {
  years: number;
  roles: number;
  employers: number;
}
